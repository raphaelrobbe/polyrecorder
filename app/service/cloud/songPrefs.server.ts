import { prisma } from '../db.server'
import type { CloudFailureReason } from './types'
import {
  assertOwnedSong,
  assertOwnedSongPart,
  clampStoredMasterVolume,
  clampStoredTrackVolume,
  isUser,
  parseAlignPrefs,
  requireUser,
} from './helpers.server'

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

export async function updateSongPartMetronomeVolume(
  request: Request,
  songPartId: string,
  metronomeVolume: number,
): Promise<{ ok: true } | { ok: false; reason: CloudFailureReason }> {
  const userOrErr = await requireUser(request)
  if (!isUser(userOrErr)) return userOrErr
  const user = userOrErr
  const next = clampStoredTrackVolume(metronomeVolume)
  if (!songPartId || next == null) return { ok: false, reason: 'invalid' }

  const part = await assertOwnedSongPart(user.id, songPartId)
  if (!part) return { ok: false, reason: 'not_found' }

  await prisma.songPart.update({
    where: { id: part.id },
    data: { metronomeVolume: next },
  })
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
