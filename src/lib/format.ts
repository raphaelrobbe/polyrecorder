import type { Track } from '../types'

export function formatSignedMs(ms: number): string {
  const rounded = Math.round(ms)
  if (rounded > 0) return `+${rounded} ms`
  return `${rounded} ms`
}

export function parseOffsetMsInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s*ms$/i, '').replace(/\s+/g, '')
  if (!cleaned || cleaned === '+' || cleaned === '-') return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.round(Math.max(-120_000, Math.min(120_000, value)))
}

export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatCentis(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms))
  const m = Math.floor(totalMs / 60_000)
  const s = Math.floor((totalMs % 60_000) / 1000)
  const millis = totalMs % 1000
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

/** Like formatCentis, but omit minutes when they are zero (e.g. 00.420). */
export function formatCentisCompact(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms))
  const m = Math.floor(totalMs / 60_000)
  const s = Math.floor((totalMs % 60_000) / 1000)
  const millis = totalMs % 1000
  const sec = `${String(s).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
  return m === 0 ? sec : `${m}:${sec}`
}

export function defaultSessionTitle(): string {
  return 'Ma polyphonie'
}

export function isDefaultSessionTitle(name: string): boolean {
  return name.trim() === defaultSessionTitle()
}

export function sanitizeFilenamePart(value: string): string {
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
  return cleaned
}

export function filenameFromSessionTitle(sessionTitle: string): string {
  return sanitizeFilenamePart(sessionTitle) || defaultSessionTitle()
}

/**
 * Build an MP3 download name from the session title and selection.
 * Pass `totalTrackCount` so a full selection can collapse to just the title.
 */
export function downloadFilenameForSelection(
  sessionTitle: string,
  selected: Track[],
  totalTrackCount: number,
): string {
  const title = filenameFromSessionTitle(sessionTitle)
  if (selected.length === 0 || selected.length === totalTrackCount) {
    return `${title}.mp3`
  }
  const trackParts = selected
    .map((track) => sanitizeFilenamePart(track.name) || 'piste')
    .join(' - ')
  return `${title}_${trackParts}.mp3`
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function defaultTrackName(index: number): string {
  return `Piste ${index}`
}

export function isDefaultTrackName(name: string): boolean {
  return /^Piste \d+$/.test(name.trim())
}

export function formatAlignDetail(
  offsetMs: number,
  detail: { delta3Ms: number; delta4Ms: number } | undefined,
): string {
  if (!detail) return formatSignedMs(offsetMs)
  return `${formatSignedMs(offsetMs)} (Δ3 ${formatSignedMs(detail.delta3Ms)}, Δ4 ${formatSignedMs(detail.delta4Ms)})`
}

/** Mix timeline length from track offsets + durations (no audio decode). */
export function getMixDurationMs(tracks: Track[]): number {
  let max = 0
  for (const track of tracks) {
    const delay = Math.max(0, track.offsetMs)
    const skip = Math.max(0, -track.offsetMs)
    const playable = Math.max(0, track.durationMs - skip)
    max = Math.max(max, delay + playable)
  }
  return max
}

export function getMaxTrackDurationMs(tracks: Track[]): number {
  let max = 0
  for (const track of tracks) {
    max = Math.max(max, track.durationMs)
  }
  return max
}

export function normalizeSessionTitle(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 60) || defaultSessionTitle()
}
