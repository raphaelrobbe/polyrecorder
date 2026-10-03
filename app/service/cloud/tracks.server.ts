import { prisma } from '../db.server'
import type { CloudFailureReason } from './types'
import {
  assertMutableTrackAsset,
  assertOwnedSongPart,
  clampStoredTrackVolume,
  isUser,
  normalizeMuteRanges,
  requireUser,
} from './helpers.server'

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

/**
 * Persist non-destructive mute windows (buffer-local ms).
 * Allowed for track uploader, or song owner when uploadedByUserId is legacy null.
 */
export async function setTrackAssetMuteRanges(
  request: Request,
  trackAssetId: string,
  muteRangesRaw: unknown,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  if (!trackAssetId) return { ok: false, reason: 'invalid' }

  const muteRanges = normalizeMuteRanges(muteRangesRaw)
  if (muteRanges == null) return { ok: false, reason: 'invalid' }

  const asset = await prisma.trackAsset.findFirst({
    where: { id: trackAssetId },
    include: {
      songPart: {
        include: {
          song: {
            include: {
              repertoire: { include: { group: { select: { userId: true } } } },
            },
          },
        },
      },
    },
  })
  if (!asset) return { ok: false, reason: 'not_found' }

  const isUploader = asset.uploadedByUserId === user.id
  const isLegacyOwner =
    asset.uploadedByUserId == null &&
    asset.songPart.song.repertoire.group.userId === user.id
  if (!isUploader && !isLegacyOwner) {
    return { ok: false, reason: 'not_found' }
  }

  await prisma.trackAsset.update({
    where: { id: asset.id },
    data: { muteRanges },
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

  const { deleteObjectsByKeys } = await import('../s3.server')
  if (asset.objectKey && asset.objectKey !== 'pending') {
    await deleteObjectsByKeys([asset.objectKey])
  }
  await prisma.trackAsset.delete({ where: { id: asset.id } })
  return { ok: true }
}
