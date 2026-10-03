import { prisma } from '../db.server'
import { CLOUD_UPLOAD_MAX_BYTES, getS3KeyPrefix } from '../env.server'
import {
  createPresignedPutUrl,
  headObject,
  isS3Configured,
} from '../s3.server'
import type {
  CloudFailureReason,
  CloudLibraryPath,
  CompleteUploadResult,
  DefaultUploadDestination,
  PresignResult,
} from './types'
import {
  assertCollaborativeSongPart,
  assertMutableTrackAsset,
  assertOwnedSongPart,
  clampStoredTrackVolume,
  DEFAULT_SONG_NAME_PREFIX,
  ensureDefaultTree,
  extensionForContentType,
  isUser,
  nextSongSortOrder,
  nextTrackSortOrder,
  requireUser,
  touchRepertoire,
  touchSongPart,
} from './helpers.server'

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

export async function resolveSongPartForUpload(
  userId: string,
  songPartId: string | null | undefined,
  sessionTitle: string | null | undefined,
  metronomeBpm?: number | null,
  metronomeVolume?: number | null,
) {
  if (songPartId) {
    const owned = await assertOwnedSongPart(userId, songPartId)
    if (owned) {
      const data: { metronomeBpm?: number; metronomeVolume?: number } = {}
      if (
        metronomeBpm != null &&
        Number.isFinite(metronomeBpm) &&
        owned.metronomeBpm !== Math.round(metronomeBpm)
      ) {
        const n = Math.round(Number(metronomeBpm))
        if (n >= 30 && n <= 240) data.metronomeBpm = n
      }
      const vol = clampStoredTrackVolume(metronomeVolume ?? NaN)
      if (vol != null && owned.metronomeVolume !== vol) {
        data.metronomeVolume = vol
      }
      if (Object.keys(data).length > 0) {
        await prisma.songPart.update({
          where: { id: owned.id },
          data,
        })
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
  const initialMetroVolume = clampStoredTrackVolume(metronomeVolume ?? 1) ?? 1
  const part = await prisma.songPart.create({
    data: {
      songId: song.id,
      name: null,
      lastOpenedAt: new Date(),
      metronomeBpm: initialMetro,
      metronomeVolume: initialMetroVolume,
    },
  })
  await touchRepertoire(repertoire.id)
  return part
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
    metronomeVolume?: number | null
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
      input.metronomeVolume,
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
