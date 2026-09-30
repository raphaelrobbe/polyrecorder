/**
 * Encode a rendered merge buffer for a new take.
 * Prefer offline WASM Opus→WebM; fall back to MP3. Never WAV.
 * Encoder modules load only on Fusionner click via dynamic import.
 */

export type MergeProgressPhase = 'decode' | 'render' | 'encode' | 'save'

export type MergeProgressUpdate = {
  phase: MergeProgressPhase
  /** 0–1 within the current phase. */
  ratio: number
}

/** Map phase-local progress onto an overall 0–1 bar. */
export function mergeProgressOverall(update: MergeProgressUpdate): number {
  const ranges: Record<MergeProgressPhase, [number, number]> = {
    decode: [0, 0.18],
    render: [0.18, 0.38],
    encode: [0.38, 0.9],
    save: [0.9, 1],
  }
  const [from, to] = ranges[update.phase]
  const local = Math.max(0, Math.min(1, update.ratio))
  return from + (to - from) * local
}

type ProgressFn = (update: MergeProgressUpdate) => void

/** Encode merge result: offline WebM/Opus preferred, else MP3. */
export async function encodeAudioBufferForMerge(
  buffer: AudioBuffer,
  onProgress?: ProgressFn,
): Promise<{ blob: Blob; durationMs: number }> {
  const durationMs = Math.max(1, Math.round(buffer.duration * 1000))
  try {
    const { encodeAudioBufferToWebmOpusOffline } = await import(
      './opusWebmEncode.client'
    )
    const blob = await encodeAudioBufferToWebmOpusOffline(buffer, (ratio) => {
      onProgress?.({ phase: 'encode', ratio })
    })
    return { blob, durationMs }
  } catch {
    const { encodeAudioBufferToMp3 } = await import('../../mp3-encode.client')
    const blob = await encodeAudioBufferToMp3(buffer, 192, (ratio) => {
      onProgress?.({ phase: 'encode', ratio })
    })
    return { blob, durationMs }
  }
}

async function startRenderingWithProgress(
  offline: OfflineAudioContext,
  durationS: number,
  onProgress?: ProgressFn,
): Promise<AudioBuffer> {
  if (onProgress && durationS > 0.08) {
    const steps = Math.min(24, Math.max(4, Math.ceil(durationS / 0.4)))
    for (let i = 1; i < steps; i++) {
      const at = (i / steps) * durationS
      void offline
        .suspend(at)
        .then(() => {
          onProgress({ phase: 'render', ratio: i / steps })
          return offline.resume()
        })
        .catch(() => {})
    }
  }
  onProgress?.({ phase: 'render', ratio: 0 })
  const rendered = await offline.startRendering()
  onProgress?.({ phase: 'render', ratio: 1 })
  return rendered
}

/**
 * Offline-assemble selected cut segments on the mix timeline.
 * Gaps between segments are silence. Muted buffer ranges stay silent
 * (same semantics as playback). Output starts at relative t0 = first startMs.
 */
export async function renderMergedCutBuffer(
  pieces: Array<{
    track: import('../../common/types').Track
    startMs: number
    endMs: number
  }>,
  onProgress?: ProgressFn,
): Promise<AudioBuffer> {
  const { decodeTrack } = await import('./mix.client')
  const { bufferRangeFromMix, unmutedBufferIntervals } = await import(
    './segments.client'
  )

  if (pieces.length === 0) {
    throw new Error('no segments')
  }

  const sorted = [...pieces].sort((a, b) => a.startMs - b.startMs)
  const t0 = sorted[0]!.startMs
  const t1 = Math.max(...sorted.map((p) => p.endMs))
  const durationS = Math.max(0.001, (t1 - t0) / 1000)

  const uniqueTracks = [
    ...new Map(sorted.map((p) => [p.track.id, p.track])).values(),
  ]
  let decodedCount = 0
  const decoded = await Promise.all(
    uniqueTracks.map(async (track) => {
      const buffer = await decodeTrack(track)
      decodedCount += 1
      onProgress?.({
        phase: 'decode',
        ratio: decodedCount / uniqueTracks.length,
      })
      return [track.id, buffer] as const
    }),
  )
  const buffers = new Map(decoded)

  const sampleRate = Math.max(
    44100,
    ...[...buffers.values()].map((b) => b.sampleRate),
  )
  const length = Math.max(1, Math.ceil(durationS * sampleRate))
  const offline = new OfflineAudioContext(2, length, sampleRate)
  const master = offline.createGain()
  master.gain.value = 1
  master.connect(offline.destination)

  for (const piece of sorted) {
    const buffer = buffers.get(piece.track.id)
    if (!buffer) continue
    const range = bufferRangeFromMix(piece.track, piece.startMs, piece.endMs)
    const intervals = unmutedBufferIntervals(
      piece.track.muteRanges,
      range.startMs / 1000,
      range.endMs / 1000,
    )
    for (const interval of intervals) {
      const bufDurS = interval.endS - interval.startS
      if (bufDurS <= 0) continue
      const mixStartMs = interval.startS * 1000 + piece.track.offsetMs
      const when = (mixStartMs - t0) / 1000
      if (when >= durationS) continue
      const source = offline.createBufferSource()
      source.buffer = buffer
      source.connect(master)
      source.start(Math.max(0, when), interval.startS, bufDurS)
    }
  }

  return startRenderingWithProgress(offline, durationS, onProgress)
}
