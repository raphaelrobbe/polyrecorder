import type { User as AppUser } from '~/common/user'
import { prisma } from './db.server'
import { CLOUD_UPLOAD_MAX_BYTES, getS3KeyPrefix } from './env.server'
import {
  createPresignedGetUrl,
  createPresignedPutUrl,
  deleteAllObjectsForUser,
  headObject,
  isS3Configured,
} from './s3.server'
import { getUserFromRequest } from './auth.server'

const DEFAULT_GROUP_NAME = 'Personnel'
const DEFAULT_REPERTOIRE_NAME = 'Général'
/** Fallback song name when first upload creates a work with no title yet. */
const DEFAULT_SONG_NAME_PREFIX = 'Session'

export type CloudFailureReason =
  | 'unauthorized'
  | 's3_not_configured'
  | 'too_large'
  | 'invalid'
  | 'not_found'
  | 'forbidden'
  | 'incomplete'
  | 'failed'

function extensionForContentType(contentType: string): string {
  const lower = contentType.toLowerCase()
  if (lower.includes('ogg')) return 'ogg'
  if (lower.includes('mpeg') || lower.includes('mp3')) return 'mp3'
  if (lower.includes('wav')) return 'wav'
  if (lower.includes('mp4') || lower.includes('m4a')) return 'm4a'
  return 'webm'
}

const TRACK_VOLUME_MAX = 1.5
const MASTER_VOLUME_MAX = 2

function clampStoredTrackVolume(value: number): number | null {
  if (!Number.isFinite(value)) return null
  return Math.min(TRACK_VOLUME_MAX, Math.max(0, value))
}

function clampStoredMasterVolume(value: number): number | null {
  if (!Number.isFinite(value)) return null
  return Math.min(MASTER_VOLUME_MAX, Math.max(0, value))
}

export type SongPartAlignPrefs = {
  autoAlignEnabled: boolean
  showCalageWarnings: boolean
  skipCountInPlayback: boolean
  skipCountInDownload: boolean
}

export async function updateSongPartMetronomeBpm(
  request: Request,
  songPartId: string,
  metronomeBpm: number | null,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!songPartId) return { ok: false, reason: 'invalid' }

  const part = await assertOwnedSongPart(user.id, songPartId)
  if (!part) return { ok: false, reason: 'not_found' }

  let next: number | null = null
  if (metronomeBpm != null) {
    const n = Math.round(Number(metronomeBpm))
    if (!Number.isFinite(n) || n < 30 || n > 240) {
      return { ok: false, reason: 'invalid' }
    }
    next = n
  }

  await prisma.songPart.update({
    where: { id: part.id },
    data: { metronomeBpm: next },
  })
  return { ok: true }
}

const DEFAULT_ALIGN_PREFS: SongPartAlignPrefs = {
  autoAlignEnabled: true,
  showCalageWarnings: true,
  skipCountInPlayback: true,
  skipCountInDownload: true,
}

function parseAlignPrefs(raw: unknown): SongPartAlignPrefs {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_ALIGN_PREFS }
  const o = raw as Record<string, unknown>
  return {
    autoAlignEnabled:
      typeof o.autoAlignEnabled === 'boolean'
        ? o.autoAlignEnabled
        : DEFAULT_ALIGN_PREFS.autoAlignEnabled,
    showCalageWarnings:
      typeof o.showCalageWarnings === 'boolean'
        ? o.showCalageWarnings
        : DEFAULT_ALIGN_PREFS.showCalageWarnings,
    skipCountInPlayback:
      typeof o.skipCountInPlayback === 'boolean'
        ? o.skipCountInPlayback
        : DEFAULT_ALIGN_PREFS.skipCountInPlayback,
    skipCountInDownload:
      typeof o.skipCountInDownload === 'boolean'
        ? o.skipCountInDownload
        : DEFAULT_ALIGN_PREFS.skipCountInDownload,
  }
}

async function resolveAlignPrefsForNewPart(
  songId: string,
  clientPrefs?: unknown,
): Promise<SongPartAlignPrefs> {
  const previous = await prisma.songPart.findFirst({
    where: { songId },
    orderBy: { sortOrder: 'desc' },
    select: {
      autoAlignEnabled: true,
      showCalageWarnings: true,
      skipCountInPlayback: true,
      skipCountInDownload: true,
    },
  })
  if (previous) {
    return {
      autoAlignEnabled: previous.autoAlignEnabled,
      showCalageWarnings: previous.showCalageWarnings,
      skipCountInPlayback: previous.skipCountInPlayback,
      skipCountInDownload: previous.skipCountInDownload,
    }
  }
  return parseAlignPrefs(clientPrefs)
}

async function requireUser(
  request: Request,
): Promise<AppUser | { ok: false; reason: 'unauthorized' }> {
  const user = await getUserFromRequest(request)
  if (!user) return { ok: false, reason: 'unauthorized' }
  return user
}

function isUser(
  value: AppUser | { ok: false; reason: 'unauthorized' },
): value is AppUser {
  return !('ok' in value)
}

async function assertOwnedGroup(userId: string, groupId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, userId },
  })
}

async function assertOwnedRepertoire(userId: string, repertoireId: string) {
  return prisma.repertoire.findFirst({
    where: { id: repertoireId, group: { userId } },
  })
}

async function assertOwnedSong(userId: string, songId: string) {
  return prisma.song.findFirst({
    where: { id: songId, repertoire: { group: { userId } } },
  })
}

