import type { CutWorkSegment, Track } from '../../common/types'

export type MuteRange = { startMs: number; endMs: number }
export type MixRange = { startMs: number; endMs: number }

/** Audible window of a track on the mix timeline (same math as getMixDurationMs). */
export function audibleMixRange(track: Track): MixRange {
  const delayMs = Math.max(0, track.offsetMs)
  const skipMs = Math.max(0, -track.offsetMs)
  const playableMs = Math.max(0, track.durationMs - skipMs)
  return { startMs: delayMs, endMs: delayMs + playableMs }
}

/** Convert mix-timeline range → buffer-local ms (clamped to the buffer). */
export function bufferRangeFromMix(
  track: Track,
  startMs: number,
  endMs: number,
): MuteRange {
  const bufStart = Math.max(0, startMs - track.offsetMs)
  const bufEnd = Math.max(0, endMs - track.offsetMs)
  const clampedStart = Math.max(0, Math.min(track.durationMs, bufStart))
  const clampedEnd = Math.max(
    clampedStart,
    Math.min(track.durationMs, bufEnd),
  )
  return { startMs: clampedStart, endMs: clampedEnd }
}

/** Convert buffer-local range → mix-timeline ms. */
export function mixRangeFromBuffer(
  track: Track,
  startMs: number,
  endMs: number,
): MixRange {
  return {
    startMs: startMs + track.offsetMs,
    endMs: endMs + track.offsetMs,
  }
}

/** Split every segment that contains playheadMs into two halves. */
export function splitSegmentsAtPlayhead(
  segments: CutWorkSegment[],
  playheadMs: number,
): CutWorkSegment[] {
  const out: CutWorkSegment[] = []
  for (const seg of segments) {
    if (playheadMs > seg.startMs && playheadMs < seg.endMs) {
      out.push({
        id: newSegmentId(),
        startMs: seg.startMs,
        endMs: playheadMs,
        selected: seg.selected,
      })
      out.push({
        id: newSegmentId(),
        startMs: playheadMs,
        endMs: seg.endMs,
        selected: seg.selected,
      })
    } else {
      out.push(seg)
    }
  }
  return out
}

/** True when any pair of selected mix ranges overlap (strict interior). */
export function segmentsOverlap(
  selected: Array<{ startMs: number; endMs: number }>,
): boolean {
  if (selected.length < 2) return false
  const sorted = [...selected].sort((a, b) => a.startMs - b.startMs)
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!
    const cur = sorted[i]!
    if (cur.startMs < prev.endMs) return true
  }
  return false
}

/** Merge overlapping / adjacent mute ranges (buffer-local). */
export function mergeMuteRanges(ranges: MuteRange[]): MuteRange[] {
  if (ranges.length === 0) return []
  const sorted = [...ranges]
    .filter((r) => r.endMs > r.startMs)
    .sort((a, b) => a.startMs - b.startMs)
  if (sorted.length === 0) return []
  const out: MuteRange[] = [{ ...sorted[0]! }]
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i]!
    const last = out[out.length - 1]!
    if (cur.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, cur.endMs)
    } else {
      out.push({ ...cur })
    }
  }
  return out
}

/**
 * Unmuted intervals within [fromS, toS] on the buffer timeline (seconds).
 * Used by scheduleTrackSource / offline mix to skip muteRanges.
 */
export function unmutedBufferIntervals(
  muteRanges: MuteRange[] | undefined,
  fromS: number,
  toS: number,
): Array<{ startS: number; endS: number }> {
  if (toS <= fromS) return []
  const merged = mergeMuteRanges(muteRanges ?? []).map((r) => ({
    startS: r.startMs / 1000,
    endS: r.endMs / 1000,
  }))
  const out: Array<{ startS: number; endS: number }> = []
  let cursor = fromS
  for (const mute of merged) {
    if (mute.endS <= cursor) continue
    if (mute.startS >= toS) break
    const muteStart = Math.max(mute.startS, cursor)
    const muteEnd = Math.min(mute.endS, toS)
    if (muteStart > cursor) out.push({ startS: cursor, endS: muteStart })
    cursor = Math.max(cursor, muteEnd)
  }
  if (cursor < toS) out.push({ startS: cursor, endS: toS })
  return out
}

export function newSegmentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `seg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
