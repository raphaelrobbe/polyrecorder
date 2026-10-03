import { prisma } from '../db.server'
import { getUserFromRequest } from '../auth.server'
import type {
  AccountLibraryStats,
  CloudFailureReason,
  LibraryGroupLevelItem,
  LibraryRepertoireLevelItem,
  LibrarySongLevelItem,
  LibraryTree,
} from './types'
import { ensureDefaultTree, isUser, requireUser } from './helpers.server'

export async function getLibraryTree(
  request: Request,
): Promise<
  | { ok: true; tree: LibraryTree }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr

  await ensureDefaultTree(user.id)

  const groups = await prisma.group.findMany({
    where: { userId: user.id },
    orderBy: { sortOrder: 'asc' },
    include: {
      repertoires: {
        orderBy: { sortOrder: 'asc' },
        include: {
          songs: {
            orderBy: { sortOrder: 'asc' },
            include: {
              parts: {
                orderBy: { sortOrder: 'asc' },
                include: {
                  tracks: {
                    where: { uploadedAt: { not: null } },
                    orderBy: { createdAt: 'asc' },
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  return {
    ok: true,
    tree: {
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        repertoires: group.repertoires.map((rep) => ({
          id: rep.id,
          name: rep.name,
          songs: rep.songs.map((song) => {
            // Parts may be touched without the song (older rows) — keep the max.
            const lastOpenedAt = song.parts.reduce(
              (latest, part) =>
                part.lastOpenedAt > latest ? part.lastOpenedAt : latest,
              song.lastOpenedAt,
            )
            return {
              id: song.id,
              name: song.name,
              isPublic: song.isPublic,
              allowsCollaboration: song.allowsCollaboration,
              lastOpenedAt: lastOpenedAt.toISOString(),
              updatedAt: song.updatedAt.toISOString(),
              parts: song.parts.map((part) => ({
                id: part.id,
                name: part.name,
                trackNames: part.tracks.map((track) => track.name),
                masterVolume: part.masterVolume,
                lastOpenedAt: part.lastOpenedAt.toISOString(),
                updatedAt: part.updatedAt.toISOString(),
              })),
            }
          }),
        })),
      })),
    },
  }
}

/** Owned-library totals for the account settings panel. */
export async function getAccountLibraryStats(
  request: Request,
): Promise<
  | { ok: true; stats: AccountLibraryStats }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr

  await ensureDefaultTree(user.id)

  const ownedPart = {
    song: { repertoire: { group: { userId: user.id } } },
  } as const

  const [groupCount, repertoireCount, songCount, songPartCount, durationAgg] =
    await Promise.all([
      prisma.group.count({ where: { userId: user.id } }),
      prisma.repertoire.count({ where: { group: { userId: user.id } } }),
      prisma.song.count({
        where: { repertoire: { group: { userId: user.id } } },
      }),
      prisma.songPart.count({ where: ownedPart }),
      prisma.trackAsset.aggregate({
        where: {
          uploadedAt: { not: null },
          songPart: ownedPart,
        },
        _sum: { durationMs: true },
      }),
    ])

  return {
    ok: true,
    stats: {
      durationMs: durationAgg._sum.durationMs ?? 0,
      groupCount,
      repertoireCount,
      songCount,
      songPartCount,
    },
  }
}

function mapLibraryGroups(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groups: any[],
): LibraryTree['groups'] {
  return groups.map((group) => ({
    id: group.id as string,
    name: group.name as string,
    repertoires: (
      group.repertoires as Array<{
        id: string
        name: string
        songs: Array<{
          id: string
          name: string
          isPublic: boolean
          allowsCollaboration: boolean
          lastOpenedAt: Date
          updatedAt: Date
          parts: Array<{
            id: string
            name: string | null
            masterVolume: number
            lastOpenedAt: Date
            updatedAt: Date
            tracks: Array<{ name: string }>
          }>
        }>
      }>
    ).map((rep) => ({
      id: rep.id,
      name: rep.name,
      songs: rep.songs.map((song) => {
        const lastOpenedAt = song.parts.reduce(
          (latest, part) =>
            part.lastOpenedAt > latest ? part.lastOpenedAt : latest,
          song.lastOpenedAt,
        )
        return {
          id: song.id,
          name: song.name,
          isPublic: song.isPublic,
          allowsCollaboration: song.allowsCollaboration,
          lastOpenedAt: lastOpenedAt.toISOString(),
          updatedAt: song.updatedAt.toISOString(),
          parts: song.parts.map((part) => ({
            id: part.id,
            name: part.name,
            trackNames: part.tracks.map((track) => track.name),
            masterVolume: part.masterVolume,
            lastOpenedAt: part.lastOpenedAt.toISOString(),
            updatedAt: part.updatedAt.toISOString(),
          })),
        }
      }),
    })),
  }))
}

const libraryTreeInclude = {
  repertoires: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      songs: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
          parts: {
            orderBy: { sortOrder: 'asc' as const },
            include: {
              tracks: {
                where: { uploadedAt: { not: null } },
                orderBy: { createdAt: 'asc' as const },
                select: { name: true },
              },
            },
          },
        },
      },
    },
  },
} as const

/**
 * Portfolio library for `/:pseudo`: full tree for the owner, else only
 * branches that contain at least one public song.
 */
export async function getLibraryPortfolio(
  request: Request,
  pseudoRaw: string,
): Promise<
  | {
      ok: true
      pseudo: string
      isOwner: boolean
      tree: LibraryTree
    }
  | { ok: false; reason: CloudFailureReason }
> {
  const pseudo = pseudoRaw.trim().replace(/^@+/, '')
  if (!pseudo) return { ok: false, reason: 'invalid' }

  const owner = await prisma.user.findFirst({
    where: { pseudo: { equals: pseudo, mode: 'insensitive' } },
    select: { id: true, pseudo: true },
  })
  if (!owner) return { ok: false, reason: 'not_found' }

  const viewer = await getUserFromRequest(request)
  const isOwner = Boolean(viewer && viewer.id === owner.id)

  if (isOwner) {
    await ensureDefaultTree(owner.id)
  }

  const groups = await prisma.group.findMany({
    where: {
      userId: owner.id,
      ...(isOwner
        ? {}
        : {
            repertoires: {
              some: { songs: { some: { isPublic: true } } },
            },
          }),
    },
    orderBy: { sortOrder: 'asc' },
    include: libraryTreeInclude,
  })

  let treeGroups = mapLibraryGroups(groups)
  if (!isOwner) {
    treeGroups = treeGroups
      .map((group) => ({
        ...group,
        repertoires: group.repertoires
          .map((rep) => ({
            ...rep,
            songs: rep.songs.filter((song) => song.isPublic),
          }))
          .filter((rep) => rep.songs.length > 0),
      }))
      .filter((group) => group.repertoires.length > 0)
  }

  return {
    ok: true,
    pseudo: owner.pseudo,
    isOwner,
    tree: { groups: treeGroups },
  }
}

/** Resolve breadcrumb context for a group / repertoire / song node. */
export async function getLibraryNodeContext(
  request: Request,
  kind: 'group' | 'repertoire' | 'song',
  id: string,
): Promise<
  | {
      ok: true
      isOwner: boolean
      ownerPseudo: string
      group: { id: string; name: string }
      repertoire?: { id: string; name: string }
      song?: {
        id: string
        name: string
        isPublic: boolean
        allowsCollaboration: boolean
      }
    }
  | { ok: false; reason: CloudFailureReason }
> {
  if (!id) return { ok: false, reason: 'invalid' }
  const viewer = await getUserFromRequest(request)

  if (kind === 'group') {
    const group = await prisma.group.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        userId: true,
        user: { select: { pseudo: true } },
      },
    })
    if (!group) return { ok: false, reason: 'not_found' }
    const isOwner = Boolean(viewer && viewer.id === group.userId)
    if (!isOwner) {
      const publicCount = await prisma.song.count({
        where: {
          isPublic: true,
          repertoire: { groupId: group.id },
        },
      })
      if (publicCount === 0) return { ok: false, reason: 'not_found' }
    }
    return {
      ok: true,
      isOwner,
      ownerPseudo: group.user.pseudo,
      group: { id: group.id, name: group.name },
    }
  }

  if (kind === 'repertoire') {
    const rep = await prisma.repertoire.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        group: {
          select: {
            id: true,
            name: true,
            userId: true,
            user: { select: { pseudo: true } },
          },
        },
      },
    })
    if (!rep) return { ok: false, reason: 'not_found' }
    const isOwner = Boolean(viewer && viewer.id === rep.group.userId)
    if (!isOwner) {
      const publicCount = await prisma.song.count({
        where: { isPublic: true, repertoireId: rep.id },
      })
      if (publicCount === 0) return { ok: false, reason: 'not_found' }
    }
    return {
      ok: true,
      isOwner,
      ownerPseudo: rep.group.user.pseudo,
      group: { id: rep.group.id, name: rep.group.name },
      repertoire: { id: rep.id, name: rep.name },
    }
  }

  const song = await prisma.song.findFirst({
    where: { id },
    select: {
      id: true,
      name: true,
      isPublic: true,
      allowsCollaboration: true,
      repertoire: {
        select: {
          id: true,
          name: true,
          group: {
            select: {
              id: true,
              name: true,
              userId: true,
              user: { select: { pseudo: true } },
            },
          },
        },
      },
    },
  })
  if (!song) return { ok: false, reason: 'not_found' }
  const isOwner = Boolean(viewer && viewer.id === song.repertoire.group.userId)
  if (!isOwner && !song.isPublic) return { ok: false, reason: 'not_found' }
  return {
    ok: true,
    isOwner,
    ownerPseudo: song.repertoire.group.user.pseudo,
    group: {
      id: song.repertoire.group.id,
      name: song.repertoire.group.name,
    },
    repertoire: { id: song.repertoire.id, name: song.repertoire.name },
    song: {
      id: song.id,
      name: song.name,
      isPublic: song.isPublic,
      allowsCollaboration: song.allowsCollaboration,
    },
  }
}

