import type { Track } from '../../common/types'
import { decodeTrack, renderSelectedMixBuffer, type MixVolumeMap } from './mix.client'

/** Peak ≥ this → treat the take as clipped at capture. */
export const RECORD_CLIP_THRESHOLD = 0.95
/** Output peak ≥ this → mix bus warning (after master). */
export const MIX_CLIP_THRESHOLD = 1
/** Auto-correct sets master so output peak ≈ this (raises or lowers). */
export const MIX_AUTO_CORRECT_TARGET = 0.85

type TrackPeakEntry = {
  peak: number
  /** Blob size fingerprint so cache invalidates on replace. */
  size: number
}

const trackPeakCache = new Map<number, TrackPeakEntry>()

export function clearTrackPeakCache(trackId?: number): void {
  if (trackId == null) {
    trackPeakCache.clear()
    return
  }
  trackPeakCache.delete(trackId)
}

export function maxAbsPeak(buffer: AudioBuffer): number {
  let peak = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]!)
      if (abs > peak) peak = abs
    }
  }
  return peak
}

/** Decode + cache max abs peak for a track blob. */
export async function getTrackAbsPeak(track: Track): Promise<number> {
  if (track.blob.size === 0) return 0
  const cached = trackPeakCache.get(track.id)
  if (cached && cached.size === track.blob.size) return cached.peak
  const buffer = await decodeTrack(track)
  const peak = maxAbsPeak(buffer)
  trackPeakCache.set(track.id, { peak, size: track.blob.size })
  return peak
}

export function isRecordClipped(peak: number): boolean {
  return peak >= RECORD_CLIP_THRESHOLD
}

/**
 * Offline peak of the mix with masterVolume = 1 (sum of track gains only).
 * Returns 0 when there is nothing playable.
 */
export async function measureMixPeakAtUnityMaster(
  tracks: Track[],
  trackVolumes: MixVolumeMap,
  enabledTrackIds: number[],
): Promise<number> {
  const enabled = new Set(enabledTrackIds)
  const selected = tracks.filter(
    (track) =>
      !track.isMetronome &&
      track.blob.size > 0 &&
      enabled.has(track.id) &&
      (trackVolumes[track.id] ?? 1) > 0,
  )
  if (selected.length === 0) return 0

  const volumes: MixVolumeMap = {}
  for (const track of selected) {
    volumes[track.id] = trackVolumes[track.id] ?? 1
  }

  const rendered = await renderSelectedMixBuffer(selected, {
    trackVolumes: volumes,
    masterVolume: 1,
  })
  return maxAbsPeak(rendered)
}

export function mixOutputWouldClip(
  mixPeakAtUnityMaster: number | null,
  masterVolume: number,
): boolean {
  if (mixPeakAtUnityMaster == null || mixPeakAtUnityMaster <= 0) return false
  return mixPeakAtUnityMaster * masterVolume >= MIX_CLIP_THRESHOLD
}

/**
 * Master volume so that mixPeakAtUnityMaster × master ≈ target
 * (raises or lowers; caller clamps to MASTER_VOLUME_MAX).
 */
export function autoCorrectMasterVolume(
  mixPeakAtUnityMaster: number,
  currentMaster: number,
  target = MIX_AUTO_CORRECT_TARGET,
): number {
  if (!(mixPeakAtUnityMaster > 0) || !Number.isFinite(mixPeakAtUnityMaster)) {
    return currentMaster
  }
  return target / mixPeakAtUnityMaster
}
