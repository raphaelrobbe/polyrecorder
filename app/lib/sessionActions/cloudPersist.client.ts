import { get } from './state.client'
import {
  clampMasterVolume,
  getTrackVolume,
} from './volumes.client'

const VOLUME_PERSIST_MS = 400
const trackVolumePersistTimers = new Map<number, ReturnType<typeof setTimeout>>()
let masterVolumePersistTimer: ReturnType<typeof setTimeout> | null = null

export function canPersistCloudMix(): boolean {
  return !get().readOnlySession || get().canCloudContribute
}

/** Foreign cloud take — local edits OK; never persist to the server. */
export function isForeignCloudTrack(track: { cloudTrackId?: string; cloudOwnedByMe?: boolean }) {
  return (
    Boolean(track.cloudTrackId) &&
    get().readOnlySession &&
    !track.cloudOwnedByMe
  )
}

export function postLibraryIntent(body: Record<string, unknown>, label: string) {
  void fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      const data = (await res.json()) as { ok: boolean }
      if (!data.ok) console.error(`[cloud] failed to ${label}`)
    })
    .catch((error) => {
      console.error(`[cloud] failed to ${label}`, error)
    })
}

export function persistCloudTrackMuteRanges(trackId: number) {
  if (!canPersistCloudMix()) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track?.cloudTrackId || isForeignCloudTrack(track)) return
  postLibraryIntent(
    {
      intent: 'setTrackMuteRanges',
      id: track.cloudTrackId,
      muteRanges: track.muteRanges ?? [],
    },
    'set track mute ranges',
  )
}

export function persistCloudTrackOffset(trackId: number) {
  if (!canPersistCloudMix()) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track?.cloudTrackId || isForeignCloudTrack(track)) return
  postLibraryIntent(
    {
      intent: 'updateTrackOffset',
      id: track.cloudTrackId,
      offsetMs: Math.round(track.offsetMs),
    },
    'update track offset',
  )
}

export function persistCloudTrackOffsets(trackIds: number[]) {
  if (!canPersistCloudMix()) return
  const updates = trackIds
    .map((id) => {
      const track = get().tracks.find((t) => t.id === id)
      if (!track?.cloudTrackId || isForeignCloudTrack(track)) return null
      return {
        id: track.cloudTrackId,
        offsetMs: Math.round(track.offsetMs),
      }
    })
    .filter((u): u is { id: string; offsetMs: number } => u != null)
  if (updates.length === 0) return
  postLibraryIntent(
    { intent: 'syncTrackOffsets', updates },
    'sync track offsets',
  )
}

export function persistCloudTrackOrder() {
  // Mix order is song-owner metadata (like master volume).
  if (get().readOnlySession || !canPersistCloudMix()) return
  const songPartId = get().activeSongPartId ?? get().deckSongPartId
  if (!songPartId) return
  const orderedIds = get()
    .tracks.map((track) => track.cloudTrackId)
    .filter((id): id is string => Boolean(id))
  if (orderedIds.length === 0) return
  postLibraryIntent(
    {
      intent: 'syncTrackOrder',
      songPartId,
      orderedIds,
    },
    'sync track order',
  )
}

export function persistCloudTrackMuted(trackId: number) {
  if (!canPersistCloudMix()) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track?.cloudTrackId || isForeignCloudTrack(track)) return
  postLibraryIntent(
    {
      intent: 'updateTrackMuted',
      id: track.cloudTrackId,
      muted: !get().enabledTrackIds.includes(trackId),
    },
    'update track mute',
  )
}

export function persistCloudTrackMutes(trackIds: number[]) {
  if (!canPersistCloudMix()) return
  const enabled = new Set(get().enabledTrackIds)
  const updates = trackIds
    .map((id) => {
      const track = get().tracks.find((t) => t.id === id)
      if (!track?.cloudTrackId || isForeignCloudTrack(track)) return null
      return {
        id: track.cloudTrackId,
        muted: !enabled.has(id),
      }
    })
    .filter((u): u is { id: string; muted: boolean } => u != null)
  if (updates.length === 0) return
  postLibraryIntent(
    { intent: 'syncTrackMutes', updates },
    'sync track mutes',
  )
}

export function flushPersistTrackVolume(trackId: number) {
  const existing = trackVolumePersistTimers.get(trackId)
  if (existing) {
    clearTimeout(existing)
    trackVolumePersistTimers.delete(trackId)
  }
  if (!canPersistCloudMix()) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track) return
  if (track.isMetronome) {
    flushPersistMetronomeVolume()
    return
  }
  if (!track.cloudTrackId || isForeignCloudTrack(track)) return
  postLibraryIntent(
    {
      intent: 'updateTrackVolume',
      id: track.cloudTrackId,
      volume: getTrackVolume(trackId),
    },
    'update track volume',
  )
}