/** Repertoires inside a group (with song counts). */
export async function getLibraryGroupLevel(
  request: Request,
  groupId: string,
): Promise<
  | {
      ok: true
      isOwner: boolean
      ownerPseudo: string
      group: { id: string; name: string }
      repertoires: LibraryGroupLevelItem[]
    }
  | { ok: false; reason: CloudFailureReason }
> {
  const ctx = await getLibraryNodeContext(request, 'group', groupId)
  if (!ctx.ok) return ctx

  const repertoires = await prisma.repertoire.findMany({
    where: {
      groupId: ctx.group.id,
      ...(ctx.isOwner
        ? {}
        : { songs: { some: { isPublic: true } } }),
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      songs: {
        where: ctx.isOwner ? undefined : { isPublic: true },
        select: { id: true },
      },
    },
  })

  return {
    ok: true,
    isOwner: ctx.isOwner,
    ownerPseudo: ctx.ownerPseudo,
    group: ctx.group,
    repertoires: repertoires.map((rep) => ({
      id: rep.id,
      name: rep.name,
      songCount: rep.songs.length,
    })),
  }
}

/** Songs inside a repertoire (with session counts). */
export async function getLibraryRepertoireLevel(
  request: Request,
  repertoireId: string,
): Promise<
  | {
      ok: true
      isOwner: boolean
      ownerPseudo: string
      group: { id: string; name: string }
      repertoire: { id: string; name: string }
      songs: LibraryRepertoireLevelItem[]
    }
  | { ok: false; reason: CloudFailureReason }
