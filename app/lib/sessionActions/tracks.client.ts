import { clearTrackPeakCache } from '../audio/clipDetect.client'
import { clearBufferCache } from '../audio/runtime.client'
import { defaultTrackName } from '../format'
import {
  isForeignCloudTrack,
  persistCloudTrackMuted,
  persistCloudTrackMutes,
  persistCloudTrackOrder,
  persistMetronomeBpm,
} from './cloudPersist.client'
import {
  cancelContentSyncPick,
  clearSimpleContentSyncOffer,
} from './contentSync.client'
import { evaluateReferenceBeat, cancelReferencePick } from './align.client'
import { flushGuestDraftSave, scheduleGuestDraftSave } from './guest.client'
import {
  clearRefPeaks,
  syncReferenceTrackRules,
  updateSessionTimerDisplay,
} from './helpers.client'
import { refreshSkewWarning } from './modes.client'
import { setTrackAudible, stopPlayback } from './playback.client'
import { get, patch, trackGains, trackPlayheads } from './state.client'
import {
  applyHighlightVolumes,
  scheduleMixPeakRefresh,
} from './volumes.client'

export function reorderTrack(fromId: number, beforeId: number | null) {
  const tracks = get().tracks.slice()
  const from = tracks.findIndex((track) => track.id === fromId)
  if (from < 0) return

  let to =
    beforeId == null
      ? tracks.length
      : tracks.findIndex((track) => track.id === beforeId)
  if (to < 0) return
  if (from === to || from + 1 === to) return

  const [moved] = tracks.splice(from, 1)
  if (!moved) return
  if (to > from) to -= 1
  tracks.splice(to, 0, moved)

  patch({ tracks })
  syncReferenceTrackRules()
  if (get().playingTrackIds.length > 0 || get().mixListenActive) {
    stopPlayback({ resetSeek: false })
  }
  persistCloudTrackOrder()
  scheduleGuestDraftSave()
}

export function setTrackEnabled(trackId: number, enabled: boolean) {
  const enabledSet = new Set(get().enabledTrackIds)
  if (enabled) enabledSet.add(trackId)
  else enabledSet.delete(trackId)
  patch({ enabledTrackIds: [...enabledSet] })
  setTrackAudible(trackId, enabled)
  // Song owner or track uploader: persist; others keep a local mute only.
  persistCloudTrackMuted(trackId)
  scheduleGuestDraftSave()
  scheduleMixPeakRefresh()
}

export function setAllTracksEnabled(enabled: boolean) {
  const { tracks } = get()
  const enabledTrackIds = enabled ? tracks.map((track) => track.id) : []
  patch({ enabledTrackIds })
  for (const track of tracks) {
    setTrackAudible(track.id, enabled)
  }
  persistCloudTrackMutes(tracks.map((track) => track.id))
  scheduleGuestDraftSave()
  scheduleMixPeakRefresh()
}

export function renameTrack(trackId: number, name: string) {
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track) return
  const trimmed = name.trim().slice(0, 40) || defaultTrackName(1)
  patch({
    tracks: get().tracks.map((t) =>
      t.id === trackId ? { ...t, name: trimmed } : t,
    ),
  })
  scheduleGuestDraftSave()

  // Shared / collab: only persist renames for the current user's takes.
  const cloudTrackId = track.cloudTrackId
  if (!cloudTrackId || isForeignCloudTrack(track)) return
  if (get().readOnlySession && !track.cloudOwnedByMe) return

  void fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'renameTrack',
      id: cloudTrackId,
      name: trimmed,
    }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { ok: boolean }
      if (!data.ok) {
        console.error('[cloud] failed to rename track')
      }
    })
    .catch((error) => {
      console.error('[cloud] failed to rename track', error)
    })
}

