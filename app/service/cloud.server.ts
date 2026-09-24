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

async function assertOwnedTrackAsset(userId: string, trackAssetId: string) {
  return prisma.trackAsset.findFirst({
    where: {
      id: trackAssetId,
      song: { repertoire: { group: { userId } } },
    },
  })
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
    data: { userId, name: DEFAULT_GROUP_NAME },
  })
  const repertoire = await prisma.repertoire.create({
    data: { groupId: group.id, name: DEFAULT_REPERTOIRE_NAME },
  })
  return { group, repertoire }
}

async function touchRepertoire(repertoireId: string) {
  await prisma.repertoire.update({
    where: { id: repertoireId },
    data: { updatedAt: new Date() },
  })
}

async function resolveSongForUpload(
  userId: string,
  songId: string | null | undefined,
  sessionTitle: string | null | undefined,
) {
  if (songId) {
    const song = await assertOwnedSong(userId, songId)
    if (song) {
      await prisma.song.update({
        where: { id: song.id },
        data: { lastOpenedAt: new Date() },
      })
      await touchRepertoire(song.repertoireId)
      return song
    }
  }

  const recent = await prisma.song.findFirst({
    where: { repertoire: { group: { userId } } },
    orderBy: { lastOpenedAt: 'desc' },
  })
  if (recent) {
    await prisma.song.update({
      where: { id: recent.id },
      data: { lastOpenedAt: new Date() },
    })
    await touchRepertoire(recent.repertoireId)
    return recent
  }

  const { repertoire } = await ensureDefaultTree(userId)
  const name =
    sessionTitle?.trim() ||
    `Session ${new Date().toLocaleDateString('fr-FR')}`
  const song = await prisma.song.create({
    data: {
      repertoireId: repertoire.id,
      name,
      lastOpenedAt: new Date(),
    },
  })
  await touchRepertoire(repertoire.id)
  return song
}

export type PresignResult =
  | {
      ok: true
      uploadUrl: string
      trackAssetId: string
      objectKey: string
      songId: string
    }
  | { ok: false; reason: CloudFailureReason }

export async function presignTrackUpload(
  request: Request,
  input: {
    songId?: string | null
    name: string
    contentType: string
    byteSize: number
    durationMs: number
    offsetMs: number
    clientTrackId?: number | null
    sessionTitle?: string | null
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

    const song = await resolveSongForUpload(
      user.id,
      input.songId,
      input.sessionTitle,
    )

    const trackAsset = await prisma.trackAsset.create({
      data: {
        songId: song.id,
        name,
        objectKey: 'pending',
        contentType,
        byteSize,
        durationMs,
        offsetMs,
        clientTrackId: input.clientTrackId ?? null,
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

    return {
      ok: true,
      uploadUrl,
      trackAssetId: trackAsset.id,
      objectKey,
      songId: song.id,
    }
  } catch (error) {
    console.error('[cloud] presign failed', error)
    return { ok: false, reason: 'failed' }
  }
}

export type CompleteUploadResult =
  | { ok: true; trackAssetId: string; songId: string }
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

    const asset = await assertOwnedTrackAsset(user.id, trackAssetId)
    if (!asset) return { ok: false, reason: 'not_found' }
    if (!asset.objectKey || asset.objectKey === 'pending') {
      return { ok: false, reason: 'incomplete' }
    }

    const head = await headObject(asset.objectKey)
    if (!head) return { ok: false, reason: 'incomplete' }

    const updated = await prisma.trackAsset.update({
      where: { id: asset.id },
      data: { uploadedAt: new Date() },
    })

    return {
      ok: true,
      trackAssetId: updated.id,
      songId: updated.songId,
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
        trackNames: string[]
        lastOpenedAt: string
        updatedAt: string
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
    orderBy: { createdAt: 'asc' },
    include: {
      repertoires: {
        orderBy: { createdAt: 'asc' },
        include: {
          songs: {
            orderBy: { lastOpenedAt: 'desc' },
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
          songs: rep.songs.map((song) => ({
            id: song.id,
            name: song.name,
            isPublic: song.isPublic,
            trackNames: song.tracks.map((track) => track.name),
            lastOpenedAt: song.lastOpenedAt.toISOString(),
            updatedAt: song.updatedAt.toISOString(),
          })),
        })),
      })),
    },
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
    data: { userId: user.id, name: trimmed },
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
    data: { groupId: group.id, name: trimmed },
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
): Promise<
  | { ok: true; id: string; name: string; repertoireId: string }
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
    },
  })
  await touchRepertoire(repertoire.id)
  return {
    ok: true,
    id: song.id,
    name: song.name,
    repertoireId: song.repertoireId,
  }
}

export async function renameLibraryNode(
  request: Request,
  kind: 'group' | 'repertoire' | 'song',
  id: string,
  name: string,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const trimmed = name.trim()
  if (!trimmed || !id) return { ok: false, reason: 'invalid' }

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

  const asset = await assertOwnedTrackAsset(user.id, trackAssetId)
  if (!asset) return { ok: false, reason: 'not_found' }

  await prisma.trackAsset.update({
    where: { id: asset.id },
    data: { name: trimmed },
  })
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

  const asset = await assertOwnedTrackAsset(user.id, trackAssetId)
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
): Promise<{ ok: true; isPublic: boolean } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!songId) return { ok: false, reason: 'invalid' }

  const song = await assertOwnedSong(user.id, songId)
  if (!song) return { ok: false, reason: 'not_found' }

  const updated = await prisma.song.update({
    where: { id: song.id },
    data: { isPublic: Boolean(isPublic) },
  })
  return { ok: true, isPublic: updated.isPublic }
}

