/**
 * Align two overlapping takes via onset-strength cross-correlation.
 *
 * Punch-in / re-take use case: track A has a flub; track B re-records from
 * an earlier point. Shared musical content is found by correlating onset
 * envelopes (attack timing), which is more robust than raw loudness when
 * two takes have different dynamics.
 *
 * Sign convention (matches track.offsetMs in the app):
 *   positive offsetMs ⇒ place B later on the mix timeline than A
 *   mixTime = bufferTime + offsetMs / 1000
 *
 * If similar content sits at A@tA and B@tB, then
 *   offsetMs ≈ (tA - tB) * 1000
 * so A's ~5s lining up with B's ~1s ⇒ ~+4000 ms.
 *
 * Usage:
 *   bun scripts/align-tracks.ts [pathA] [pathB]
 * Defaults: tests/piste1.mp3 tests/piste1b.mp3
 */

import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DECODE_SR = 16_000
const ENV_WIN_MS = 15
const MIN_OVERLAP_S = 0.8
/** Reject lags whose overlap energy is below this fraction of mean energy. */
const MIN_ENERGY_RATIO = 0.15
const TOP_N = 5

type Pcm = {
  path: string
  sampleRate: number
  samples: Float32Array
  durationS: number
}

async function decodeMonoF32(path: string, sampleRate: number): Promise<Pcm> {
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    path,
    '-ac',
    '1',
    '-ar',
    String(sampleRate),
    '-f',
    'f32le',
    '-acodec',
    'pcm_f32le',
    'pipe:1',
  ]

  const chunks: Buffer[] = []
  await new Promise<void>((resolvePromise, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stdout.on('data', (c: Buffer) => chunks.push(c))
    child.stderr.on('data', (c: Buffer) => {
      stderr += c.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`ffmpeg failed (${code}) for ${path}: ${stderr}`))
    })
  })

  const buf = Buffer.concat(chunks)
  if (buf.byteLength < 4 || buf.byteLength % 4 !== 0) {
    throw new Error(`Unexpected PCM size for ${path}: ${buf.byteLength}`)
  }
  const samples = new Float32Array(
    buf.buffer,
    buf.byteOffset,
    buf.byteLength / 4,
  )
  return {
    path,
    sampleRate,
    samples,
    durationS: samples.length / sampleRate,
  }
}

/** Short-window RMS envelope. */
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

/**
 * Onset strength = positive derivative of the RMS envelope
 * (same idea as app/lib/audio/peaks.client.ts).
 */
function onsetStrength(envelope: Float32Array): Float32Array {
  const out = new Float32Array(envelope.length)
  for (let i = 1; i < envelope.length; i++) {
    out[i] = Math.max(0, (envelope[i] ?? 0) - (envelope[i - 1] ?? 0))
  }
  return out
}

type LagHit = {
  lagFrames: number
  /** Raw normalized correlation in [-1, 1]. */
  ncc: number
  /** NCC × √(overlap / maxLen) — prefers solid overlaps. */
  score: number
  overlapFrames: number
}

/**
 * Normalized cross-correlation of B against A over all feasible lags.
 * Lag L means A[i] ↔ B[i - L] (positive L ⇒ B delayed on A's timeline).
 */
function crossCorrelateOnsets(
  a: Float32Array,
  b: Float32Array,
  envRate: number,
): LagHit[] {
  const minOverlap = Math.max(8, Math.round(MIN_OVERLAP_S * envRate))
  const meanA =
    a.reduce((s, v) => s + v * v, 0) / Math.max(1, a.length)
  const meanB =
    b.reduce((s, v) => s + v * v, 0) / Math.max(1, b.length)
  const minEa = meanA * minOverlap * MIN_ENERGY_RATIO
  const minEb = meanB * minOverlap * MIN_ENERGY_RATIO
  const maxLen = Math.max(a.length, b.length)

  const hits: LagHit[] = []
  const lagMin = -(b.length - 1)
  const lagMax = a.length - 1

  for (let lag = lagMin; lag <= lagMax; lag++) {
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
    // Skip near-silent overlaps (avoids false 0.999 scores on noise floors).
    if (ea < minEa || eb < minEb) continue

    const denom = Math.sqrt(ea * eb)
    const ncc = denom > 1e-12 ? dot / denom : 0
    const score = ncc * Math.sqrt(overlap / maxLen)
    hits.push({ lagFrames: lag, ncc, score, overlapFrames: overlap })
  }

  hits.sort((x, y) => y.score - x.score)
  return hits
}