export function schedulePersistTrackVolume(trackId: number) {
  if (!canPersistCloudMix()) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track) return
  if (track.isMetronome) {
    if (get().readOnlySession) return
    if (!(get().activeSongPartId || get().deckSongPartId)) return
    const existing = trackVolumePersistTimers.get(trackId)
    if (existing) clearTimeout(existing)
    trackVolumePersistTimers.set(
      trackId,
      setTimeout(() => {
        trackVolumePersistTimers.delete(trackId)
        flushPersistMetronomeVolume()
      }, VOLUME_PERSIST_MS),
    )
    return
  }
  if (!track.cloudTrackId || isForeignCloudTrack(track)) return
  const existing = trackVolumePersistTimers.get(trackId)
  if (existing) clearTimeout(existing)
  trackVolumePersistTimers.set(
    trackId,
    setTimeout(() => {
      trackVolumePersistTimers.delete(trackId)
      flushPersistTrackVolume(trackId)
    }, VOLUME_PERSIST_MS),
  )
}

export function flushPersistMasterVolume() {
  if (masterVolumePersistTimer) {
    clearTimeout(masterVolumePersistTimer)
    masterVolumePersistTimer = null
  }
  // Master bus is owner-only (collaborators keep a local mix).
  if (get().readOnlySession || !canPersistCloudMix()) return
  const songPartId = get().activeSongPartId
  if (!songPartId) return
  postLibraryIntent(
    {
      intent: 'updateSongMasterVolume',
      songPartId,
      masterVolume: clampMasterVolume(get().masterVolume),
    },
    'update master volume',
  )
}

export function schedulePersistMasterVolume() {
  if (get().readOnlySession || !canPersistCloudMix()) return
  if (!get().activeSongPartId) return
  if (masterVolumePersistTimer) clearTimeout(masterVolumePersistTimer)
  masterVolumePersistTimer = setTimeout(() => {
    masterVolumePersistTimer = null
    flushPersistMasterVolume()
  }, VOLUME_PERSIST_MS)
}

let alignPrefsPersistTimer: ReturnType<typeof setTimeout> | null = null

function flushPersistAlignPrefs() {
  if (alignPrefsPersistTimer) {
    clearTimeout(alignPrefsPersistTimer)
    alignPrefsPersistTimer = null
  }
  if (get().readOnlySession || !canPersistCloudMix()) return
  const songPartId = get().activeSongPartId
  if (!songPartId) return
  const {
    autoAlignEnabled,
    showCalageWarnings,
    skipCountInPlayback,
    skipCountInDownload,
  } = get()
  postLibraryIntent(
    {
      intent: 'updateSongAlignPrefs',
      songPartId,
      alignPrefs: {
        autoAlignEnabled,
        showCalageWarnings,
        skipCountInPlayback,
        skipCountInDownload,
      },
    },
    'update align prefs',
  )
}

export function schedulePersistAlignPrefs() {
  if (get().readOnlySession || !canPersistCloudMix()) return
  if (!get().activeSongPartId) return
  if (alignPrefsPersistTimer) clearTimeout(alignPrefsPersistTimer)
  alignPrefsPersistTimer = setTimeout(() => {
    alignPrefsPersistTimer = null
    flushPersistAlignPrefs()
  }, VOLUME_PERSIST_MS)
}

export function persistMetronomeBpm() {
  if (get().readOnlySession || !canPersistCloudMix()) return
  const songPartId = get().activeSongPartId ?? get().deckSongPartId
  if (!songPartId) return
  postLibraryIntent(
    {
      intent: 'updateMetronomeBpm',
      songPartId,
      metronomeBpm: get().metronomeBpm,
    },
    'update metronome bpm',
  )
}

function currentMetronomeVolume(): number {
  const metro = get().tracks.find((track) => track.isMetronome)
  if (!metro) return 1
  return getTrackVolume(metro.id)
}

export function flushPersistMetronomeVolume() {
  if (get().readOnlySession || !canPersistCloudMix()) return
  const songPartId = get().activeSongPartId ?? get().deckSongPartId
  if (!songPartId) return
  if (!get().tracks.some((track) => track.isMetronome)) return
  postLibraryIntent(
    {
      intent: 'updateMetronomeVolume',
      songPartId,
      metronomeVolume: currentMetronomeVolume(),
    },
    'update metronome volume',
  )
}

/** Persist all cloud track volumes + master (e.g. after highlight / dim). */
export function persistCloudMixVolumes() {
  if (!canPersistCloudMix()) return

  for (const [trackId, timer] of trackVolumePersistTimers) {
    clearTimeout(timer)
    trackVolumePersistTimers.delete(trackId)
  }
  if (masterVolumePersistTimer) {
    clearTimeout(masterVolumePersistTimer)
    masterVolumePersistTimer = null
  }

  const updates = get()
    .tracks.map((track) => {
      if (!track.cloudTrackId || isForeignCloudTrack(track)) return null
      return {
        id: track.cloudTrackId,
        volume: getTrackVolume(track.id),
      }
    })
    .filter((u): u is { id: string; volume: number } => u != null)

  if (updates.length > 0) {
    postLibraryIntent(
      { intent: 'syncTrackVolumes', updates },
      'sync track volumes',
    )
  }
  flushPersistMetronomeVolume()
  flushPersistMasterVolume()
}