export function deleteTrack(trackId: number) {
  if (get().cutMerging && get().cutMergeTrackId === trackId) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track) return
  if (get().playingTrackIds.length > 0 || get().mixListenActive) {
    stopPlayback({ resetSeek: false })
  }
  if (get().contentSyncPickFromId === trackId) {
    cancelContentSyncPick()
  }
  const invite = get().contentSyncInvite
  if (
    invite &&
    (invite.fromTrackId === trackId ||
      invite.againstTrackId === trackId ||
      invite.mergedTrackId === trackId)
  ) {
    patch({ contentSyncInvite: null })
  }
  if (get().referencePickActive) {
    cancelReferencePick()
  }
  URL.revokeObjectURL(track.url)
  clearBufferCache(trackId)
  trackGains.delete(trackId)
  trackPlayheads.delete(trackId)
  const tracks = get().tracks.filter((t) => t.id !== trackId)
  const trackAlignDetails = { ...get().trackAlignDetails }
  delete trackAlignDetails[trackId]
  const trackVolumes = { ...get().trackVolumes }
  delete trackVolumes[trackId]
  const alignAttentionByTrackId = { ...get().alignAttentionByTrackId }
  delete alignAttentionByTrackId[trackId]
  const trackClipById = { ...get().trackClipById }
  delete trackClipById[trackId]
  clearTrackPeakCache(trackId)
  const prevHighlights = get().highlightedTrackIds
  const nextHighlights = prevHighlights.filter((id) => id !== trackId)
  const clearedMetro = Boolean(track.isMetronome)
  patch({
    tracks,
    enabledTrackIds: get().enabledTrackIds.filter((id) => id !== trackId),
    highlightedTrackIds: nextHighlights,
    trackAlignDetails,
    trackVolumes,
    alignAttentionByTrackId,
    trackClipById,
    ...(clearedMetro ? { metronomeBpm: null } : {}),
    ...(tracks.length === 0
      ? {
          calageMode: false,
          mixMode: false,
          cutMode: false,
          cutPhase: 'idle' as const,
          cutSelectedTrackIds: [],
          cutWorkSegments: {},
          calageTipOpen: false,
        }
      : {}),
  })
  if (prevHighlights.length > 0) {
    applyHighlightVolumes(nextHighlights)
  } else {
    scheduleMixPeakRefresh()
  }
  syncReferenceTrackRules()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  if (get().referenceTrackId != null) void evaluateReferenceBeat()
  if (clearedMetro) persistMetronomeBpm()
  if (tracks.length === 0) {
    flushGuestDraftSave()
  } else {
    scheduleGuestDraftSave()
  }

  // Shared / collab: never delete someone else's take in the database.
  const cloudTrackId = track.cloudTrackId
  if (!cloudTrackId) return
  if (get().readOnlySession && !track.cloudOwnedByMe) return
  void fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'deleteTrack',
      id: cloudTrackId,
    }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { ok: boolean }
      if (!data.ok) {
        console.error('[cloud] failed to delete track')
      }
    })
    .catch((error) => {
      console.error('[cloud] failed to delete track', error)
    })
}

export function deleteAllTracks() {
  if (get().state === 'recording') return
  // Shared / collab: wipe the local deck; cloud deletes only own takes.
  if (get().readOnlySession) {
    const ids = get().tracks.map((track) => track.id)
    for (const id of ids) {
      deleteTrack(id)
    }
    return
  }
  stopPlayback({ resetSeek: true })
  const cloudTrackIds = get()
    .tracks.map((track) => track.cloudTrackId)
    .filter((id): id is string => Boolean(id))
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()
  clearTrackPeakCache()
  clearSimpleContentSyncOffer()
  patch({
    tracks: [],
    enabledTrackIds: [],
    playingTrackIds: [],
    highlightedTrackIds: [],
    referenceTrackId: null,
    trackAlignDetails: {},
    alignAttentionByTrackId: {},
    trackClipById: {},
    mixPeakAtUnityMaster: null,
    mixClipWarning: false,
    trackVolumes: {},
    masterVolume: 1,
    trackCounter: 0,
    metronomeBpm: null,
    calageMode: false,
    mixMode: false,
    cutMode: false,
    cutPhase: 'idle',
    cutSelectedTrackIds: [],
    cutWorkSegments: {},
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    contentSyncPickFromId: null,
    contentSyncInvite: null,
    guestSignInPrompt: false,
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  flushGuestDraftSave()
  persistMetronomeBpm()

  for (const cloudTrackId of cloudTrackIds) {
    void fetch('/api/cloud/library', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'deleteTrack',
        id: cloudTrackId,
      }),
    })
      .then(async (res) => {
        const data = (await res.json()) as { ok: boolean }
        if (!data.ok) {
          console.error('[cloud] failed to delete track')
        }
      })
      .catch((error) => {
        console.error('[cloud] failed to delete track', error)
      })
  }
}
