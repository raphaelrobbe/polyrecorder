import type { BeatAssessment } from '../../common/types'

/** Largest count-in gap may be at most 20% bigger than the smallest. */
export const BEAT_GAP_MAX_RATIO = 1.2

/**
 * Detect the first strong onsets (spoken counts or claps).
 * Uses envelope rise (onset strength), not just loudness maxima —
 * claps are too short for a plain RMS peak picker to stay stable.
 * Returns peak times in seconds from the start of the buffer.
 */
export function findVolumePeaks(
  buffer: AudioBuffer,
  count: number,
  options?: { minGapSec?: number; thresholdRatio?: number },
): number[] {
  const channel = buffer.numberOfChannels > 0 ? buffer.getChannelData(0) : null
  if (!channel || channel.length === 0) return []

  const sampleRate = buffer.sampleRate
  const minGapSec = options?.minGapSec ?? 0.18
  const thresholdRatio = options?.thresholdRatio ?? 0.22
  // Short window: keeps clap attacks sharp while still working for speech.
  const windowSize = Math.max(1, Math.floor(0.005 * sampleRate))
  const minGapSamples = Math.floor(minGapSec * sampleRate)
  const refineRadius = Math.floor(0.02 * sampleRate)

  const envelope: number[] = []
  for (let i = 0; i < channel.length; i += windowSize) {
    let sum = 0
    const end = Math.min(channel.length, i + windowSize)
    for (let j = i; j < end; j++) {
      const sample = channel[j] ?? 0
      sum += sample * sample
    }
    envelope.push(Math.sqrt(sum / Math.max(1, end - i)))
  }

  if (envelope.length < 3) return []

  // Onset strength = positive derivative of the envelope.
  const onsets: number[] = [0]
  let maxOnset = 0
  for (let i = 1; i < envelope.length; i++) {
    const rise = Math.max(0, (envelope[i] ?? 0) - (envelope[i - 1] ?? 0))
    onsets.push(rise)
    if (rise > maxOnset) maxOnset = rise
  }
  if (maxOnset < 1e-6) return []

  const threshold = maxOnset * thresholdRatio
  type Candidate = { sample: number; strength: number }
  const candidates: Candidate[] = []

  for (let i = 1; i < onsets.length - 1; i++) {
    const value = onsets[i] ?? 0
    if (value < threshold) continue
    if (value < (onsets[i - 1] ?? 0) || value < (onsets[i + 1] ?? 0)) continue

    const approx = i * windowSize
    let peakSample = approx
    let peakAbs = 0
    const from = Math.max(0, approx - refineRadius)
    const to = Math.min(channel.length, approx + refineRadius)
    for (let j = from; j < to; j++) {
      const abs = Math.abs(channel[j] ?? 0)
      if (abs > peakAbs) {
        peakAbs = abs
        peakSample = j
      }
    }

    candidates.push({ sample: peakSample, strength: value })
  }

  // Keep the strongest onsets, then take the earliest `count` with spacing.
  candidates.sort((a, b) => b.strength - a.strength)

  const chosen: Candidate[] = []
  for (const candidate of candidates) {
    if (chosen.some((c) => Math.abs(c.sample - candidate.sample) < minGapSamples)) {
      continue
    }
    chosen.push(candidate)
  }

  chosen.sort((a, b) => a.sample - b.sample)
  return chosen.slice(0, count).map((c) => c.sample / sampleRate)
}

/** Validate a 1-2-3-4 count-in: 4 attacks and regular gaps (±20%). */
export function assessCountInBeat(peaks: number[]): BeatAssessment {
  if (peaks.length < 4) {
    return { ok: false, reason: 'missing', peaks }
  }

  const beat = peaks.slice(0, 4)
  const gaps = [beat[1]! - beat[0]!, beat[2]! - beat[1]!, beat[3]! - beat[2]!]
  const minGap = Math.min(...gaps)
  const maxGap = Math.max(...gaps)
  if (!(minGap > 0) || maxGap > minGap * BEAT_GAP_MAX_RATIO) {
    return { ok: false, reason: 'irregular', peaks: beat }
  }

  return { ok: true, peaks: beat }
}

/**
 * Pick the peak pair that best matches reference beats 3 and 4.
 * Avoids latching onto speaker-bleed "1-2" when monitoring is audible to the mic.
 */
export function findTakeThreeFourPeaks(
  peaks: number[],
  refThree: number,
  refFour: number,
): [number, number] | null {
  if (peaks.length < 2) return null

  const expectedGap = refFour - refThree
  if (!(expectedGap > 0)) {
    return [peaks[0]!, peaks[1]!]
  }

  let best: { three: number; four: number; score: number } | null = null

  for (let i = 0; i < peaks.length - 1; i++) {
    for (let j = i + 1; j < peaks.length; j++) {
      const three = peaks[i]!
      const four = peaks[j]!
      const gap = four - three
      if (!(gap > 0)) continue

      const gapError = Math.abs(gap - expectedGap) / expectedGap
      // Reject pairs whose spacing is far from the reference 3–4 interval.
      if (gapError > 0.4) continue

      // Prefer pairs near the expected absolute times (overdub punch-in ≈ mix t0).
      const timeError =
        (Math.abs(three - refThree) + Math.abs(four - refFour)) /
        (2 * expectedGap)
      const score = gapError * 2 + timeError
      if (!best || score < best.score) {
        best = { three, four, score }
      }
    }
  }

  if (best) return [best.three, best.four]
  // Fallback: earliest two strong peaks.
  return [peaks[0]!, peaks[1]!]
}
