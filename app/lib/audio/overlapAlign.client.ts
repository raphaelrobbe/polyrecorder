/**
 * Align two overlapping takes via onset-strength cross-correlation.
 * Browser port of scripts/align-tracks.ts (AudioBuffer, no ffmpeg).
 *
 * Sign convention (matches track.offsetMs):
 *   positive offsetMs ⇒ place B later on the mix timeline than A
 *   mixTime = bufferTime + offsetMs / 1000
 */

const DECODE_SR = 16_000
const ENV_WIN_MS = 15
const MIN_OVERLAP_S = 0.8
const MIN_ENERGY_RATIO = 0.15
/** Default search half-width around the provisional offset. */
export const OVERLAP_ALIGN_WINDOW_MS = 500
/** Reject sync if best raw NCC is below this. */
const MIN_NCC = 0.25

type LagHit = {
  lagFrames: number
  ncc: number
  score: number
  overlapFrames: number
}

function monoAtRate(buffer: AudioBuffer, targetRate: number): Float32Array {
  const channels = buffer.numberOfChannels
  const srcRate = buffer.sampleRate
  const srcLen = buffer.length
  const durationS = srcLen / srcRate
  const outLen = Math.max(1, Math.round(durationS * targetRate))
  const out = new Float32Array(outLen)

  const ch0 = buffer.getChannelData(0)
  const ch1 = channels > 1 ? buffer.getChannelData(1) : null

  for (let i = 0; i < outLen; i++) {
    const srcPos = (i / targetRate) * srcRate
    const i0 = Math.min(srcLen - 1, Math.floor(srcPos))
    const i1 = Math.min(srcLen - 1, i0 + 1)
    const frac = srcPos - i0
    let s0 = ch0[i0] ?? 0
    let s1 = ch0[i1] ?? 0
    if (ch1) {
      s0 = 0.5 * (s0 + (ch1[i0] ?? 0))
      s1 = 0.5 * (s1 + (ch1[i1] ?? 0))
    }
    out[i] = s0 + (s1 - s0) * frac
  }
  return out
}

function rmsEnvelope(samples: Float32Array, win: number): Float32Array {
  const n = Math.ceil(samples.length / win)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const start = i * win
    const end = Math.min(samples.length, start + win)
    let sum = 0
    for (let j = start; j < end; j++) {
      const v = samples[j]!
      sum += v * v
    }
    out[i] = Math.sqrt(sum / Math.max(1, end - start))
  }
  return out
}

function onsetStrength(envelope: Float32Array): Float32Array {
  const out = new Float32Array(envelope.length)
  for (let i = 1; i < envelope.length; i++) {
    out[i] = Math.max(0, (envelope[i] ?? 0) - (envelope[i - 1] ?? 0))
  }
  return out
}

/**
 * Normalized cross-correlation of B against A over lags in [lagMin, lagMax].
 * Lag L means A[i] ↔ B[i - L] (positive L ⇒ B delayed on A's timeline).
 */
function crossCorrelateOnsets(
  a: Float32Array,
  b: Float32Array,
  envRate: number,
  lagMin: number,
  lagMax: number,
): LagHit[] {
  const minOverlap = Math.max(8, Math.round(MIN_OVERLAP_S * envRate))
  const meanA = a.reduce((s, v) => s + v * v, 0) / Math.max(1, a.length)
  const meanB = b.reduce((s, v) => s + v * v, 0) / Math.max(1, b.length)
  const minEa = meanA * minOverlap * MIN_ENERGY_RATIO
  const minEb = meanB * minOverlap * MIN_ENERGY_RATIO
  const maxLen = Math.max(a.length, b.length)

  const hits: LagHit[] = []
  const lo = Math.max(-(b.length - 1), Math.floor(lagMin))
  const hi = Math.min(a.length - 1, Math.ceil(lagMax))

  for (let lag = lo; lag <= hi; lag++) {
    const i0 = Math.max(0, lag)
    const i1 = Math.min(a.length, b.length + lag)
    const overlap = i1 - i0
    if (overlap < minOverlap) continue

    let ea = 0
    let eb = 0
    let dot = 0
    for (let i = i0; i < i1; i++) {
      const av = a[i]!
      const bv = b[i - lag]!
      ea += av * av
      eb += bv * bv
      dot += av * bv
    }
    if (ea < minEa || eb < minEb) continue

    const denom = Math.sqrt(ea * eb)
    const ncc = denom > 1e-12 ? dot / denom : 0
    const score = ncc * Math.sqrt(overlap / maxLen)
    hits.push({ lagFrames: lag, ncc, score, overlapFrames: overlap })
  }

  hits.sort((x, y) => y.score - x.score)
  return hits
}

function refineLag(hits: LagHit[], best: LagHit, envRate: number): number {
  const byLag = new Map(hits.map((h) => [h.lagFrames, h.score]))
  const y0 = byLag.get(best.lagFrames - 1) ?? best.score
  const y1 = best.score
  const y2 = byLag.get(best.lagFrames + 1) ?? best.score
  const denom = y0 - 2 * y1 + y2
  const delta = Math.abs(denom) > 1e-12 ? (0.5 * (y0 - y2)) / denom : 0
  const refined = best.lagFrames + Math.max(-0.5, Math.min(0.5, delta))
  return (refined / envRate) * 1000
}

export type OverlapAlignResult = {
  offsetMs: number
  ncc: number
  score: number
}

/**
 * Refine B's mix offset against A around a provisional guess.
 * Returns null when correlation is too weak / no valid lag.
 */
export function refineOffsetByOverlap(
  againstBuffer: AudioBuffer,
  newBuffer: AudioBuffer,
  provisionalOffsetMs: number,
  windowMs: number = OVERLAP_ALIGN_WINDOW_MS,
): OverlapAlignResult | null {
  const samplesA = monoAtRate(againstBuffer, DECODE_SR)
  const samplesB = monoAtRate(newBuffer, DECODE_SR)
  const win = Math.max(1, Math.round((ENV_WIN_MS / 1000) * DECODE_SR))
  const envRate = DECODE_SR / win
  const onsetA = onsetStrength(rmsEnvelope(samplesA, win))
  const onsetB = onsetStrength(rmsEnvelope(samplesB, win))

  const centerLag = (provisionalOffsetMs / 1000) * envRate
  const half = (Math.max(50, windowMs) / 1000) * envRate
  const hits = crossCorrelateOnsets(
    onsetA,
    onsetB,
    envRate,
    centerLag - half,
    centerLag + half,
  )
  if (hits.length === 0) return null

  const best = hits[0]!
  if (best.ncc < MIN_NCC) return null

  return {
    offsetMs: refineLag(hits, best, envRate),
    ncc: best.ncc,
    score: best.score,
  }
}
