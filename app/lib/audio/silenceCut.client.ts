/**
 * Find a near-silence cut point inside the overlap of two mix-aligned takes.
 * Used after content Sync to splice “start of A + end of B” on a quiet spot.
 *
 * Important: the new take (B) often has leading silence before singing. Cutting
 * there would drop A mid-phrase and leave a hole until B’s voice enters — so we
 * only search after B’s content onset (and preferably after both are active).
 */

const WINDOW_MS = 40
/** Prefer cuts at least this far from overlap / content-onset edges. */
const EDGE_PAD_MS = 80
/** Wait this long after B’s energy onset before allowing a cut. */
const AFTER_CONTENT_PAD_MS = 300
/** Treat as “quiet enough” if below this fraction of the louder overlap peak. */
const QUIET_RATIO = 0.08
/** Energy onset: first window above this fraction of the track’s peak RMS. */
const ONSET_RATIO = 0.12

function audibleRange(offsetMs: number, durationMs: number) {
  const delayMs = Math.max(0, offsetMs)
  const skipMs = Math.max(0, -offsetMs)
  const playableMs = Math.max(0, durationMs - skipMs)
  return { startMs: delayMs, endMs: delayMs + playableMs }
}

function monoRmsInMixWindow(
  buffer: AudioBuffer,
  offsetMs: number,
  mixStartMs: number,
  mixEndMs: number,
): number {
  const sr = buffer.sampleRate
  const bufStartS = Math.max(0, (mixStartMs - offsetMs) / 1000)
  const bufEndS = Math.max(bufStartS, (mixEndMs - offsetMs) / 1000)
  const i0 = Math.min(buffer.length - 1, Math.max(0, Math.floor(bufStartS * sr)))
  const i1 = Math.min(buffer.length, Math.max(i0 + 1, Math.ceil(bufEndS * sr)))
  const ch0 = buffer.getChannelData(0)
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null
  let sum = 0
  let n = 0
  for (let i = i0; i < i1; i++) {
    let s = ch0[i] ?? 0
    if (ch1) s = 0.5 * (s + (ch1[i] ?? 0))
    sum += s * s
    n += 1
  }
  return n > 0 ? Math.sqrt(sum / n) : 0
}

export type SilenceCutTrack = {
  buffer: AudioBuffer
  offsetMs: number
  durationMs: number
}

/**
 * First mix-timeline ms in [fromMs, toMs] where the track’s RMS rises above
 * a fraction of its peak in that range (start of singing / content).
 */
function findEnergyOnsetMixMs(
  track: SilenceCutTrack,
  fromMs: number,
  toMs: number,
): number | null {
  if (!(toMs - fromMs > WINDOW_MS)) return null

  let peak = 0
  const windows: Array<{ midMs: number; level: number }> = []
  for (let t = fromMs; t + WINDOW_MS <= toMs; t += WINDOW_MS / 2) {
    const level = monoRmsInMixWindow(
      track.buffer,
      track.offsetMs,
      t,
      t + WINDOW_MS,
    )
    const midMs = t + WINDOW_MS / 2
    windows.push({ midMs, level })
    if (level > peak) peak = level
  }
  if (windows.length === 0 || peak <= 0) return null

  const threshold = peak * ONSET_RATIO
  for (const w of windows) {
    if (w.level >= threshold) return Math.round(w.midMs)
  }
  return null
}

/**
 * Mix-timeline ms of the quietest window in the A∩B overlap, after both
 * takes have content (so we don’t cut inside B’s leading silence).
 * Returns null when there is no usable overlap / content region.
 */
export function findQuietestOverlapCutMs(
  trackA: SilenceCutTrack,
  trackB: SilenceCutTrack,
  options?: {
    /** Extra lower bound on the mix timeline (e.g. sync match start). */
    notBeforeMs?: number
  },
): number | null {
  const rangeA = audibleRange(trackA.offsetMs, trackA.durationMs)
  const rangeB = audibleRange(trackB.offsetMs, trackB.durationMs)

  const overlapStart = Math.max(rangeA.startMs, rangeB.startMs)
  const overlapEnd = Math.min(rangeA.endMs, rangeB.endMs)
  if (!(overlapEnd - overlapStart > WINDOW_MS)) return null

  // Don’t cut before the new take (B) actually sings — that’s where Sync
  // found matching content. Prefer after both are active in the overlap.
  const onsetB = findEnergyOnsetMixMs(trackB, overlapStart, overlapEnd)
  const onsetA = findEnergyOnsetMixMs(trackA, overlapStart, overlapEnd)
  const contentStart = Math.max(
    overlapStart,
    options?.notBeforeMs ?? 0,
    onsetB ?? overlapStart,
    onsetA ?? overlapStart,
  )
  const scanStart = Math.min(
    overlapEnd - WINDOW_MS,
    contentStart + AFTER_CONTENT_PAD_MS,
  )

  if (!(overlapEnd - scanStart > WINDOW_MS)) {
    // Tiny post-content window: splice at content start (avoids the hole).
    if (onsetB != null && onsetB < overlapEnd - 20) {
      return Math.round(onsetB)
    }
    return null
  }

  let peak = 0
  const samples: Array<{ midMs: number; level: number }> = []

  for (let t = scanStart; t + WINDOW_MS <= overlapEnd; t += WINDOW_MS / 2) {
    const w0 = t
    const w1 = t + WINDOW_MS
    const rmsA = monoRmsInMixWindow(trackA.buffer, trackA.offsetMs, w0, w1)
    const rmsB = monoRmsInMixWindow(trackB.buffer, trackB.offsetMs, w0, w1)
    // Both must be quiet: use the louder of the two in the window.
    const level = Math.max(rmsA, rmsB)
    const midMs = (w0 + w1) / 2
    samples.push({ midMs, level })
    if (level > peak) peak = level
  }

  if (samples.length === 0) return null

  const threshold = peak > 0 ? peak * QUIET_RATIO : 0
  const padded = samples.filter(
    (s) =>
      s.midMs >= scanStart + EDGE_PAD_MS &&
      s.midMs <= overlapEnd - EDGE_PAD_MS,
  )
  const pool = padded.length > 0 ? padded : samples

  let best = pool[0]!
  for (const s of pool) {
    if (s.level < best.level) best = s
  }

  // Prefer a window that clears the quiet threshold; otherwise best-effort.
  if (threshold > 0) {
    const quiet = pool.filter((s) => s.level <= threshold)
    if (quiet.length > 0) {
      best = quiet[0]!
      for (const s of quiet) {
        if (s.level < best.level) best = s
      }
    }
  }

  return Math.round(best.midMs)
}
