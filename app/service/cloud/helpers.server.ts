import type { User as AppUser } from '~/common/user'
import { prisma } from '../db.server'
import { getUserFromRequest } from '../auth.server'
import type { SongPartAlignPrefs } from './types'

export const DEFAULT_GROUP_NAME = 'Personnel'
export const DEFAULT_REPERTOIRE_NAME = 'Général'
/** Fallback song name when first upload creates a work with no title yet. */
export const DEFAULT_SONG_NAME_PREFIX = 'Session'

export function extensionForContentType(contentType: string): string {
  const lower = contentType.toLowerCase()
  if (lower.includes('ogg')) return 'ogg'
  if (lower.includes('mpeg') || lower.includes('mp3')) return 'mp3'
  if (lower.includes('wav')) return 'wav'
  if (lower.includes('mp4') || lower.includes('m4a')) return 'm4a'
  return 'webm'
}

const TRACK_VOLUME_MAX = 2
const MASTER_VOLUME_MAX = 2

export function clampStoredTrackVolume(value: number): number | null {
  if (!Number.isFinite(value)) return null
  return Math.min(TRACK_VOLUME_MAX, Math.max(0, value))
}

export function clampStoredMasterVolume(value: number): number | null {
  if (!Number.isFinite(value)) return null
  return Math.min(MASTER_VOLUME_MAX, Math.max(0, value))
}

const DEFAULT_ALIGN_PREFS: SongPartAlignPrefs = {
  autoAlignEnabled: true,
  showCalageWarnings: true,
  skipCountInPlayback: true,
  skipCountInDownload: true,
}

export function parseAlignPrefs(raw: unknown): SongPartAlignPrefs {
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

export async function resolveAlignPrefsForNewPart(
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

export async function requireUser(
  request: Request,
): Promise<AppUser | { ok: false; reason: 'unauthorized' }> {
  const user = await getUserFromRequest(request)
  if (!user) return { ok: false, reason: 'unauthorized' }
  return user
}

export function isUser(
  value: AppUser | { ok: false; reason: 'unauthorized' },
): value is AppUser {
  return !('ok' in value)
}

export async function assertOwnedGroup(userId: string, groupId: string) {
  return prisma.group.findFirst({
    where: { id: groupId, userId },
  })
}

export async function assertOwnedRepertoire(userId: string, repertoireId: string) {
  return prisma.repertoire.findFirst({
    where: { id: repertoireId, group: { userId } },
  })
}

export async function assertOwnedSong(userId: string, songId: string) {
  return prisma.song.findFirst({
    where: { id: songId, repertoire: { group: { userId } } },
  })
}

export async function assertOwnedSongPart(userId: string, songPartId: string) {
  return prisma.songPart.findFirst({
    where: {
      id: songPartId,
      song: { repertoire: { group: { userId } } },
    },
  })
}

export async function assertOwnedTrackAsset(userId: string, trackAssetId: string) {
  return prisma.trackAsset.findFirst({
    where: {
      id: trackAssetId,
      songPart: { song: { repertoire: { group: { userId } } } },
    },
  })
}

/** Song owner, or the user who uploaded the take (collaborator). */
export async function assertMutableTrackAsset(userId: string, trackAssetId: string) {
  const owned = await assertOwnedTrackAsset(userId, trackAssetId)
  if (owned) return owned
  return prisma.trackAsset.findFirst({
    where: { id: trackAssetId, uploadedByUserId: userId },
  })
}

/** Public collaborative session a signed-in non-owner may contribute to. */
export async function assertCollaborativeSongPart(
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
export async function nextGroupSortOrder(userId: string): Promise<number> {
  const last = await prisma.group.findFirst({
    where: { userId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

export async function nextRepertoireSortOrder(groupId: string): Promise<number> {
  const last = await prisma.repertoire.findFirst({
    where: { groupId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

export async function nextSongSortOrder(repertoireId: string): Promise<number> {
  const last = await prisma.song.findFirst({
    where: { repertoireId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

export async function nextSongPartSortOrder(songId: string): Promise<number> {
  const last = await prisma.songPart.findFirst({
    where: { songId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

export async function nextTrackSortOrder(songPartId: string): Promise<number> {
  const last = await prisma.trackAsset.findFirst({
    where: { songPartId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  return last ? last.sortOrder + 1 : 0
}

export async function ensureDefaultTree(userId: string) {
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

export async function touchRepertoire(repertoireId: string) {
  await prisma.repertoire.update({
    where: { id: repertoireId },
    data: { updatedAt: new Date() },
  })
}

/** Bump the part, its song and the enclosing repertoire as "just used". */
export async function touchSongPart(part: { id: string; songId: string }) {
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

export function normalizeMuteRanges(
  raw: unknown,
): Array<{ startMs: number; endMs: number }> | null {
  if (!Array.isArray(raw)) return null
  const out: Array<{ startMs: number; endMs: number }> = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const startMs = Number((item as { startMs?: unknown }).startMs)
    const endMs = Number((item as { endMs?: unknown }).endMs)
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null
    if (endMs <= startMs) continue
    out.push({
      startMs: Math.max(0, Math.round(startMs)),
      endMs: Math.max(0, Math.round(endMs)),
    })
  }
  out.sort((a, b) => a.startMs - b.startMs)
  return out
}
