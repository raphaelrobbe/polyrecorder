import type { Track } from '../../common/types'
import { isOffsetSkewWarning } from '../audio/runtime.client'
import { type SessionNotice } from '../../store/sessionStore'
import { clearAutoAlignUndoSnapshot, evaluateReferenceBeat } from './align.client'
import { buildInitialCutWorkState } from './cut.client'
import { get, patch } from './state.client'
import { clearTrackHighlights, refreshTrackClipFlags } from './volumes.client'

function skewFingerprint(
  skewed: Array<{ track: Track; index: number }>,
): string {
  return skewed
    .map(({ track }) => `${track.id}:${Math.round(track.offsetMs)}`)
    .join('|')
}

export function refreshSkewWarning() {
  const {
    referenceBeatWarning,
    tracks,
    referenceTrackId,
    skewWarningDismissedKey,
    calageMode,
    showCalageWarnings,
    autoAlignEnabled,
    notice,
    noticeSuppressedId,
  } = get()

  if (!showCalageWarnings || !autoAlignEnabled) {
    // Clear the banner even if referenceBeatWarning was already nulled
    // (e.g. evaluateReferenceBeat runs before refresh when auto-align turns off).
    if (
      notice &&
      (notice.action === 'disableAutoAlign' ||
        notice.id.startsWith('beat:') ||
        (referenceBeatWarning != null &&
          notice.id === referenceBeatWarning.key))
    ) {
      patch({ notice: null, noticeSuppressedId: null })
    }
    patch({
      skewWarningMessage: null,
      skewWarningShowOpenAdvanced: false,
      skewWarningShowDisableAutoAlign: false,
    })
    return
  }

  const beatActive = referenceBeatWarning != null

  // Full battue text auto-opens only in calage (unless user closed it with ×).
  if (beatActive && calageMode) {
    if (noticeSuppressedId !== referenceBeatWarning.key) {
      showNotice({
        id: referenceBeatWarning.key,
        message: referenceBeatWarning.message,
        tone: 'align',
        action: 'disableAutoAlign',
      })
    }
  } else if (
    notice &&
    referenceBeatWarning &&
    notice.id === referenceBeatWarning.key &&
    !calageMode
  ) {
    // Leaving calage: hide banner; keep "!" chip; allow auto-open next time.
    patch({ notice: null, noticeSuppressedId: null })
  }

  if (beatActive && calageMode) {
    patch({
      skewWarningMessage: null,
      skewWarningShowOpenAdvanced: false,
      skewWarningShowDisableAutoAlign: false,
    })
    return
  }

  // Offset skew: chip only — no auto banner.
  const skewed = tracks
    .map((track, index) => ({ track, index }))
    .filter(
      ({ track }) =>
        track.id !== referenceTrackId && isOffsetSkewWarning(track.offsetMs),
    )

  if (skewed.length === 0) {
    patch({
      skewWarningMessage: null,
      skewWarningDismissedKey: '',
      skewWarningShowOpenAdvanced: false,
      skewWarningShowDisableAutoAlign: false,
    })
    return
  }

  const key = skewFingerprint(skewed)
  if (key === skewWarningDismissedKey) {
    patch({
      skewWarningMessage: null,
      skewWarningShowOpenAdvanced: false,
      skewWarningShowDisableAutoAlign: false,
    })
    return
  }

  patch({
    skewWarningMessage: null,
    skewWarningShowOpenAdvanced: false,
    skewWarningShowDisableAutoAlign: false,
  })
}

export function dismissSkewWarning() {
  dismissNotice()
}

/**
 * Open a dismissible notice. Same `id` already visible → no-op (no duplicate).
 * Clears suppress so a closed banner can be reopened from its "!".
 */
export function showNotice(notice: SessionNotice) {
  const current = get().notice
  if (current?.id === notice.id) return

  patch({
    notice,
    error: null,
    noticeSuppressedId: null,
    // Legacy permanent-dismiss key no longer hides the beat "!".
    referenceBeatDismissedKey: '',
  })
}

export function dismissNotice() {
  const notice = get().notice
  if (!notice) return
  if (notice.action === 'undoAutoAlign') {
    clearAutoAlignUndoSnapshot()
  }
  // × only hides the banner; the "!" chip stays so the user can reopen.
  patch({ notice: null, noticeSuppressedId: notice.id })
}

export function dismissMixClipWarning() {
  patch({ mixClipWarning: false })
}

export function setError(message: string | null) {
  get().setError(message)
}

export function setCalageMode(on: boolean) {
  const { tracks } = get()
  if (tracks.length === 0 && on) {
    patch({ calageMode: false })
    refreshSkewWarning()
    return
  }
  if (on) {
    clearTrackHighlights()
    patch({
      calageMode: true,
      mixMode: false,
      cutMode: false,
      cutPhase: 'idle',
      cutSelectedTrackIds: [],
      cutWorkSegments: {},
      calageTipOpen: false,
      masterAutoCorrectHint: null,
    })
    refreshSkewWarning()
    if (tracks.length > 0) void evaluateReferenceBeat()
    return
  }
  patch({ calageMode: false, calageTipOpen: false, referencePickActive: false })
  refreshSkewWarning()
}

export function setMixMode(on: boolean) {
  const { tracks } = get()
  if (tracks.length === 0 && on) {
    patch({ mixMode: false })
    return
  }
  if (on) {
    patch({
      mixMode: true,
      calageMode: false,
      cutMode: false,
      cutPhase: 'idle',
      cutSelectedTrackIds: [],
      cutWorkSegments: {},
      calageTipOpen: false,
      referencePickActive: false,
      contentSyncPickFromId: null,
      error: null,
      notice: null,
      noticeSuppressedId: null,
    })
    refreshSkewWarning()
    void refreshTrackClipFlags()
    return
  }
  clearTrackHighlights()
  patch({ mixMode: false, mixClipWarning: false, masterAutoCorrectHint: null })
}

export function setCutMode(on: boolean) {
  if (get().cutMerging) return
  const { tracks } = get()
  if (tracks.length === 0 && on) {
    patch({ cutMode: false })
    return
  }
  if (on) {
    clearTrackHighlights()
    const { cutWorkSegments, cutSelectedTrackIds } =
      buildInitialCutWorkState()
    patch({
      cutMode: true,
      mixMode: false,
      calageMode: false,
      calageTipOpen: false,
      referencePickActive: false,
      contentSyncPickFromId: null,
      cutPhase: 'edit',
      cutSelectedTrackIds,
      cutWorkSegments,
      cutPlaybackRate: 1,
      mixClipWarning: false,
      masterAutoCorrectHint: null,
      error: null,
      notice: null,
      noticeSuppressedId: null,
    })
    refreshSkewWarning()
    return
  }
  patch({
    cutMode: false,
    cutPhase: 'idle',
    cutSelectedTrackIds: [],
    cutWorkSegments: {},
    cutPlaybackRate: 1,
  })
}

/** Exclusive deck work mode: simple (default), mix, align, or cut. */
export type DeckWorkMode = 'simple' | 'mix' | 'align' | 'cut'

export function setDeckMode(mode: DeckWorkMode) {
  if (get().cutMerging) return
  if (mode === 'mix') {
    setMixMode(true)
    return
  }
  if (mode === 'align') {
    setCalageMode(true)
    return
  }
  if (mode === 'cut') {
    setCutMode(true)
    return
  }
  setMixMode(false)
  setCalageMode(false)
  setCutMode(false)
}
