import {
  getTrackAbsPeak,
  idealMasterForTarget,
  isRecordClipped,
  measureMixPeakAtUnityMaster,
  mixOutputWouldClip,
} from '../audio/clipDetect.client'
import { MASTER_VOLUME_MAX, TRACK_VOLUME_MAX } from '../audio/mix.client'
import { getPlaybackGain } from '../audio/runtime.client'
import {
  writeAutoMasterBoost,
  writeAutoMasterPreventClip,
} from '../mixClipPrefs'
import {
  flushPersistMasterVolume,
  flushPersistTrackVolume,
  persistCloudMixVolumes,
  schedulePersistMasterVolume,
  schedulePersistTrackVolume,
} from './cloudPersist.client'
import { scheduleGuestDraftSave } from './guest.client'
import { get, patch, trackGains } from './state.client'

const HIGHLIGHT_DIM_VOLUME = 0.3

function syncLiveTrackGains() {
  for (const [id, gain] of trackGains) {
    gain.gain.value = liveTrackGainValue(id)
  }
}

export function applyHighlightVolumes(highlighted: number[]) {
  // Empty highlight list leaves volumes alone: mise-en-avant writes real
  // mix levels that must stay when leaving Mix mode or clearing the star.
  if (highlighted.length === 0) return
  const volumes: Record<number, number> = { ...get().trackVolumes }
  for (const track of get().tracks) {
    volumes[track.id] = highlighted.includes(track.id)
      ? 1
      : HIGHLIGHT_DIM_VOLUME
  }
  patch({ trackVolumes: volumes })
  syncLiveTrackGains()
  persistCloudMixVolumes()
  scheduleGuestDraftSave()
  scheduleMixPeakRefresh()
}

export function clearTrackHighlights() {
  if (get().highlightedTrackIds.length === 0) return
  patch({ highlightedTrackIds: [] })
}

export function toggleTrackHighlight(trackId: number) {
  if (!get().mixMode) return
  const current = get().highlightedTrackIds
  const next = current.includes(trackId)
    ? current.filter((id) => id !== trackId)
    : [...current, trackId]
  patch({ highlightedTrackIds: next })
  applyHighlightVolumes(next)
}

export function clampTrackVolume(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(TRACK_VOLUME_MAX, Math.max(0, value))
}

export function clampMasterVolume(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(MASTER_VOLUME_MAX, Math.max(0, value))
}

export function getTrackVolume(trackId: number): number {
  return clampTrackVolume(get().trackVolumes[trackId] ?? 1)
}

/** Live track GainNode value (mute → 0, else track volume). */
export function liveTrackGainValue(trackId: number): number {
  const enabled = get().enabledTrackIds.includes(trackId)
  return enabled ? getTrackVolume(trackId) : 0
}

export function setTrackVolume(trackId: number, volume: number) {
  const next = clampTrackVolume(volume)
  patch({
    trackVolumes: { ...get().trackVolumes, [trackId]: next },
  })
  const gain = trackGains.get(trackId)
  if (gain) {
    gain.gain.value = liveTrackGainValue(trackId)
  }
  schedulePersistTrackVolume(trackId)
  scheduleGuestDraftSave()
  scheduleMixPeakRefresh()
}

export function setMasterVolume(volume: number) {
  const next = clampMasterVolume(volume)
  const peak = get().mixPeakAtUnityMaster
  patch({
    masterVolume: next,
    mixClipWarning: mixOutputWouldClip(peak, next),
  })
  const master = getPlaybackGain()
  if (master) {
    master.gain.value = next
  }
  schedulePersistMasterVolume()
}

export function setAutoMasterPreventClipPref(on: boolean) {
  writeAutoMasterPreventClip(on)
  patch({
    autoMasterPreventClip: on,
    ...(!on && get().masterAutoCorrectHint === 'prevent'
      ? { masterAutoCorrectHint: null }
      : {}),
  })
  if (on) scheduleMixPeakRefresh()
  else {
    const peak = get().mixPeakAtUnityMaster
    patch({
      mixClipWarning: mixOutputWouldClip(peak, get().masterVolume),
    })
  }
}

