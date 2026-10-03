import type { AppState, Track } from '../../common/types'
import { formatTime, getMixDurationMs } from '../format'
import {
  getTimerId,
  isAutoAlignOffsetExcluded,
  prefersHeadphonesHint,
  setAppAudioState,
  setMixPaused,
} from '../audio/runtime.client'
import { t } from '../i18n'
import { get, patch } from './state.client'

export function setTransportState(state: AppState) {
  setAppAudioState(state)
  patch({
    state,
    hint: computeHint(state, get().tracks.length),
    ...(state === 'recording' ? { guestSignInPrompt: false } : {}),
  })
}

export function setMixPausedBoth(paused: boolean) {
  setMixPaused(paused)
  patch({ mixPaused: paused })
}

function computeHint(state: AppState, trackCount: number): string {
  if (state === 'idle') return ''
  if (state === 'recording') {
    if (trackCount === 0) return ''
    if (prefersHeadphonesHint()) {
      return t('hint.recording.headphonesBleed')
    }
    return t('hint.recording.headphonesLatency')
  }
  return t('hint.listening')
}

export function syncPlayingIds(ids: Iterable<number>) {
  patch({ playingTrackIds: [...ids] })
}

export function clearPlayingIds() {
  syncPlayingIds([])
}

export function selectedTracks(): Track[] {
  const { tracks, enabledTrackIds } = get()
  const enabled = new Set(enabledTrackIds)
  return tracks.filter((track) => enabled.has(track.id))
}

export function alignableTracks(): Track[] {
  const { tracks, referenceTrackId } = get()
  return tracks.filter(
    (track) => track.id !== referenceTrackId && !track.isMetronome,
  )
}

/** Alignable takes that count-in auto-align is allowed to move (|offset| ≤ 10 s). */
export function autoAlignableTracks(): Track[] {
  return alignableTracks().filter(
    (track) => !isAutoAlignOffsetExcluded(track.offsetMs),
  )
}

export function getReferenceTrack(): Track | null {
  const { tracks, referenceTrackId } = get()
  if (referenceTrackId == null) return tracks[0] ?? null
  return (
    tracks.find((track) => track.id === referenceTrackId) ?? tracks[0] ?? null
  )
}

export function clearRefPeaks() {
  patch({
    refPeaksLabel: '',
    referenceBeatWarning: null,
    referenceBeatDismissedKey: '',
  })
}

export function syncReferenceTrackRules() {
  const { tracks, referenceTrackId, trackAlignDetails } = get()

  if (tracks.length === 0) {
    patch({
      referenceTrackId: null,
      trackAlignDetails: {},
      alignAttentionByTrackId: {},
    })
    clearRefPeaks()
    return
  }

  const previousReferenceId = referenceTrackId
  let nextReferenceId = referenceTrackId
  if (
    nextReferenceId == null ||
    !tracks.some((track) => track.id === nextReferenceId)
  ) {
    nextReferenceId = tracks[0]!.id
  }

  if (previousReferenceId != null && previousReferenceId !== nextReferenceId) {
    clearRefPeaks()
  }

  const nextDetails = { ...trackAlignDetails }
  delete nextDetails[nextReferenceId!]
  if (tracks.length < 2) {
    for (const key of Object.keys(nextDetails)) {
      delete nextDetails[Number(key)]
    }
  }

  patch({
    referenceTrackId: nextReferenceId,
    trackAlignDetails: nextDetails,
  })
}

export function updateSessionTimerDisplay() {
  const { state, tracks } = get()
  const timerId = getTimerId()
  const show = tracks.length > 0 || state === 'recording'
  if (!show) {
    patch({ recordingTimerVisible: false })
    return
  }
  patch({ recordingTimerVisible: true })
  if (state === 'recording' || timerId !== null) return
  patch({ timerText: formatTime(getMixDurationMs(tracks)) })
}
