import type { Track, TrackPlayhead } from '../../types'
import { ensureAudioContext, getBufferCache } from './runtime'

export const SKIP_COUNT_IN_PAD_S = 0.1

export async function decodeTrack(track: Track): Promise<AudioBuffer> {
  const bufferCache = getBufferCache()
  const cached = bufferCache.get(track.id)
  if (cached) return cached

  const ctx = await ensureAudioContext()
  const copy = await track.blob.arrayBuffer()
  const buffer = await ctx.decodeAudioData(copy)
  bufferCache.set(track.id, buffer)
  return buffer
}

/** Offline-render selected tracks into a stereo mix buffer. */
export async function renderSelectedMixBuffer(
  selected: Track[],
): Promise<AudioBuffer> {
  const playable = selected.filter((track) => track.blob.size > 0)
  if (playable.length === 0) {
    throw new Error('Aucune piste sélectionnée à exporter.')
  }

  // Ensure a live context exists so decodeAudioData is available.
  await ensureAudioContext()
  const decoded = await Promise.all(
    playable.map(async (track) => ({
      track,
      buffer: await decodeTrack(track),
    })),
  )

  const sampleRate = Math.max(
    44100,
    ...decoded.map(({ buffer }) => buffer.sampleRate),
  )

  let durationS = 0
  for (const { track, buffer } of decoded) {
    const delayS = Math.max(0, track.offsetMs) / 1000
    const skipS = Math.max(0, -track.offsetMs) / 1000
    durationS = Math.max(durationS, delayS + Math.max(0, buffer.duration - skipS))
  }

  const length = Math.max(1, Math.ceil(durationS * sampleRate) + sampleRate)
  const offline = new OfflineAudioContext(2, length, sampleRate)
  const master = offline.createGain()
  // Match live mix headroom.
  master.gain.value = 0.85
  master.connect(offline.destination)

  for (const { track, buffer } of decoded) {
    const source = offline.createBufferSource()
    source.buffer = buffer
    source.connect(master)
    const delayS = Math.max(0, track.offsetMs) / 1000
    const skipS = Math.max(0, -track.offsetMs) / 1000
    const playableLen = Math.max(0, buffer.duration - skipS)
    if (playableLen <= 0) continue
    source.start(delayS, skipS, playableLen)
  }

  return offline.startRendering()
}

export function trimAudioBufferFrom(
  buffer: AudioBuffer,
  startS: number,
): AudioBuffer {
  const startSample = Math.min(
    buffer.length,
    Math.max(0, Math.floor(startS * buffer.sampleRate)),
  )
  const length = Math.max(1, buffer.length - startSample)
  if (startSample === 0) return buffer

  const trimmed = new AudioBuffer({
    length,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  })
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    trimmed.copyToChannel(
      buffer.getChannelData(channel).subarray(startSample),
      channel,
    )
  }
  return trimmed
}

/**
 * Mix-timeline time (seconds) just after the reference "4", with a short pad.
 * Pass `peakFourSec` when known, or `peaks` (count-in times in seconds) to derive it.
 */
export function getSkipCountInStartS(args: {
  reference: Track
  peakFourSec?: number | null
  peaks?: number[]
  padS?: number
}): number {
  const { reference, peaks, padS = SKIP_COUNT_IN_PAD_S } = args
  let fourSec = args.peakFourSec ?? null

  if (fourSec == null) {
    if (!peaks || peaks.length < 4) {
      throw new Error(
        `${reference.name} : ${peaks?.length ?? 0}/4 attaques trouvées. Fais 4 sons bien espacés pour supprimer le 1-2-3-4.`,
      )
    }
    fourSec = peaks[3]!
  }

  // mixTime = peakSec + offsetMs/1000 (same as scheduleTrackSource)
  return fourSec + reference.offsetMs / 1000 + padS
}

export type ScheduleTrackOptions = {
  /** When false, track gain stays at 0 (muted but scheduled). Default true. */
  audible?: boolean
  onTrackGain?: (trackId: number, gain: GainNode) => void
  onPlayhead?: (trackId: number, playhead: TrackPlayhead) => void
}

/**
 * Schedule one track on the live context timeline.
 * Returns null when there is nothing left to play from `startAtMs`.
 */
export function scheduleTrackSource(
  ctx: AudioContext,
  gain: GainNode,
  track: Track,
  buffer: AudioBuffer,
  timelineStart: number,
  applyOffset: boolean,
  startAtMs = 0,
  options?: ScheduleTrackOptions,
): { source: AudioBufferSourceNode; endAt: number; trackGain: GainNode } | null {
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const trackGain = ctx.createGain()
  trackGain.gain.value = options?.audible === false ? 0 : 1
  source.connect(trackGain)
  trackGain.connect(gain)
  options?.onTrackGain?.(track.id, trackGain)

  const offsetMs = applyOffset ? track.offsetMs : 0
  const delayS = Math.max(0, offsetMs) / 1000
  const skipS = Math.max(0, -offsetMs) / 1000
  const playable = Math.max(0, buffer.duration - skipS)
  const startAtS = Math.max(0, startAtMs) / 1000
  const trackEndS = delayS + playable

  if (playable <= 0 || startAtS >= trackEndS) {
    try {
      source.disconnect()
      trackGain.disconnect()
    } catch {
      // ignore
    }
    return null
  }

  const intoTrackS = Math.max(0, startAtS - delayS)
  const remainingS = playable - intoTrackS
  const when = timelineStart + Math.max(0, delayS - startAtS)
  const bufferOffset = skipS + intoTrackS

  source.start(when, bufferOffset, remainingS)

  const playhead: TrackPlayhead = {
    when,
    skipS: bufferOffset,
    lengthS: remainingS,
  }
  options?.onPlayhead?.(track.id, playhead)

  return { source, endAt: when + remainingS, trackGain }
}