async function assertOwnedSongPart(userId: string, songPartId: string) {
  return prisma.songPart.findFirst({
    where: {
      id: songPartId,
      song: { repertoire: { group: { userId } } },
    },
  })
}

async function assertOwnedTrackAsset(userId: string, trackAssetId: string) {
  return prisma.trackAsset.findFirst({
    where: {
      id: trackAssetId,
      songPart: { song: { repertoire: { group: { userId } } } },
    },
  })
}

/** Song owner, or the user who uploaded the take (collaborator). */
async function assertMutableTrackAsset(userId: string, trackAssetId: string) {
  const owned = await assertOwnedTrackAsset(userId, trackAssetId)
  if (owned) return owned
  return prisma.trackAsset.findFirst({
    where: { id: trackAssetId, uploadedByUserId: userId },
  })
}

/** Public collaborative session a signed-in non-owner may contribute to. */
async function assertCollaborativeSongPart(
  userId: string,
  songPartId: string,
) {
  return prisma.songPart.findFirst({
    where: {
      id: songPartId,
      song: {
        isPublic: true,
        allowsCollaboration: true,
        // Contributors are never the owner of this part.
        repertoire: { group: { userId: { not: userId } } },
      },
    },
  })
}

/** Next free `sortOrder` at the end of a sibling list. */
async function nextGroupSortOrder(userId: string): Promise<number> {
  const last = await prisma.group.findFirst({
    where: { userId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

async function nextRepertoireSortOrder(groupId: string): Promise<number> {
  const last = await prisma.repertoire.findFirst({
    where: { groupId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

async function nextSongSortOrder(repertoireId: string): Promise<number> {
  const last = await prisma.song.findFirst({
    where: { repertoireId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

async function nextSongPartSortOrder(songId: string): Promise<number> {
  const last = await prisma.songPart.findFirst({
    where: { songId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

async function nextTrackSortOrder(songPartId: string): Promise<number> {
  const last = await prisma.trackAsset.findFirst({
    where: { songPartId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

async function ensureDefaultTree(userId: string) {
  // Prefer the most recently used repertoire rather than the oldest defaults.
  const recent = await prisma.repertoire.findFirst({
    where: { group: { userId } },
    orderBy: { updatedAt: 'desc' },
    include: { group: true },
  })
  if (recent) {
    return { group: recent.group, repertoire: recent }
  }

  const group = await prisma.group.create({
    data: {
      userId,
      name: DEFAULT_GROUP_NAME,
      sortOrder: await nextGroupSortOrder(userId),
    },
  })
  const repertoire = await prisma.repertoire.create({
    data: { groupId: group.id, name: DEFAULT_REPERTOIRE_NAME },
  })
  return { group, repertoire }
}

/** Where a new home-deck recording will land (most recent repertoire). */
export type DefaultUploadDestination = {
  ownerPseudo: string
  groupId: string
  groupName: string
  repertoireId: string
  repertoireName: string
}

export async function getDefaultUploadDestination(
  request: Request,
): Promise<
  | { ok: true; destination: DefaultUploadDestination }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const { group, repertoire } = await ensureDefaultTree(user.id)
  return {
    ok: true,
    destination: {
      ownerPseudo: user.pseudo,
      groupId: group.id,
      groupName: group.name,
      repertoireId: repertoire.id,
      repertoireName: repertoire.name,
    },
  }
}

async function touchRepertoire(repertoireId: string) {
  await prisma.repertoire.update({
    where: { id: repertoireId },
    data: { updatedAt: new Date() },
  })
}

/** Bump the part, its song and the enclosing repertoire as "just used". */
async function touchSongPart(part: { id: string; songId: string }) {
  const now = new Date()
  const updated = await prisma.songPart.update({
    where: { id: part.id },
    data: { lastOpenedAt: now },
    include: { song: { select: { repertoireId: true } } },
  })
  await prisma.song.update({
    where: { id: part.songId },
    data: { lastOpenedAt: now },
  })
  await touchRepertoire(updated.song.repertoireId)
  return updated
}

async function resolveSongPartForUpload(
  userId: string,
  songPartId: string | null | undefined,
  sessionTitle: string | null | undefined,
  metronomeBpm?: number | null,
) {
  if (songPartId) {
    const owned = await assertOwnedSongPart(userId, songPartId)
    if (owned) {
      if (
        metronomeBpm != null &&
        Number.isFinite(metronomeBpm) &&
        owned.metronomeBpm !== Math.round(metronomeBpm)
      ) {
        const n = Math.round(Number(metronomeBpm))
        if (n >= 30 && n <= 240) {
          await prisma.songPart.update({
            where: { id: owned.id },
            data: { metronomeBpm: n },
          })
        }
      }
      return touchSongPart(owned)
    }
    const collaborative = await assertCollaborativeSongPart(userId, songPartId)
    if (collaborative) return collaborative
    return null
  }

  // No target id → always create a new œuvre + session (never reuse “recent”).
  const { repertoire } = await ensureDefaultTree(userId)
  const songName =
    sessionTitle?.trim() ||
    `${DEFAULT_SONG_NAME_PREFIX} ${new Date().toLocaleDateString('fr-FR')}`
  const song = await prisma.song.create({
    data: {
      repertoireId: repertoire.id,
      name: songName,
      lastOpenedAt: new Date(),
      sortOrder: await nextSongSortOrder(repertoire.id),
    },
  })
  let initialMetro: number | null = null
  if (metronomeBpm != null && Number.isFinite(metronomeBpm)) {
    const n = Math.round(Number(metronomeBpm))
    if (n >= 30 && n <= 240) initialMetro = n
  }
  const part = await prisma.songPart.create({
    data: {
      songId: song.id,
      name: null,
      lastOpenedAt: new Date(),
      metronomeBpm: initialMetro,
    },
  })
  await touchRepertoire(repertoire.id)
  return part
}

/** Library breadcrumb fields for a song part (Personnel / Général / …). */
export type CloudLibraryPath = {
  ownerPseudo: string
  groupId: string
  groupName: string
  repertoireId: string
  repertoireName: string
  songId: string
  songName: string
}

async function getSongPartLibraryPath(
  songPartId: string,
): Promise<CloudLibraryPath | null> {
  const part = await prisma.songPart.findFirst({
    where: { id: songPartId },
    select: {
      song: {
        select: {
          id: true,
          name: true,
          repertoire: {
            select: {
              id: true,
              name: true,
              group: {
                select: {
                  id: true,
                  name: true,
                  user: { select: { pseudo: true } },
                },
              },
            },
          },
        },
      },
    },
  })
  if (!part) return null
  const { song } = part
  const { repertoire } = song
  const { group } = repertoire
  return {
    ownerPseudo: group.user.pseudo,
    groupId: group.id,
    groupName: group.name,
    repertoireId: repertoire.id,
    repertoireName: repertoire.name,
    songId: song.id,
    songName: song.name,
  }
}

export type PresignResult =
  | {
      ok: true
      uploadUrl: string
      trackAssetId: string
      objectKey: string
      songPartId: string
      songId: string
      libraryPath: CloudLibraryPath | null
    }
  | { ok: false; reason: CloudFailureReason }

export async function presignTrackUpload(
  request: Request,
  input: {
    songPartId?: string | null
    name: string
    contentType: string
    byteSize: number
    durationMs: number
    offsetMs: number
    volume?: number | null
    muted?: boolean | null
    clientTrackId?: number | null
    sessionTitle?: string | null
    metronomeBpm?: number | null
  },
): Promise<PresignResult> {
  try {
    const userOrErr = await requireUser(request)
    if (!isUser(userOrErr)) return userOrErr
    const user = userOrErr
    if (!isS3Configured()) return { ok: false, reason: 's3_not_configured' }

    const contentType = input.contentType.trim() || 'audio/webm'
    const name = input.name.trim() || 'Piste'
    const byteSize = Math.floor(input.byteSize)
    const durationMs = Math.max(0, Math.floor(input.durationMs))
    const offsetMs = Math.floor(input.offsetMs)

    if (!Number.isFinite(byteSize) || byteSize <= 0) {
      return { ok: false, reason: 'invalid' }
    }
    if (byteSize > CLOUD_UPLOAD_MAX_BYTES) {
      return { ok: false, reason: 'too_large' }
    }

    const part = await resolveSongPartForUpload(
      user.id,
      input.songPartId,
      input.sessionTitle,
      input.metronomeBpm,
    )
    if (!part) return { ok: false, reason: 'not_found' }

    const trackAsset = await prisma.trackAsset.create({
      data: {
        songPartId: part.id,
        name,
        objectKey: 'pending',
        contentType,
        byteSize,
        durationMs,
        offsetMs,
        volume: clampStoredTrackVolume(input.volume ?? 1) ?? 1,
        muted: Boolean(input.muted),
        sortOrder: await nextTrackSortOrder(part.id),
        clientTrackId: input.clientTrackId ?? null,
        uploadedByUserId: user.id,
      },
    })

    const ext = extensionForContentType(contentType)
    const objectKey = `${getS3KeyPrefix()}/${user.id}/${trackAsset.id}.${ext}`
    await prisma.trackAsset.update({
      where: { id: trackAsset.id },
      data: { objectKey },
    })

    const uploadUrl = await createPresignedPutUrl({
      objectKey,
      contentType,
    })

    const libraryPath = await getSongPartLibraryPath(part.id)

    return {
      ok: true,
      uploadUrl,
      trackAssetId: trackAsset.id,
      objectKey,
      songPartId: part.id,
      songId: part.songId,
      libraryPath,
    }
  } catch (error) {
    console.error('[cloud] presign failed', error)
    return { ok: false, reason: 'failed' }
  }
}

export type CompleteUploadResult =
  | { ok: true; trackAssetId: string; songPartId: string; songId: string }
  | { ok: false; reason: CloudFailureReason }

export async function completeTrackUpload(
  request: Request,
  trackAssetId: string,
): Promise<CompleteUploadResult> {
  try {
    const userOrErr = await requireUser(request)
    if (!isUser(userOrErr)) return userOrErr
    const user = userOrErr
    if (!isS3Configured()) return { ok: false, reason: 's3_not_configured' }
    if (!trackAssetId.trim()) return { ok: false, reason: 'invalid' }

    const asset = await assertMutableTrackAsset(user.id, trackAssetId)
    if (!asset) return { ok: false, reason: 'not_found' }
    if (!asset.objectKey || asset.objectKey === 'pending') {
      return { ok: false, reason: 'incomplete' }
    }

    const head = await headObject(asset.objectKey)
    if (!head) return { ok: false, reason: 'incomplete' }

    const updated = await prisma.trackAsset.update({
      where: { id: asset.id },
      data: { uploadedAt: new Date() },
      include: { songPart: { select: { songId: true } } },
    })

    return {
      ok: true,
      trackAssetId: updated.id,
      songPartId: updated.songPartId,
      songId: updated.songPart.songId,
    }
  } catch (error) {
    console.error('[cloud] complete failed', error)
    return { ok: false, reason: 'failed' }
  }
}

export type LibraryTree = {
  groups: Array<{
    id: string
    name: string
    repertoires: Array<{
      id: string
      name: string
      songs: Array<{
        id: string
        name: string
        isPublic: boolean
        allowsCollaboration: boolean
        lastOpenedAt: string
        updatedAt: string
        parts: Array<{
          id: string
          name: string | null
          trackNames: string[]
          masterVolume: number
          lastOpenedAt: string
          updatedAt: string
        }>
      }>
    }>
  }>
}

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

export type AccountLibraryStats = {
  durationMs: number
  groupCount: number
  repertoireCount: number
  songCount: number
  songPartCount: number
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

export type LibraryGroupLevelItem = {
  id: string
  name: string
  songCount: number
}

export type LibraryRepertoireLevelItem = {
  id: string
  name: string
  isPublic: boolean
  allowsCollaboration: boolean
  partCount: number
}

export type LibrarySongLevelItem = {
  id: string
  name: string | null
  trackNames: string[]
  /** Mix timeline length (offsets + durations), milliseconds. */
  durationMs: number
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

export async function createGroup(
  request: Request,
  name: string,
): Promise<
  | { ok: true; id: string; name: string }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const trimmed = name.trim()
  if (!trimmed) return { ok: false, reason: 'invalid' }
  const group = await prisma.group.create({
    data: {
      userId: user.id,
      name: trimmed,
      sortOrder: await nextGroupSortOrder(user.id),
    },
  })
  return { ok: true, id: group.id, name: group.name }
}

export async function createRepertoire(
  request: Request,
  groupId: string,
  name: string,
): Promise<
  | { ok: true; id: string; name: string; groupId: string }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const trimmed = name.trim()
  if (!trimmed || !groupId) return { ok: false, reason: 'invalid' }
  const group = await assertOwnedGroup(user.id, groupId)
  if (!group) return { ok: false, reason: 'not_found' }
  const repertoire = await prisma.repertoire.create({
    data: {
      groupId: group.id,
      name: trimmed,
      sortOrder: await nextRepertoireSortOrder(group.id),
    },
  })
  return {
    ok: true,
    id: repertoire.id,
    name: repertoire.name,
    groupId: repertoire.groupId,
  }
}

export async function createSong(
  request: Request,
  repertoireId: string,
  name: string,
  partName?: string | null,
  alignPrefs?: unknown,
): Promise<
  | {
      ok: true
      id: string
      name: string
      repertoireId: string
      defaultPartId: string
    }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const trimmed = name.trim()
  if (!trimmed || !repertoireId) return { ok: false, reason: 'invalid' }
  const repertoire = await assertOwnedRepertoire(user.id, repertoireId)
  if (!repertoire) return { ok: false, reason: 'not_found' }
  const song = await prisma.song.create({
    data: {
      repertoireId: repertoire.id,
      name: trimmed,
      lastOpenedAt: new Date(),
      sortOrder: await nextSongSortOrder(repertoire.id),
    },
  })
  const trimmedPart = partName?.trim() || null
  const prefs = parseAlignPrefs(alignPrefs)
  const part = await prisma.songPart.create({
    data: {
      songId: song.id,
      name: trimmedPart,
      lastOpenedAt: new Date(),
      ...prefs,
    },
  })
  await touchRepertoire(repertoire.id)
  return {
    ok: true,
    id: song.id,
    name: song.name,
    repertoireId: song.repertoireId,
    defaultPartId: part.id,
  }
}

export async function createSongPart(
  request: Request,
  songId: string,
  name: string,
  alignPrefs?: unknown,
): Promise<
  | { ok: true; id: string; name: string | null; songId: string }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const trimmed = name.trim() || null
  if (!songId) return { ok: false, reason: 'invalid' }
  const song = await assertOwnedSong(user.id, songId)
  if (!song) return { ok: false, reason: 'not_found' }
  const prefs = await resolveAlignPrefsForNewPart(song.id, alignPrefs)
  const part = await prisma.songPart.create({
    data: {
      songId: song.id,
      name: trimmed,
      lastOpenedAt: new Date(),
      sortOrder: await nextSongPartSortOrder(song.id),
      ...prefs,
    },
  })
  await touchRepertoire(song.repertoireId)
  return { ok: true, id: part.id, name: part.name, songId: song.id }
}

export async function renameLibraryNode(
  request: Request,
  kind: 'group' | 'repertoire' | 'song' | 'songPart',
  id: string,
  name: string,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const trimmed = name.trim()
  if (!id) return { ok: false, reason: 'invalid' }

  if (kind === 'songPart') {
    const part = await assertOwnedSongPart(user.id, id)
    if (!part) return { ok: false, reason: 'not_found' }
    await prisma.songPart.update({
      where: { id: part.id },
      data: { name: trimmed || null },
    })
    return { ok: true }
  }

  if (!trimmed) return { ok: false, reason: 'invalid' }

  if (kind === 'group') {
    const group = await assertOwnedGroup(user.id, id)
    if (!group) return { ok: false, reason: 'not_found' }
    await prisma.group.update({
      where: { id: group.id },
      data: { name: trimmed },
    })
    return { ok: true }
  }
  if (kind === 'repertoire') {
    const owned = await assertOwnedRepertoire(user.id, id)
    if (!owned) return { ok: false, reason: 'not_found' }
    await prisma.repertoire.update({
      where: { id: owned.id },
      data: { name: trimmed },
    })
    return { ok: true }
  }
  const song = await assertOwnedSong(user.id, id)
  if (!song) return { ok: false, reason: 'not_found' }
  await prisma.song.update({ where: { id: song.id }, data: { name: trimmed } })
  return { ok: true }
}

/** Sibling ids with `id` moved before `beforeId` (to the end when null). */
function moveBefore(
  ids: string[],
  id: string,
  beforeId: string | null,
): string[] | null {
  if (!ids.includes(id)) return null
  if (beforeId != null && !ids.includes(beforeId)) return null
  const rest = ids.filter((candidate) => candidate !== id)
  if (beforeId == null) return [...rest, id]
  const index = rest.indexOf(beforeId)
  return [...rest.slice(0, index), id, ...rest.slice(index)]
}

/**
 * Drag & drop within one parent: move `id` just before `beforeId` (end of the
 * list when null) and renumber every sibling 0..n-1.
 */
export async function reorderLibraryNode(
  request: Request,
  kind: 'group' | 'repertoire' | 'song' | 'songPart',
  id: string,
  beforeId: string | null,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!id || beforeId === id) return { ok: false, reason: 'invalid' }

  if (kind === 'group') {
    const group = await assertOwnedGroup(user.id, id)
    if (!group) return { ok: false, reason: 'not_found' }
    const siblings = await prisma.group.findMany({
      where: { userId: user.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    })
    const ordered = moveBefore(
      siblings.map((sibling) => sibling.id),
      group.id,
      beforeId,
    )
    if (!ordered) return { ok: false, reason: 'not_found' }
    await prisma.$transaction(
      ordered.map((siblingId, index) =>
        prisma.group.update({
          where: { id: siblingId },
          data: { sortOrder: index },
        }),
      ),
    )
    return { ok: true }
  }

  if (kind === 'repertoire') {
    const repertoire = await assertOwnedRepertoire(user.id, id)
    if (!repertoire) return { ok: false, reason: 'not_found' }
    const siblings = await prisma.repertoire.findMany({
      where: { groupId: repertoire.groupId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    })
    const ordered = moveBefore(
      siblings.map((sibling) => sibling.id),
      repertoire.id,
      beforeId,
    )
    if (!ordered) return { ok: false, reason: 'not_found' }
    await prisma.$transaction(
      ordered.map((siblingId, index) =>
        prisma.repertoire.update({
          where: { id: siblingId },
          data: { sortOrder: index },
        }),
      ),
    )
    return { ok: true }
  }

  if (kind === 'song') {
    const song = await assertOwnedSong(user.id, id)
    if (!song) return { ok: false, reason: 'not_found' }
    const siblings = await prisma.song.findMany({
      where: { repertoireId: song.repertoireId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    })
    const ordered = moveBefore(
      siblings.map((sibling) => sibling.id),
      song.id,
      beforeId,
    )
    if (!ordered) return { ok: false, reason: 'not_found' }
    await prisma.$transaction(
      ordered.map((siblingId, index) =>
        prisma.song.update({
          where: { id: siblingId },
          data: { sortOrder: index },
        }),
      ),
    )
    return { ok: true }
  }

  const part = await assertOwnedSongPart(user.id, id)
  if (!part) return { ok: false, reason: 'not_found' }
  const siblings = await prisma.songPart.findMany({
    where: { songId: part.songId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true },
  })
  const ordered = moveBefore(
    siblings.map((sibling) => sibling.id),
    part.id,
    beforeId,
  )
  if (!ordered) return { ok: false, reason: 'not_found' }
  await prisma.$transaction(
    ordered.map((siblingId, index) =>
      prisma.songPart.update({
        where: { id: siblingId },
        data: { sortOrder: index },
      }),
    ),
  )
  return { ok: true }
}

export async function renameTrackAsset(
  request: Request,
  trackAssetId: string,
  name: string,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const trimmed = name.trim().slice(0, 40)
  if (!trimmed || !trackAssetId) return { ok: false, reason: 'invalid' }

  const asset = await assertMutableTrackAsset(user.id, trackAssetId)
  if (!asset) return { ok: false, reason: 'not_found' }

  await prisma.trackAsset.update({
    where: { id: asset.id },
    data: { name: trimmed },
  })
  return { ok: true }
}

export async function updateTrackAssetOffset(
  request: Request,
  trackAssetId: string,
  offsetMs: number,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!trackAssetId || !Number.isFinite(offsetMs)) {
    return { ok: false, reason: 'invalid' }
  }

  const asset = await assertMutableTrackAsset(user.id, trackAssetId)
  if (!asset) return { ok: false, reason: 'not_found' }

  await prisma.trackAsset.update({
    where: { id: asset.id },
    data: { offsetMs: Math.round(offsetMs) },
  })
  return { ok: true }
}

export async function updateTrackAssetOffsets(
  request: Request,
  updates: Array<{ id: string; offsetMs: number }>,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!Array.isArray(updates) || updates.length === 0) {
    return { ok: false, reason: 'invalid' }
  }

  for (const update of updates) {
    if (!update?.id || !Number.isFinite(update.offsetMs)) {
      return { ok: false, reason: 'invalid' }
    }
    const asset = await assertMutableTrackAsset(user.id, update.id)
    if (!asset) return { ok: false, reason: 'not_found' }
  }

  await prisma.$transaction(
    updates.map((update) =>
      prisma.trackAsset.update({
        where: { id: update.id },
        data: { offsetMs: Math.round(update.offsetMs) },
      }),
    ),
  )
  return { ok: true }
}

export async function updateTrackAssetVolume(
  request: Request,
  trackAssetId: string,
  volume: number,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const next = clampStoredTrackVolume(volume)
  if (!trackAssetId || next == null) return { ok: false, reason: 'invalid' }

  const asset = await assertMutableTrackAsset(user.id, trackAssetId)
  if (!asset) return { ok: false, reason: 'not_found' }

  await prisma.trackAsset.update({
    where: { id: asset.id },
    data: { volume: next },
  })
  return { ok: true }
}

export async function updateTrackAssetVolumes(
  request: Request,
  updates: Array<{ id: string; volume: number }>,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!Array.isArray(updates) || updates.length === 0) {
    return { ok: false, reason: 'invalid' }
  }

  const normalized: Array<{ id: string; volume: number }> = []
  for (const update of updates) {
    if (!update?.id) return { ok: false, reason: 'invalid' }
    const next = clampStoredTrackVolume(update.volume)
    if (next == null) return { ok: false, reason: 'invalid' }
    const asset = await assertMutableTrackAsset(user.id, update.id)
    if (!asset) return { ok: false, reason: 'not_found' }
    normalized.push({ id: update.id, volume: next })
  }

  await prisma.$transaction(
    normalized.map((update) =>
      prisma.trackAsset.update({
        where: { id: update.id },
        data: { volume: update.volume },
      }),
    ),
  )
  return { ok: true }
}

export async function updateTrackAssetMuted(
  request: Request,
  trackAssetId: string,
  muted: boolean,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!trackAssetId) return { ok: false, reason: 'invalid' }

  const asset = await assertMutableTrackAsset(user.id, trackAssetId)
  if (!asset) return { ok: false, reason: 'not_found' }

  await prisma.trackAsset.update({
    where: { id: asset.id },
    data: { muted: Boolean(muted) },
  })
  return { ok: true }
}

export async function updateTrackAssetMutes(
  request: Request,
  updates: Array<{ id: string; muted: boolean }>,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!Array.isArray(updates) || updates.length === 0) {
    return { ok: false, reason: 'invalid' }
  }

  const normalized: Array<{ id: string; muted: boolean }> = []
  for (const update of updates) {
    if (!update?.id) return { ok: false, reason: 'invalid' }
    const asset = await assertMutableTrackAsset(user.id, update.id)
    if (!asset) return { ok: false, reason: 'not_found' }
    normalized.push({ id: update.id, muted: Boolean(update.muted) })
  }

  await prisma.$transaction(
    normalized.map((update) =>
      prisma.trackAsset.update({
        where: { id: update.id },
        data: { muted: update.muted },
      }),
    ),
  )
  return { ok: true }
}

export async function updateSongPartMasterVolume(
  request: Request,
  songPartId: string,
  masterVolume: number,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const next = clampStoredMasterVolume(masterVolume)
  if (!songPartId || next == null) return { ok: false, reason: 'invalid' }

  const part = await assertOwnedSongPart(user.id, songPartId)
  if (!part) return { ok: false, reason: 'not_found' }

  await prisma.songPart.update({
    where: { id: part.id },
    data: { masterVolume: next },
  })
  return { ok: true }
}

export async function updateSongPartAlignPrefs(
  request: Request,
  songPartId: string,
  prefs: unknown,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!songPartId) return { ok: false, reason: 'invalid' }

  const part = await assertOwnedSongPart(user.id, songPartId)
  if (!part) return { ok: false, reason: 'not_found' }

  const next = parseAlignPrefs(prefs)
  await prisma.songPart.update({
    where: { id: part.id },
    data: next,
  })
  return { ok: true }
}

/** Persist deck track order for a session (song owner only). */
export async function syncTrackAssetOrder(
  request: Request,
  songPartId: string,
  orderedIds: string[],
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!songPartId || !Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { ok: false, reason: 'invalid' }
  }

  const part = await assertOwnedSongPart(user.id, songPartId)
  if (!part) return { ok: false, reason: 'not_found' }

  const assets = await prisma.trackAsset.findMany({
    where: { songPartId: part.id },
    select: { id: true },
  })
  const allowed = new Set(assets.map((asset) => asset.id))
  const normalized = orderedIds
    .map((id) => String(id ?? '').trim())
    .filter((id) => id.length > 0 && allowed.has(id))
  if (normalized.length === 0) return { ok: false, reason: 'invalid' }

  // Deduplicate while keeping first occurrence order.
  const seen = new Set<string>()
  const unique: string[] = []
  for (const id of normalized) {
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(id)
  }

  await prisma.$transaction(
    unique.map((id, index) =>
      prisma.trackAsset.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  )
  return { ok: true }
}

export async function deleteTrackAsset(
  request: Request,
  trackAssetId: string,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!trackAssetId) return { ok: false, reason: 'invalid' }

  const asset = await assertMutableTrackAsset(user.id, trackAssetId)
  if (!asset) return { ok: false, reason: 'not_found' }

  const { deleteObjectsByKeys } = await import('./s3.server')
  if (asset.objectKey && asset.objectKey !== 'pending') {
    await deleteObjectsByKeys([asset.objectKey])
  }
  await prisma.trackAsset.delete({ where: { id: asset.id } })
  return { ok: true }
}

export async function setSongPublic(
  request: Request,
  songId: string,
  isPublic: boolean,
): Promise<
  | { ok: true; isPublic: boolean; allowsCollaboration: boolean }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!songId) return { ok: false, reason: 'invalid' }

  const song = await assertOwnedSong(user.id, songId)
  if (!song) return { ok: false, reason: 'not_found' }

  const nextPublic = Boolean(isPublic)
  const updated = await prisma.song.update({
    where: { id: song.id },
    data: {
      isPublic: nextPublic,
      // Collaboration only makes sense on a public song.
      ...(nextPublic ? {} : { allowsCollaboration: false }),
    },
  })
  return {
    ok: true,
    isPublic: updated.isPublic,
    allowsCollaboration: updated.allowsCollaboration,
  }
}

export async function setSongCollaboration(
  request: Request,
  songId: string,
  allowsCollaboration: boolean,
): Promise<
  | { ok: true; allowsCollaboration: boolean }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!songId) return { ok: false, reason: 'invalid' }

  const song = await assertOwnedSong(user.id, songId)
  if (!song) return { ok: false, reason: 'not_found' }
  if (allowsCollaboration && !song.isPublic) {
    return { ok: false, reason: 'invalid' }
  }

  const updated = await prisma.song.update({
    where: { id: song.id },
    data: { allowsCollaboration: Boolean(allowsCollaboration) },
  })
  return { ok: true, allowsCollaboration: updated.allowsCollaboration }
}

function uploadedObjectKeys(
  tracks: Array<{ objectKey: string }>,
): string[] {
  return tracks
    .map((track) => track.objectKey)
    .filter((key) => key && key !== 'pending')
}

export async function deleteLibraryNode(
  request: Request,
  kind: 'group' | 'repertoire' | 'song' | 'songPart',
  id: string,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!id) return { ok: false, reason: 'invalid' }

  if (kind === 'songPart') {
    const part = await prisma.songPart.findFirst({
      where: { id, song: { repertoire: { group: { userId: user.id } } } },
      include: {
        tracks: { select: { objectKey: true } },
        song: { select: { repertoireId: true } },
      },
    })
    if (!part) return { ok: false, reason: 'not_found' }
    const { deleteObjectsByKeys } = await import('./s3.server')
    await deleteObjectsByKeys(uploadedObjectKeys(part.tracks))
    await prisma.songPart.delete({ where: { id: part.id } })
    await touchRepertoire(part.song.repertoireId)
    return { ok: true }
  }

  if (kind === 'song') {
    const song = await prisma.song.findFirst({
      where: { id, repertoire: { group: { userId: user.id } } },
      include: {
        parts: { include: { tracks: { select: { objectKey: true } } } },
      },
    })
    if (!song) return { ok: false, reason: 'not_found' }
    const { deleteObjectsByKeys } = await import('./s3.server')
    await deleteObjectsByKeys(
      song.parts.flatMap((part) => uploadedObjectKeys(part.tracks)),
    )
    const repertoireId = song.repertoireId
    await prisma.song.delete({ where: { id: song.id } })
    await touchRepertoire(repertoireId)
    return { ok: true }
  }

  if (kind === 'repertoire') {
    const repertoire = await prisma.repertoire.findFirst({
      where: { id, group: { userId: user.id } },
      include: {
        songs: {
          include: {
            parts: { include: { tracks: { select: { objectKey: true } } } },
          },
        },
      },
    })
    if (!repertoire) return { ok: false, reason: 'not_found' }
    const keys = repertoire.songs.flatMap((song) =>
      song.parts.flatMap((part) => uploadedObjectKeys(part.tracks)),
    )
    const { deleteObjectsByKeys } = await import('./s3.server')
    await deleteObjectsByKeys(keys)
    await prisma.repertoire.delete({ where: { id: repertoire.id } })
    return { ok: true }
  }

  const group = await prisma.group.findFirst({
    where: { id, userId: user.id },
    include: {
      repertoires: {
        include: {
          songs: {
            include: {
              parts: { include: { tracks: { select: { objectKey: true } } } },
            },
          },
        },
      },
    },
  })
  if (!group) return { ok: false, reason: 'not_found' }
  const keys = group.repertoires.flatMap((rep) =>
    rep.songs.flatMap((song) =>
      song.parts.flatMap((part) => uploadedObjectKeys(part.tracks)),
    ),
  )
  const { deleteObjectsByKeys } = await import('./s3.server')
  await deleteObjectsByKeys(keys)
  await prisma.group.delete({ where: { id: group.id } })
  return { ok: true }
}

export type OpenSongResult =
  | {
      ok: true
      isOwner: boolean
      /** Signed-in non-owner may upload new tracks on this public collaborative song. */
      canCollaborate: boolean
      song: {
        id: string
        name: string
        repertoireId: string
        isPublic: boolean
        allowsCollaboration: boolean
        groupId: string
        groupName: string
        repertoireName: string
        ownerPseudo: string | null
      }
      part: {
        id: string
        name: string | null
        masterVolume: number
        autoAlignEnabled: boolean
        showCalageWarnings: boolean
        skipCountInPlayback: boolean
        skipCountInDownload: boolean
        metronomeBpm: number | null
      }
      /** Every session of the song, in library order (deck prev / next). */
      siblings: Array<{ id: string; name: string | null }>
      tracks: Array<{
        id: string
        name: string
        url: string
        durationMs: number
        offsetMs: number
        volume: number
        muted: boolean
        contentType: string
        uploadedByMe: boolean
        /** Uploader pseudo (no leading @), or null if unknown. */
        uploadedByPseudo: string | null
      }>
    }
  | { ok: false; reason: CloudFailureReason }

/** Open one recording session (part). `songPartId` is what /song/:id carries. */
export async function openSong(
  request: Request,
  songPartId: string,
): Promise<OpenSongResult> {
  try {
    if (!songPartId) return { ok: false, reason: 'invalid' }

    const user = await getUserFromRequest(request)
    const part = await prisma.songPart.findFirst({
      where: { id: songPartId },
      include: {
        song: {
          include: {
            repertoire: {
              include: {
                group: {
                  select: {
                    id: true,
                    userId: true,
                    name: true,
                    user: { select: { pseudo: true } },
                  },
                },
              },
            },
          },
        },
        tracks: {
          where: { uploadedAt: { not: null } },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })
    if (!part) return { ok: false, reason: 'not_found' }

    const song = part.song
    const isOwner = Boolean(user && song.repertoire.group.userId === user.id)
    if (!isOwner && !song.isPublic) {
      return { ok: false, reason: 'not_found' }
    }
    const canCollaborate = Boolean(
      user &&
        !isOwner &&
        song.isPublic &&
        song.allowsCollaboration,
    )

    if (isOwner) {
      await touchSongPart(part)
    }

    // Empty parts are metadata-only — S3 is only required to fetch audio.
    if (part.tracks.length > 0 && !isS3Configured()) {
      return { ok: false, reason: 's3_not_configured' }
    }

    const siblings = await prisma.songPart.findMany({
      where: { songId: song.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true },
    })

    const ownerPseudo = song.repertoire.group.user.pseudo.trim() || null
    const uploaderIds = [
      ...new Set(
        part.tracks
          .map((track) => track.uploadedByUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]
    const uploaders =
      uploaderIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: uploaderIds } },
            select: { id: true, pseudo: true },
          })
        : []
    const pseudoByUserId = new Map(
      uploaders.map((u) => [u.id, u.pseudo.trim() || null] as const),
    )

    const tracks = await Promise.all(
      part.tracks.map(async (track) => ({
        id: track.id,
        name: track.name,
        url: await createPresignedGetUrl({ objectKey: track.objectKey }),
        durationMs: track.durationMs,
        offsetMs: track.offsetMs,
        volume: track.volume,
        muted: Boolean(track.muted),
        contentType: track.contentType,
        uploadedByMe: Boolean(
          user && track.uploadedByUserId === user.id,
        ),
        uploadedByPseudo: track.uploadedByUserId
          ? (pseudoByUserId.get(track.uploadedByUserId) ?? null)
          : ownerPseudo,
      })),
    )

    return {
      ok: true,
      isOwner,
      canCollaborate,
      song: {
        id: song.id,
        name: song.name,
        repertoireId: song.repertoireId,
        isPublic: song.isPublic,
        allowsCollaboration: song.allowsCollaboration,
        groupId: song.repertoire.group.id,
        groupName: song.repertoire.group.name,
        repertoireName: song.repertoire.name,
        ownerPseudo,
      },
      part: {
        id: part.id,
        name: part.name,
        masterVolume: part.masterVolume,
        autoAlignEnabled: part.autoAlignEnabled,
        showCalageWarnings: part.showCalageWarnings,
        skipCountInPlayback: part.skipCountInPlayback,
        skipCountInDownload: part.skipCountInDownload,
        metronomeBpm: part.metronomeBpm ?? null,
      },
      siblings,
      tracks,
    }
  } catch (error) {
    console.error('[cloud] openSong failed', error)
    return { ok: false, reason: 'failed' }
  }
}

/** Public part metadata for OG / route loaders (no audio URLs). */
export async function getSongShareMeta(
  request: Request,
  songPartId: string,
): Promise<
  | {
      ok: true
      isOwner: boolean
      song: {
        id: string
        songId: string
        name: string
        songName: string
        partName: string | null
        isPublic: boolean
        trackCount: number
        groupId: string
        groupName: string
        repertoireId: string
        repertoireName: string
        ownerPseudo: string
      }
    }
  | { ok: false; reason: CloudFailureReason }
> {
  if (!songPartId) return { ok: false, reason: 'invalid' }

  const user = await getUserFromRequest(request)
  const part = await prisma.songPart.findFirst({
    where: { id: songPartId },
    include: {
      song: {
        include: {
          repertoire: {
            include: {
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
      },
      tracks: {
        where: { uploadedAt: { not: null } },
        select: { id: true },
      },
    },
  })
  if (!part) return { ok: false, reason: 'not_found' }

  const song = part.song
  const isOwner = Boolean(user && song.repertoire.group.userId === user.id)
  if (!isOwner && !song.isPublic) {
    return { ok: false, reason: 'not_found' }
  }

  return {
    ok: true,
    isOwner,
    song: {
      id: part.id,
      songId: song.id,
      name: songPartDisplayName(song.name, part.name),
      songName: song.name,
      partName: part.name,
      isPublic: song.isPublic,
      trackCount: part.tracks.length,
      groupId: song.repertoire.group.id,
      groupName: song.repertoire.group.name,
      repertoireId: song.repertoire.id,
      repertoireName: song.repertoire.name,
      ownerPseudo: song.repertoire.group.user.pseudo,
    },
  }
}

/** `Song — Part`, or just the song when unnamed / the part repeats the song. */
export function songPartDisplayName(
  songName: string,
  partName: string | null | undefined,
): string {
  const song = songName.trim()
  const part = partName?.trim() ?? ''
  if (!part || part === song) return song
  return `${song} — ${part}`
}

export async function purgeUserCloudStorage(userId: string): Promise<void> {
  await deleteAllObjectsForUser(userId)
}