/** Sub-bin parabolic peak refinement around the best lag. */
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

function fmtMs(ms: number): string {
  const sign = ms >= 0 ? '+' : ''
  return `${sign}${ms.toFixed(1)} ms`
}

function fmtTime(s: number): string {
  const clamped = Math.max(0, s)
  const m = Math.floor(clamped / 60)
  const sec = clamped - m * 60
  return `${m}:${sec.toFixed(3).padStart(6, '0')}`
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const pathA = resolve(root, process.argv[2] ?? 'tests/piste1.mp3')
  const pathB = resolve(root, process.argv[3] ?? 'tests/piste1b.mp3')

  console.log('Decoding (ffmpeg → mono f32)…')
  console.log(`  A: ${pathA}`)
  console.log(`  B: ${pathB}`)
  console.log(`  sample rate: ${DECODE_SR} Hz`)

  const [pcmA, pcmB] = await Promise.all([
    decodeMonoF32(pathA, DECODE_SR),
    decodeMonoF32(pathB, DECODE_SR),
  ])

  console.log(
    `  A duration: ${pcmA.durationS.toFixed(3)} s (${pcmA.samples.length} samples)`,
  )
  console.log(
    `  B duration: ${pcmB.durationS.toFixed(3)} s (${pcmB.samples.length} samples)`,
  )

  const win = Math.max(1, Math.round((ENV_WIN_MS / 1000) * DECODE_SR))
  const envRate = DECODE_SR / win
  const onsetA = onsetStrength(rmsEnvelope(pcmA.samples, win))
  const onsetB = onsetStrength(rmsEnvelope(pcmB.samples, win))

  console.log(
    `\nCorrelating onset envelopes (${ENV_WIN_MS} ms bins, min overlap ${MIN_OVERLAP_S}s)…`,
  )

  const hits = crossCorrelateOnsets(onsetA, onsetB, envRate)
  if (hits.length === 0) {
    console.error('No valid lag found (check silence / overlap).')
    process.exit(2)
  }

  const best = hits[0]!
  const offsetMs = refineLag(hits, best, envRate)
  const coarseMs = (best.lagFrames / envRate) * 1000

  console.log('\n=== Result ===')
  console.log(
    `Best score: ${best.score.toFixed(4)} (raw NCC ${best.ncc.toFixed(4)}, overlap ${(best.overlapFrames / envRate).toFixed(2)}s)`,
  )
  console.log(
    `B offset relative to A: ${fmtMs(offsetMs)}  (coarse ${fmtMs(coarseMs)})`,
  )
  console.log(
    'Convention: positive ⇒ delay B on the mix timeline (mixTime = B_time + offset).',
  )

  const aDur = pcmA.durationS
  const bDur = pcmB.durationS
  const mixBStart = offsetMs / 1000
  const mixOverlapStart = Math.max(0, mixBStart)
  const mixOverlapEnd = Math.min(aDur, mixBStart + bDur)
  const overlapDur = Math.max(0, mixOverlapEnd - mixOverlapStart)

  if (overlapDur > 0.25) {
    // Splice a bit into the overlap (not at the edge where takes may diverge).
    const cutMix = mixOverlapStart + Math.min(1.2, overlapDur * 0.35)
    const cutA = cutMix
    const cutB = cutMix - mixBStart
    console.log('\n=== Suggested splice (A offset = 0) ===')
    console.log(
      `Overlap on mix: ${fmtTime(mixOverlapStart)} → ${fmtTime(mixOverlapEnd)} (${(overlapDur * 1000).toFixed(0)} ms)`,
    )
    console.log(
      `Use A [${fmtTime(0)} → ${fmtTime(cutA)}] + B [${fmtTime(cutB)} → ${fmtTime(bDur)}]`,
    )
    console.log(
      `  (B mix start @ ${fmtTime(mixBStart)}; aligns B@${fmtTime(cutB)} with A@${fmtTime(cutA)})`,
    )
  } else {
    console.log('\n(No substantial overlap estimated — check the files.)')
  }

  console.log(`\nTop ${TOP_N} lags:`)
  for (const row of hits.slice(0, TOP_N)) {
    const ms = (row.lagFrames / envRate) * 1000
    console.log(
      `  ${fmtMs(ms).padStart(12)}  ncc=${row.ncc.toFixed(4)}  score=${row.score.toFixed(4)}  ov=${(row.overlapFrames / envRate).toFixed(2)}s`,
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