> {
  const ctx = await getLibraryNodeContext(request, 'repertoire', repertoireId)
  if (!ctx.ok) return ctx
  if (!ctx.repertoire) return { ok: false, reason: 'not_found' }

  const songs = await prisma.song.findMany({
    where: {
      repertoireId: ctx.repertoire.id,
      ...(ctx.isOwner ? {} : { isPublic: true }),
    },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      isPublic: true,
      allowsCollaboration: true,
      _count: { select: { parts: true } },
    },
  })

  return {
    ok: true,
    isOwner: ctx.isOwner,
    ownerPseudo: ctx.ownerPseudo,
    group: ctx.group,
    repertoire: ctx.repertoire,
    songs: songs.map((song) => ({
      id: song.id,
      name: song.name,
      isPublic: song.isPublic,
      allowsCollaboration: song.allowsCollaboration,
      partCount: song._count.parts,
    })),
  }
}

/** Sessions inside a song (with track names). */
export async function getLibrarySongLevel(
  request: Request,
  songId: string,
): Promise<
  | {
      ok: true
      isOwner: boolean
      ownerPseudo: string
      group: { id: string; name: string }
      repertoire: { id: string; name: string }
      song: {
        id: string
        name: string
        isPublic: boolean
        allowsCollaboration: boolean
      }
      parts: LibrarySongLevelItem[]
    }
  | { ok: false; reason: CloudFailureReason }
> {
  const ctx = await getLibraryNodeContext(request, 'song', songId)
  if (!ctx.ok) return ctx
  if (!ctx.repertoire || !ctx.song) return { ok: false, reason: 'not_found' }

  const parts = await prisma.songPart.findMany({
    where: { songId: ctx.song.id },
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      name: true,
      tracks: {
        where: { uploadedAt: { not: null } },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { name: true, durationMs: true, offsetMs: true },
      },
    },
  })

  return {
    ok: true,
    isOwner: ctx.isOwner,
    ownerPseudo: ctx.ownerPseudo,
    group: ctx.group,
    repertoire: ctx.repertoire,
    song: ctx.song,
    parts: parts.map((part) => {
      let durationMs = 0
      for (const track of part.tracks) {
        const delay = Math.max(0, track.offsetMs)
        const skip = Math.max(0, -track.offsetMs)
        const playable = Math.max(0, track.durationMs - skip)
        durationMs = Math.max(durationMs, delay + playable)
      }
      return {
        id: part.id,
        name: part.name,
        trackNames: part.tracks.map((track) => track.name),
        durationMs,
      }
    }),
  }
}