export function setAutoMasterBoostPref(on: boolean) {
  writeAutoMasterBoost(on)
  patch({
    autoMasterBoost: on,
    ...(!on && get().masterAutoCorrectHint === 'boost'
      ? { masterAutoCorrectHint: null }
      : {}),
  })
  if (on) scheduleMixPeakRefresh()
}

const MIX_PEAK_REFRESH_MS = 280
let mixPeakRefreshTimer: ReturnType<typeof setTimeout> | null = null
let mixPeakRefreshGen = 0

/** Debounced offline peak at master=1; optional silent master auto-correct. */
export function scheduleMixPeakRefresh() {
  if (mixPeakRefreshTimer) clearTimeout(mixPeakRefreshTimer)
  mixPeakRefreshTimer = setTimeout(() => {
    mixPeakRefreshTimer = null
    void refreshMixPeakAtUnityMaster()
  }, MIX_PEAK_REFRESH_MS)
}

async function refreshMixPeakAtUnityMaster(): Promise<void> {
  const gen = ++mixPeakRefreshGen
  const {
    tracks,
    trackVolumes,
    enabledTrackIds,
    autoMasterPreventClip,
    autoMasterBoost,
    masterVolume,
    mixMode,
  } = get()
  const playable = tracks.filter((track) => track.blob.size > 0)
  if (playable.length === 0) {
    if (gen !== mixPeakRefreshGen) return
    patch({
      mixPeakAtUnityMaster: null,
      mixClipWarning: false,
    })
    return
  }

  try {
    const peak = await measureMixPeakAtUnityMaster(
      tracks,
      trackVolumes,
      enabledTrackIds,
    )
    if (gen !== mixPeakRefreshGen) return

    let nextMaster = masterVolume
    let hint: 'prevent' | 'boost' | null = null
    const idealRaw = idealMasterForTarget(peak)
    if (idealRaw != null && peak > 0) {
      const ideal = clampMasterVolume(idealRaw)
      const eps = 0.0005
      if (ideal < masterVolume - eps && autoMasterPreventClip) {
        nextMaster = ideal
        hint = 'prevent'
      } else if (ideal > masterVolume + eps && autoMasterBoost) {
        nextMaster = ideal
        hint = 'boost'
      }
    }

    patch({
      mixPeakAtUnityMaster: peak,
      masterVolume: nextMaster,
      mixClipWarning: mixOutputWouldClip(peak, nextMaster),
      ...(hint != null && nextMaster !== masterVolume && mixMode
        ? { masterAutoCorrectHint: hint }
        : {}),
    })
    if (nextMaster !== masterVolume) {
      const master = getPlaybackGain()
      if (master) master.gain.value = nextMaster
      schedulePersistMasterVolume()
    }
  } catch {
    if (gen !== mixPeakRefreshGen) return
    // Keep previous cache; don't clear on transient decode errors.
  }
}

/** Decode peaks for record-clip badges; refresh mix bus peak. */
export async function refreshTrackClipFlags(
  trackIds?: number[],
): Promise<void> {
  const tracks = get().tracks.filter((track) => {
    if (track.isMetronome || track.blob.size === 0) return false
    if (trackIds && !trackIds.includes(track.id)) return false
    return true
  })
  const next: Record<number, boolean> = { ...get().trackClipById }
  await Promise.all(
    tracks.map(async (track) => {
      try {
        const peak = await getTrackAbsPeak(track)
        next[track.id] = isRecordClipped(peak)
      } catch {
        // leave previous flag
      }
    }),
  )
  patch({ trackClipById: next })
  scheduleMixPeakRefresh()
}

/** Flush pending volume POSTs (call on slider pointer-up / blur). */
export function flushVolumeCloudPersist(trackId?: number) {
  if (trackId == null) {
    flushPersistMasterVolume()
    return
  }
  flushPersistTrackVolume(trackId)
}