export async function deleteLibraryNode(
  request: Request,
  kind: 'group' | 'repertoire' | 'song',
  id: string,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!id) return { ok: false, reason: 'invalid' }

  if (kind === 'song') {
    const song = await prisma.song.findFirst({
      where: { id, repertoire: { group: { userId: user.id } } },
      include: { tracks: { select: { objectKey: true } } },
    })
    if (!song) return { ok: false, reason: 'not_found' }
    const { deleteObjectsByKeys } = await import('./s3.server')
    await deleteObjectsByKeys(
      song.tracks
        .map((t) => t.objectKey)
        .filter((key) => key && key !== 'pending'),
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
        songs: { include: { tracks: { select: { objectKey: true } } } },
      },
    })
    if (!repertoire) return { ok: false, reason: 'not_found' }
    const keys = repertoire.songs.flatMap((s) =>
      s.tracks
        .map((t) => t.objectKey)
        .filter((key) => key && key !== 'pending'),
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
          songs: { include: { tracks: { select: { objectKey: true } } } },
        },
      },
    },
  })
  if (!group) return { ok: false, reason: 'not_found' }
  const keys = group.repertoires.flatMap((r) =>
    r.songs.flatMap((s) =>
      s.tracks
        .map((t) => t.objectKey)
        .filter((key) => key && key !== 'pending'),
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
      song: {
        id: string
        name: string
        repertoireId: string
        isPublic: boolean
        groupName: string
        repertoireName: string
        ownerPseudo: string | null
      }
      tracks: Array<{
        id: string
        name: string
        url: string
        durationMs: number
        offsetMs: number
        contentType: string
      }>
    }
  | { ok: false; reason: CloudFailureReason }

export async function openSong(
  request: Request,
  songId: string,
): Promise<OpenSongResult> {
  try {
    if (!songId) return { ok: false, reason: 'invalid' }

    const user = await getUserFromRequest(request)
    const song = await prisma.song.findFirst({
      where: { id: songId },
      include: {
        repertoire: {
          include: {
            group: {
              select: {
                userId: true,
                name: true,
                user: { select: { pseudo: true } },
              },
            },
          },
        },
        tracks: {
          where: { uploadedAt: { not: null } },
          orderBy: { createdAt: 'asc' },
        },
      },
    })
    if (!song) return { ok: false, reason: 'not_found' }

    const isOwner = Boolean(user && song.repertoire.group.userId === user.id)
    if (!isOwner && !song.isPublic) {
      return { ok: false, reason: 'not_found' }
    }

    if (isOwner) {
      await prisma.song.update({
        where: { id: song.id },
        data: { lastOpenedAt: new Date() },
      })
      await touchRepertoire(song.repertoireId)
    }

    // Empty songs are metadata-only — S3 is only required to fetch audio.
    if (song.tracks.length > 0 && !isS3Configured()) {
      return { ok: false, reason: 's3_not_configured' }
    }

    const tracks = await Promise.all(
      song.tracks.map(async (track) => ({
        id: track.id,
        name: track.name,
        url: await createPresignedGetUrl({ objectKey: track.objectKey }),
        durationMs: track.durationMs,
        offsetMs: track.offsetMs,
        contentType: track.contentType,
      })),
    )

    return {
      ok: true,
      isOwner,
      song: {
        id: song.id,
        name: song.name,
        repertoireId: song.repertoireId,
        isPublic: song.isPublic,
        groupName: song.repertoire.group.name,
        repertoireName: song.repertoire.name,
        ownerPseudo: song.repertoire.group.user.pseudo?.trim() || null,
      },
      tracks,
    }
  } catch (error) {
    console.error('[cloud] openSong failed', error)
    return { ok: false, reason: 'failed' }
  }
}

/** Public song metadata for OG / route loaders (no audio URLs). */
export async function getSongShareMeta(
  request: Request,
  songId: string,
): Promise<
  | {
      ok: true
      isOwner: boolean
      song: {
        id: string
        name: string
        isPublic: boolean
        trackCount: number
      }
    }
  | { ok: false; reason: CloudFailureReason }
> {
  if (!songId) return { ok: false, reason: 'invalid' }

  const user = await getUserFromRequest(request)
  const song = await prisma.song.findFirst({
    where: { id: songId },
    include: {
      repertoire: { include: { group: { select: { userId: true } } } },
      tracks: {
        where: { uploadedAt: { not: null } },
        select: { id: true },
      },
    },
  })
  if (!song) return { ok: false, reason: 'not_found' }

  const isOwner = Boolean(user && song.repertoire.group.userId === user.id)
  if (!isOwner && !song.isPublic) {
    return { ok: false, reason: 'not_found' }
  }

  return {
    ok: true,
    isOwner,
    song: {
      id: song.id,
      name: song.name,
      isPublic: song.isPublic,
      trackCount: song.tracks.length,
    },
  }
}

export async function purgeUserCloudStorage(userId: string): Promise<void> {
  await deleteAllObjectsForUser(userId)
}
