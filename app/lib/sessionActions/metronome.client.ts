import type { Track } from '../../common/types'
import {
  buildMetronomeReferenceBlob,
  clampMetronomeBpm,
  DEFAULT_METRONOME_BPM,
  metronomeReferenceDurationMs,
} from '../audio/metronome.client'
import { clearBufferCache } from '../audio/runtime.client'
import { getMixDurationMs } from '../format'
import { t } from '../i18n'
import {
  alignErrorTrackId,
  autoAlignTracksFromCounts,
  evaluateReferenceBeat,
  noteAlignAttention,
} from './align.client'
import {
  flushPersistMetronomeVolume,
  persistMetronomeBpm,
} from './cloudPersist.client'
import { scheduleGuestDraftSave } from './guest.client'
import {
  alignableTracks,
  syncReferenceTrackRules,
  updateSessionTimerDisplay,
} from './helpers.client'
import { setError } from './modes.client'
import { stopPlayback } from './playback.client'
import { get, patch } from './state.client'
import { clampTrackVolume, getTrackVolume } from './volumes.client'

/**
 * Create or update the virtual metronome track (clicks only; BPM persisted on SongPart).
 * Becomes the alignment reference so takes sync via 3-4 against its synthetic 1-2-3-4.
 */
let pendingMetronomeBpmFocus = false

/** True once after a new metronome track is created (UI focuses the BPM field). */
export function consumeMetronomeBpmFocusRequest(): boolean {
  if (!pendingMetronomeBpmFocus) return false
  pendingMetronomeBpmFocus = false
  return true
}

/** Flush session metronome tempo to the cloud part (e.g. after first upload binds an id). */
export function flushMetronomeBpmToCloud(): void {
  persistMetronomeBpm()
  flushPersistMetronomeVolume()
}

export async function createOrUpdateMetronome(
  bpmRaw: number = DEFAULT_METRONOME_BPM,
): Promise<void> {
  if (get().state === 'recording') return

  const bpm = clampMetronomeBpm(bpmRaw)
  const blob = buildMetronomeReferenceBlob(bpm)
  const otherTracks = get().tracks.filter((track) => !track.isMetronome)
  const durationMs = Math.max(
    60_000,
    getMixDurationMs(otherTracks),
    metronomeReferenceDurationMs(bpm),
  )
  const name = t('track.metronome', { bpm })
  const existing = get().tracks.find((track) => track.isMetronome)

  stopPlayback({ resetSeek: false })

  if (existing) {
    URL.revokeObjectURL(existing.url)
    clearBufferCache(existing.id)
    const url = URL.createObjectURL(blob)
    const tracks = get().tracks.map((track) =>
      track.id === existing.id
        ? {
            ...track,
            name,
            blob,
            url,
            durationMs,
            offsetMs: 0,
            isMetronome: true,
          }
        : track,
    )
    patch({
      tracks,
      metronomeBpm: bpm,
      referenceTrackId: existing.id,
      trackVolumes: {
        ...get().trackVolumes,
        [existing.id]: get().trackVolumes[existing.id] ?? 1,
      },
    })
  } else {
    const trackCounter = get().trackCounter + 1
    const track: Track = {
      id: trackCounter,
      name,
      blob,
      url: URL.createObjectURL(blob),
      durationMs,
      offsetMs: 0,
      isMetronome: true,
    }
    pendingMetronomeBpmFocus = true
    patch({
      trackCounter,
      tracks: [track, ...get().tracks],
      enabledTrackIds: [track.id, ...get().enabledTrackIds],
      referenceTrackId: track.id,
      metronomeBpm: bpm,
      trackVolumes: { ...get().trackVolumes, [track.id]: 1 },
    })
  }

  updateSessionTimerDisplay()
  await evaluateReferenceBeat()
  if (get().autoAlignEnabled && alignableTracks().length > 0) {
    try {
      await autoAlignTracksFromCounts(alignableTracks().map((track) => track.id))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('error.autoAlignDeferredGeneric')
      const trackId = alignErrorTrackId(error, null)
      if (trackId != null) noteAlignAttention(trackId, message)
      // Peak-detection copy is only meaningful in calage mode.
      if (get().calageMode) {
        setError(
          error instanceof Error
            ? t('error.autoAlignDeferred', { message: error.message })
            : t('error.autoAlignDeferredGeneric'),
        )
      }
    }
  }
  persistMetronomeBpm()
  flushPersistMetronomeVolume()
  scheduleGuestDraftSave()
}

/** Rebuild metronome from a persisted BPM (cloud open / hydrate). No cloud write. */
export async function hydrateMetronomeFromBpm(
  bpm: number | null,
  volume?: number,
): Promise<void> {
  const existing = get().tracks.find((track) => track.isMetronome)
  if (bpm == null) {
    if (!existing) {
      patch({ metronomeBpm: null })
      return
    }
    URL.revokeObjectURL(existing.url)
    clearBufferCache(existing.id)
    const tracks = get().tracks.filter((track) => track.id !== existing.id)
    const trackVolumes = { ...get().trackVolumes }
    delete trackVolumes[existing.id]
    patch({
      tracks,
      metronomeBpm: null,
      enabledTrackIds: get().enabledTrackIds.filter((id) => id !== existing.id),
      trackVolumes,
      trackAlignDetails: (() => {
        const next = { ...get().trackAlignDetails }
        delete next[existing.id]
        return next
      })(),
    })
    syncReferenceTrackRules()
    return
  }

  const safe = clampMetronomeBpm(bpm)
  const safeVolume =
    volume != null
      ? clampTrackVolume(volume)
      : existing
        ? getTrackVolume(existing.id)
        : 1
  const blob = buildMetronomeReferenceBlob(safe)
  const otherTracks = get().tracks.filter((track) => !track.isMetronome)
  const durationMs = Math.max(
    60_000,
    getMixDurationMs(otherTracks),
    metronomeReferenceDurationMs(safe),
  )
  const name = t('track.metronome', { bpm: safe })

  if (existing) {
    URL.revokeObjectURL(existing.url)
    clearBufferCache(existing.id)
    const url = URL.createObjectURL(blob)
    patch({
      tracks: get().tracks.map((track) =>
        track.id === existing.id
          ? {
              ...track,
              name,
              blob,
              url,
              durationMs,
              offsetMs: 0,
              isMetronome: true,
            }
          : track,
      ),
      metronomeBpm: safe,
      referenceTrackId: existing.id,
      trackVolumes: {
        ...get().trackVolumes,
        [existing.id]: safeVolume,
      },
    })
  } else {
    const trackCounter = get().trackCounter + 1
    const track: Track = {
      id: trackCounter,
      name,
      blob,
      url: URL.createObjectURL(blob),
      durationMs,
      offsetMs: 0,
      isMetronome: true,
    }
    patch({
      trackCounter,
      tracks: [track, ...get().tracks],
      enabledTrackIds: [track.id, ...get().enabledTrackIds],
      referenceTrackId: track.id,
      metronomeBpm: safe,
      trackVolumes: { ...get().trackVolumes, [track.id]: safeVolume },
    })
  }
}
