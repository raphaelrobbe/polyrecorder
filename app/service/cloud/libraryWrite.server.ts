import { clampLibraryTitle } from '~/lib/format'
import { prisma } from '../db.server'
import { getS3KeyPrefix } from '../env.server'
import { copyObject, deleteObjectsByKeys, isS3Configured } from '../s3.server'
import type { CloudFailureReason } from './types'
import {
  assertOwnedGroup,
  assertOwnedRepertoire,
  assertOwnedSong,
  assertOwnedSongPart,
  extensionForContentType,
  isUser,
  nextGroupSortOrder,
  nextRepertoireSortOrder,
  nextSongPartSortOrder,
  nextSongSortOrder,
  parseAlignPrefs,
  requireUser,
  resolveAlignPrefsForNewPart,
  touchRepertoire,
} from './helpers.server'

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
  const trimmed = clampLibraryTitle(name)
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
  const trimmed = clampLibraryTitle(name)
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
  options?: { createDefaultPart?: boolean },
): Promise<
  | {
      ok: true
      id: string
      name: string
      repertoireId: string
      defaultPartId?: string
    }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const trimmed = clampLibraryTitle(name)
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
  const createDefaultPart = options?.createDefaultPart !== false
  let defaultPartId: string | undefined
  if (createDefaultPart) {
    const prefs = parseAlignPrefs(alignPrefs)
    const part = await prisma.songPart.create({
      data: {
        songId: song.id,
        name: clampLibraryTitle(partName ?? '') || null,
        lastOpenedAt: new Date(),
        ...prefs,
      },
    })
    defaultPartId = part.id
  }
  await touchRepertoire(repertoire.id)
  return {
    ok: true,
    id: song.id,
    name: song.name,
    repertoireId: song.repertoireId,
    defaultPartId,
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
  const trimmed = clampLibraryTitle(name) || null
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

/**
 * Duplicate a session (SongPart): same mix settings + copied track audio objects.
 * Asks the client only for the new session name.
 */
export async function duplicateSongPart(
  request: Request,
  sourcePartId: string,
  name: string,
): Promise<
  | { ok: true; id: string; name: string | null; songId: string }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!sourcePartId) return { ok: false, reason: 'invalid' }

  const source = await prisma.songPart.findFirst({
    where: {
      id: sourcePartId,
      song: { repertoire: { group: { userId: user.id } } },
    },
    include: {
      song: { select: { id: true, repertoireId: true } },
      tracks: {
        where: {
          uploadedAt: { not: null },
          NOT: { objectKey: 'pending' },
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })
  if (!source) return { ok: false, reason: 'not_found' }

  if (source.tracks.length > 0 && !isS3Configured()) {
    return { ok: false, reason: 's3_not_configured' }
  }

  const trimmed = clampLibraryTitle(name) || null
  const createdKeys: string[] = []

  try {
    const part = await prisma.songPart.create({
      data: {
        songId: source.songId,
        name: trimmed,
        lastOpenedAt: new Date(),
        sortOrder: await nextSongPartSortOrder(source.songId),
        masterVolume: source.masterVolume,
        autoAlignEnabled: source.autoAlignEnabled,
        showCalageWarnings: source.showCalageWarnings,
        skipCountInPlayback: source.skipCountInPlayback,
        skipCountInDownload: source.skipCountInDownload,
        metronomeBpm: source.metronomeBpm,
        metronomeVolume: source.metronomeVolume,
      },
    })

    for (const track of source.tracks) {
      const ext =
        track.objectKey.includes('.')
          ? track.objectKey.slice(track.objectKey.lastIndexOf('.') + 1)
          : extensionForContentType(track.contentType)
      const asset = await prisma.trackAsset.create({
        data: {
          songPartId: part.id,
          name: track.name,
          objectKey: 'pending',
          contentType: track.contentType,
          byteSize: track.byteSize,
          durationMs: track.durationMs,
          offsetMs: track.offsetMs,
          volume: track.volume,
          muted: track.muted,
          muteRanges: track.muteRanges ?? [],
          sortOrder: track.sortOrder,
          clientTrackId: track.clientTrackId,
          uploadedByUserId: track.uploadedByUserId ?? user.id,
          uploadedAt: null,
        },
      })
      const objectKey = `${getS3KeyPrefix()}/${user.id}/${asset.id}.${ext}`
      await copyObject(track.objectKey, objectKey)
      createdKeys.push(objectKey)
      await prisma.trackAsset.update({
        where: { id: asset.id },
        data: {
          objectKey,
          uploadedAt: track.uploadedAt ?? new Date(),
        },
      })
    }

    await touchRepertoire(source.song.repertoireId)
    return { ok: true, id: part.id, name: part.name, songId: source.songId }
  } catch (error) {
    console.error('[cloud] duplicateSongPart failed', error)
    if (createdKeys.length > 0) {
      try {
        await deleteObjectsByKeys(createdKeys)
      } catch {
        // best-effort cleanup
      }
    }
    return { ok: false, reason: 'failed' }
  }
}

/**
 * Move a session (SongPart) to another song owned by the same user.
 * Audio objects stay put; only the part’s parent song changes.
 */
export async function moveSongPart(
  request: Request,
  songPartId: string,
  targetSongId: string,
): Promise<
  | { ok: true; id: string; name: string | null; songId: string }
  | { ok: false; reason: CloudFailureReason }
> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!songPartId || !targetSongId) return { ok: false, reason: 'invalid' }

  const part = await prisma.songPart.findFirst({
    where: {
      id: songPartId,
      song: { repertoire: { group: { userId: user.id } } },
    },
    include: {
      song: { select: { id: true, repertoireId: true } },
    },
  })
  if (!part) return { ok: false, reason: 'not_found' }

  if (part.songId === targetSongId) {
    return { ok: true, id: part.id, name: part.name, songId: part.songId }
  }

  const target = await assertOwnedSong(user.id, targetSongId)
  if (!target) return { ok: false, reason: 'not_found' }

  const updated = await prisma.songPart.update({
    where: { id: part.id },
    data: {
      songId: target.id,
      sortOrder: await nextSongPartSortOrder(target.id),
      lastOpenedAt: new Date(),
    },
  })

  await touchRepertoire(part.song.repertoireId)
  if (target.repertoireId !== part.song.repertoireId) {
    await touchRepertoire(target.repertoireId)
  }

  return {
    ok: true,
    id: updated.id,
    name: updated.name,
    songId: updated.songId,
  }
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
  const trimmed = clampLibraryTitle(name)
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
    const { deleteObjectsByKeys } = await import('../s3.server')
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
    const { deleteObjectsByKeys } = await import('../s3.server')
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
    const { deleteObjectsByKeys } = await import('../s3.server')
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
  const { deleteObjectsByKeys } = await import('../s3.server')
  await deleteObjectsByKeys(keys)
  await prisma.group.delete({ where: { id: group.id } })
  return { ok: true }
}
