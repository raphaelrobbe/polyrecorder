import type { Track } from '../../common/types'

export const DEFAULT_METRONOME_BPM = 60
export const MIN_METRONOME_BPM = 30
export const MAX_METRONOME_BPM = 240

/** Reference count-in: four clicks (1-2-3-4) at the given tempo. */
const METRONOME_REF_BEATS = 4
const CLICK_FREQ_HZ = 1000
const CLICK_DUR_S = 0.012
const SAMPLE_RATE = 44100
/** Slight delay so onset detection sees a clear attack from silence. */
const FIRST_CLICK_OFFSET_S = 0.02

export function clampMetronomeBpm(raw: number): number {
  if (!Number.isFinite(raw)) return DEFAULT_METRONOME_BPM
  return Math.min(
    MAX_METRONOME_BPM,
    Math.max(MIN_METRONOME_BPM, Math.round(raw)),
  )
}

export function metronomeBeatIntervalSec(bpm: number): number {
  return 60 / clampMetronomeBpm(bpm)
}

/** Peak times (seconds) for the synthetic 1-2-3-4 reference. */
export function metronomeReferencePeaksSec(bpm: number): number[] {
  const interval = metronomeBeatIntervalSec(bpm)
  return Array.from(
    { length: METRONOME_REF_BEATS },
    (_, i) => FIRST_CLICK_OFFSET_S + i * interval,
  )
}

export function metronomeReferenceDurationMs(bpm: number): number {
  const peaks = metronomeReferencePeaksSec(bpm)
  const last = peaks[peaks.length - 1] ?? 0
  return Math.ceil((last + 0.25) * 1000)
}

/** Encode a short mono WAV with four sharp clicks (align reference only). */
export function buildMetronomeReferenceBlob(bpm: number): Blob {
  const safeBpm = clampMetronomeBpm(bpm)
  const peaks = metronomeReferencePeaksSec(safeBpm)
  const durationS = (peaks[peaks.length - 1] ?? 0) + 0.25
  const length = Math.max(1, Math.ceil(durationS * SAMPLE_RATE))
  const samples = new Float32Array(length)

  for (const peakS of peaks) {
    const start = Math.floor(peakS * SAMPLE_RATE)
    const clickSamples = Math.floor(CLICK_DUR_S * SAMPLE_RATE)
    for (let i = 0; i < clickSamples; i++) {
      const idx = start + i
      if (idx >= length) break
      const env = 1 - i / clickSamples
      const t = i / SAMPLE_RATE
      samples[idx] = Math.sin(2 * Math.PI * CLICK_FREQ_HZ * t) * env * 0.85
    }
  }

  return encodeWavMono16(samples, SAMPLE_RATE)
}

function encodeWavMono16(samples: Float32Array, sampleRate: number): Blob {
  const dataLength = samples.length * 2
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  const writeStr = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i))
    }
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, dataLength, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i] ?? 0))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

/**
 * Schedule a click train for mix / overdub monitoring (virtual metronome).
 * Returns oscillators so the caller can stop them with other sources.
 */
export function scheduleMetronomeClicks(
  ctx: AudioContext,
  destination: AudioNode,
  options: {
    bpm: number
    timelineStart: number
    startAtMs?: number
    durationMs: number
    volume?: number
  },
): OscillatorNode[] {
  const bpm = clampMetronomeBpm(options.bpm)
  const interval = metronomeBeatIntervalSec(bpm)
  const startAtS = Math.max(0, (options.startAtMs ?? 0) / 1000)
  const durationS = Math.max(0, options.durationMs / 1000)
  if (durationS <= 0) return []

  const volume = options.volume ?? 0.7
  const nodes: OscillatorNode[] = []
  const firstBeatIndex = Math.floor(startAtS / interval)
  const endS = startAtS + durationS

  for (let i = firstBeatIndex; ; i++) {
    const beatS = FIRST_CLICK_OFFSET_S + i * interval
    if (beatS < startAtS - 0.001) continue
    if (beatS >= endS) break

    const when = options.timelineStart + (beatS - startAtS)
    if (when < ctx.currentTime - 0.05) continue

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = CLICK_FREQ_HZ
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(volume, when + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + CLICK_DUR_S)
    osc.connect(gain)
    gain.connect(destination)
    osc.start(when)
    osc.stop(when + CLICK_DUR_S + 0.01)
    nodes.push(osc)
  }

  return nodes
}

export function isMetronomeTrack(track: Track): boolean {
  return Boolean(track.isMetronome)
}
