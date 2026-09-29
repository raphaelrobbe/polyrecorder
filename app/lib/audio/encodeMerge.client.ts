/**
 * Encode a rendered merge buffer for a new take.
 * Prefer WebM/Opus (MediaRecorder); fall back to MP3. Never WAV.
 * Loaded only on Fusionner click via dynamic import.
 */

async function encodeAudioBufferToWebmOpus(
  buffer: AudioBuffer,
): Promise<Blob> {
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : ''
  if (!mime) {
    throw new Error('webm unsupported')
  }

  const ctx = new AudioContext({ sampleRate: buffer.sampleRate })
  try {
    const dest = ctx.createMediaStreamDestination()
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(dest)

    const chunks: BlobPart[] = []
    const recorder = new MediaRecorder(dest.stream, { mimeType: mime })
    const done = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onerror = () => reject(new Error('MediaRecorder error'))
      recorder.onstop = () => resolve(new Blob(chunks, { type: mime }))
    })

    recorder.start(100)
    await ctx.resume()
    source.start(0)
    await new Promise<void>((resolve) => {
      source.onended = () => resolve()
    })
    // Let the last Opus packets flush.
    await new Promise((resolve) => setTimeout(resolve, 80))
    if (recorder.state !== 'inactive') recorder.stop()
    const blob = await done
    if (blob.size === 0) throw new Error('empty webm')
    return blob
  } finally {
    await ctx.close().catch(() => {})
  }
}

/** Encode merge result: WebM/Opus preferred, else MP3. */
export async function encodeAudioBufferForMerge(
  buffer: AudioBuffer,
): Promise<{ blob: Blob; durationMs: number }> {
  const durationMs = Math.max(1, Math.round(buffer.duration * 1000))
  try {
    const blob = await encodeAudioBufferToWebmOpus(buffer)
    return { blob, durationMs }
  } catch {
    const { encodeAudioBufferToMp3 } = await import('../../mp3-encode.client')
    const blob = await encodeAudioBufferToMp3(buffer, 192)
    return { blob, durationMs }
  }
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
  const decoded = await Promise.all(
    uniqueTracks.map(async (track) => [track.id, await decodeTrack(track)] as const),
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

  return offline.startRendering()
}
