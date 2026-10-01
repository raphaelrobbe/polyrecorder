import type { ActiveRecording, AppState, Track, TrackPlayhead } from '../common/types'
import { formatPseudoHandle } from '../common/user'
import {
  defaultSessionTitle,
  defaultTrackName,
  downloadFilenameForSelection,
  formatCentis,
  formatCentisCompact,
  formatTime,
  getMaxTrackDurationMs,
  getMixDurationMs,
  isDefaultSessionTitleAnyLocale,
  isDefaultTrackNameAnyLocale,
  LIBRARY_TITLE_MAX_LEN,
  normalizeSessionTitle,
  parseDefaultTrackIndex,
} from './format'
import type { Locale } from './i18n'
import { writeActiveSongPartId } from './cloudPrefs'
import { librarySessionPath } from './libraryPaths'
import {
  writeAutoMasterBoost,
  writeAutoMasterPreventClip,
} from './mixClipPrefs'
import { markPwaUsefulSession } from './pwaInstallPrefs'
import {
  clearTrackPeakCache,
  getTrackAbsPeak,
  idealMasterForTarget,
  isRecordClipped,
  measureMixPeakAtUnityMaster,
  mixOutputWouldClip,
} from './audio/clipDetect.client'
import {
  applyAudioSink,
  clearBufferCache,
  closeAudioContext,
  discardPendingRecording,
  ensureAudioContext,
  ensureMic,
  getActiveRecording,
  getAudioContext,
  getLastReportedLatencyMs,
  getLatencyTrimMs,
  getMixPaused,
  getMonitorLatencySec,
  getPendingRecording,
  getPlaybackGain,
  getPlaybackSources,
  getPlayheadRaf,
  getStartedAt,
  getTimerId,
  MAX_RECORDING_MS,
  MIX_LOOKAHEAD_S,
  isOffsetSkewWarning,
  pickMimeType,
  prefersHeadphonesHint,
  refreshAudioDevices,
  releaseMic,
  setActiveRecording,
  setAppAudioState,
  setInputMonitorId,
  setLatencyTrimMs,
  setMixPaused,
  setOverdubArmTimer,
  setPendingRecording,
  setPlaybackGain,
  setPlaybackSources,
  setPlayheadRaf,
  setSinkMonitorId,
  setSinkPlaybackId,
  setStartedAt,
  setTimerId,
  startMeter,
  stopMeterNodes,
  stopPlaybackSources,
  toSelectableDeviceOptions,
} from './audio/runtime.client'
import {
  decodeTrack,
  getSkipCountInStartS,
  MASTER_VOLUME_MAX,
  renderSelectedMixBuffer,
  scheduleTrackSource,
  TRACK_VOLUME_MAX,
  trimAudioBufferFrom,
} from './audio/mix.client'
import { connectPlaybackBus } from './audio/pitchPreserve.client'
import {
  audibleMixRange,
  bufferRangeFromMix,
  mergeMuteRanges,
  newSegmentId,
  segmentsOverlap,
  splitSegmentsAtPlayhead,
} from './audio/segments.client'
import {
  beginSaveWithMemory,
  downloadBlobLegacy,
  writeSaveTarget,
} from './fileSystemMemory.client'
import { resolveImportTrackName } from './audioImportName.client'
import {
  assessCountInBeat,
  findTakeThreeFourPeaks,
  findVolumePeaks,
} from './audio/peaks.client'
import {
  buildMetronomeReferenceBlob,
  clampMetronomeBpm,
  DEFAULT_METRONOME_BPM,
  metronomeReferenceDurationMs,
  metronomeReferencePeaksSec,
  scheduleMetronomeClicks,
} from './audio/metronome.client'
import {
  deleteGuestDraft,
  loadTabGuestDraft,
  pickGuestDraftToRestore,
  readTabDraftId,
  saveGuestDraft,
  type GuestDraft,
} from './guestDraft.client'
import { isCloudSignedIn, maybeAutoUploadTrack } from './cloudUpload.client'
import { useSessionStore, type SessionNotice, type SessionStoreState } from '../store/sessionStore'
import { t } from './i18n'

// --- Module-private live playback maps (not in Zustand) ---

let trackGains = new Map<number, GainNode>()
let trackPlayheads = new Map<number, TrackPlayhead>()
let playWaiters: Array<() => void> = []
let preferMimeType = ''
let pendingTakeOffsetMs = 0
/** When true, the take being finalized was a mid-mix punch-in. */
let pendingTakePunchIn = false
/** Mix playhead to restore when discarding the in-progress take. */
let pendingTakeRestartMs = 0
/** Mix position above this → punch-in / show content Sync. */
const PUNCH_IN_POSITION_MS = 50
/** How long Sync stays visible in simple mode after a punch-in take. */
const CONTENT_SYNC_SIMPLE_OFFER_MS = 10_000
let contentSyncSimpleOfferTimer: ReturnType<typeof setTimeout> | null = null
let mixEpochPerf: number | null = null
let mixTimelineStartCtx: number | null = null
let guestDraftSaveTimer: ReturnType<typeof setTimeout> | null = null

const GUEST_PROMPT_DISMISSED_KEY = 'polyrecorder-guest-prompt-dismissed'

function isGuestSignInPromptDismissed(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(GUEST_PROMPT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/** Hide the guest sign-in invite for the rest of this browser tab session. */
export function dismissGuestSignInPrompt(): void {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(GUEST_PROMPT_DISMISSED_KEY, '1')
    } catch {
      // ignore
    }
  }
  patch({ guestSignInPrompt: false })
}

function patch(partial: Partial<SessionStoreState>): void {
  useSessionStore.setState(partial)
}

/** Debounced IndexedDB snapshot while signed out (never hits S3). */
export function scheduleGuestDraftSave(): void {
  if (typeof window === 'undefined') return
  if (isCloudSignedIn()) return
  if (guestDraftSaveTimer) clearTimeout(guestDraftSaveTimer)
  guestDraftSaveTimer = setTimeout(() => {
    guestDraftSaveTimer = null
    void persistGuestDraftNow()
  }, 400)
}

/** Flush any pending guest draft write (e.g. beforeunload). */
export function flushGuestDraftSave(): void {
  if (typeof window === 'undefined') return
  if (isCloudSignedIn()) return
  if (guestDraftSaveTimer) {
    clearTimeout(guestDraftSaveTimer)
    guestDraftSaveTimer = null
  }
  void persistGuestDraftNow()
}

async function persistGuestDraftNow(): Promise<void> {
  if (isCloudSignedIn()) return
  const state = get()
  const result = await saveGuestDraft({
    sessionTitle: state.sessionTitle,
    autoAlignEnabled: state.autoAlignEnabled,
    showCalageWarnings: state.showCalageWarnings,
    skipCountInPlayback: state.skipCountInPlayback,
    skipCountInDownload: state.skipCountInDownload,
    referenceTrackId: state.referenceTrackId,
    trackCounter: state.trackCounter,
    masterVolume: state.masterVolume,
    metronomeBpm: state.metronomeBpm,
    tracks: state.tracks,
    trackVolumes: state.trackVolumes,
    enabledTrackIds: state.enabledTrackIds,
    cloudSongPartId: state.deckSongPartId,
    cloudSongId: state.deckSongId,
    deckSongPartSiblings: state.deckSongPartSiblings,
    deckLibraryPath: state.deckLibraryPath,
    songWorkName: state.songWorkName,
    sharedOwnerLabel: state.sharedOwnerLabel,
    readOnlySession: state.readOnlySession,
    allowsCollaboration: state.songAllowsCollaboration,
  })
  if (!result.ok && result.reason === 'quota') {
    patch({ hint: t('guestDraft.quota') })
  }
}

function applyGuestDraftToStore(draft: GuestDraft): void {
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()

  const tracks: Track[] = draft.tracks.map((row) => ({
    id: row.id,
    name: row.name,
    blob: row.blob,
    url: URL.createObjectURL(row.blob),
    durationMs: row.durationMs,
    offsetMs: row.offsetMs,
    muteRanges: row.muteRanges,
    cloudStatus: row.cloudStatus ?? 'local',
    cloudTrackId: row.cloudTrackId,
    cloudOwnedByMe: row.cloudOwnedByMe,
    uploadedByPseudo: row.uploadedByPseudo,
    isMetronome: row.isMetronome,
  }))
  const trackVolumes: Record<number, number> = {}
  const enabledTrackIds: number[] = []
  for (const row of draft.tracks) {
    trackVolumes[row.id] = row.volume
    if (row.enabled) enabledTrackIds.push(row.id)
  }

  const cloudPartId = draft.cloudSongPartId
  const allowsCollab = Boolean(draft.allowsCollaboration && cloudPartId)
  const readOnly = Boolean(draft.readOnlySession || cloudPartId)
  const hasMetroTrack = tracks.some((track) => track.isMetronome)
  const resolvedMetronomeBpm =
    draft.metronomeBpm ??
    (hasMetroTrack ? DEFAULT_METRONOME_BPM : null)

  patch({
    tracks,
    trackCounter: Math.max(
      draft.trackCounter,
      ...tracks.map((track) => track.id),
      0,
    ),
    enabledTrackIds,
    playingTrackIds: [],
    highlightedTrackIds: [],
    referenceTrackId:
      draft.referenceTrackId != null &&
      tracks.some((track) => track.id === draft.referenceTrackId)
        ? draft.referenceTrackId
        : (tracks[0]?.id ?? null),
    trackAlignDetails: {},
    trackVolumes,
    masterVolume: draft.masterVolume ?? 1,
    sessionTitle: draft.sessionTitle,
    autoAlignEnabled: draft.autoAlignEnabled,
    showCalageWarnings: draft.showCalageWarnings,
    skipCountInPlayback: draft.skipCountInPlayback,
    skipCountInDownload: draft.skipCountInDownload,
    metronomeBpm: resolvedMetronomeBpm,
    activeSongPartId: null,
    alignAttentionByTrackId: {},
    deckSongPartId: cloudPartId,
    deckSongPartSiblings: draft.deckSongPartSiblings ?? [],
    deckSongId: draft.cloudSongId,
    readOnlySession: readOnly,
    canCloudContribute: false,
    songAllowsCollaboration: Boolean(draft.allowsCollaboration),
    deckLibraryPath: draft.deckLibraryPath,
    songWorkName: draft.songWorkName,
    songIsPublic: false,
    sharedOwnerLabel: draft.sharedOwnerLabel,
    calageMode: false,
    mixMode: readOnly && !allowsCollab,
    cutMode: false,
    cutPhase: 'idle',
    cutSelectedTrackIds: [],
    cutWorkSegments: {},
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    error: null,
    notice: null,
    noticeSuppressedId: null,
    contentSyncInvite: null,
    referenceBeatDismissedKey: '',
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  // Ensure a virtual metro track exists when only the BPM was persisted.
  if (
    resolvedMetronomeBpm != null &&
    !tracks.some((track) => track.isMetronome)
  ) {
    void hydrateMetronomeFromBpm(resolvedMetronomeBpm).then(() => {
      if (get().tracks.length > 0) void evaluateReferenceBeat()
    })
    return
  }
  if (tracks.length > 0) void evaluateReferenceBeat()
}

/**
 * Guest boot / F5: restore this tab’s IndexedDB draft into an empty deck.
 * Only this tab’s draft — never another tab’s (emptied deck must stay empty).
 * (Sign-in restore stays in claimGuestDraftAfterSignIn.)
 */
export async function hydrateGuestDraftIfNeeded(): Promise<void> {
  if (isCloudSignedIn()) return
  if (get().tracks.length > 0) return
  const draft = await loadTabGuestDraft()
  if (!draft || draft.tracks.length === 0) return
  applyGuestDraftToStore(draft)
}

/**
 * After sign-in: reload the guest draft into memory (if the deck is empty),
 * re-arm collab contribute when applicable, then run the same post-take
 * path as appendTrackFromBlob (maybeAutoUploadTrack per local take).
 *
 * Concurrent callers share one in-flight run (remount / Strict Mode must not
 * start a second upload batch that would create another song).
 */
let guestClaimInFlight: Promise<void> | null = null

export function isGuestClaimInFlight(): boolean {
  return guestClaimInFlight != null
}

export async function claimGuestDraftAfterSignIn(): Promise<void> {
  if (!isCloudSignedIn()) return
  if (guestClaimInFlight) return guestClaimInFlight

  guestClaimInFlight = claimGuestDraftAfterSignInImpl().finally(() => {
    guestClaimInFlight = null
  })
  return guestClaimInFlight
}

async function claimGuestDraftAfterSignInImpl(): Promise<void> {
  if (!isCloudSignedIn()) return

  const deckHadTracks = get().tracks.length > 0
  let claimedDraftId: string | null = null

  if (!deckHadTracks) {
    const draft = await pickGuestDraftToRestore()
    if (!draft) return
    claimedDraftId = draft.id
    applyGuestDraftToStore(draft)
  } else {
    claimedDraftId = readTabDraftId()
  }

  // Signed-in collab session: contribute to the song part we overdubbed as guest.
  // Home guest takes: clear any stale localStorage target so upload creates a new song.
  const state = get()
  const songPartId = state.deckSongPartId
  if (
    state.readOnlySession &&
    state.songAllowsCollaboration &&
    songPartId
  ) {
    writeActiveSongPartId(songPartId)
    patch({
      activeSongPartId: songPartId,
      canCloudContribute: true,
    })
  } else if (!songPartId) {
    writeActiveSongPartId(null)
    patch({ activeSongPartId: null })
  }

  // Keep / restore virtual metronome after sign-in (not uploaded as audio).
  const metroBpm = get().metronomeBpm
  if (metroBpm != null && !get().tracks.some((track) => track.isMetronome)) {
    await hydrateMetronomeFromBpm(metroBpm)
  }

  const localIds = get()
    .tracks.filter(
      (track) =>
        !track.isMetronome &&
        track.blob.size > 0 &&
        (track.cloudStatus === 'local' ||
          track.cloudStatus === 'error' ||
          track.cloudStatus == null),
    )
    .map((track) => track.id)

  // Memory is the source of truth again; drop the IDB snapshot.
  if (claimedDraftId) await deleteGuestDraft(claimedDraftId)

  // Same gates as a take that just finished — one bound session for the whole batch.
  for (const id of localIds) {
    const bound = get().activeSongPartId
    if (bound) {
      writeActiveSongPartId(bound)
      patch({ activeSongPartId: bound, deckSongPartId: bound })
    }
    await maybeAutoUploadTrack(id)
  }

  // Persist tempo even when the only restore was the metronome, or uploads skipped.
  flushMetronomeBpmToCloud()
}

function get() {
  return useSessionStore.getState()
}

function setTransportState(state: AppState) {
  setAppAudioState(state)
  patch({
    state,
    hint: computeHint(state, get().tracks.length),
    ...(state === 'recording' ? { guestSignInPrompt: false } : {}),
  })
}

function setMixPausedBoth(paused: boolean) {
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

function syncPlayingIds(ids: Iterable<number>) {
  patch({ playingTrackIds: [...ids] })
}

function clearPlayingIds() {
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
  // × only hides the banner; the "!" chip stays so the user can reopen.
  patch({ notice: null, noticeSuppressedId: notice.id })
}

export function dismissMixClipWarning() {
  patch({ mixClipWarning: false })
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

function applyReferencePeaksLabel(reference: Track, peaks: number[]) {
  if (peaks.length === 0) {
    patch({ refPeaksLabel: '' })
    return
  }

  const times = peaks
    .map((peak) => formatCentisCompact(peak * 1000))
    .join(' · ')

  if (peaks.length >= 4) {
    const gapsMs = [1, 2, 3].map((index) =>
      Math.round((peaks[index]! - peaks[index - 1]!) * 1000),
    )
    patch({
      refPeaksLabel: t('align.refPeaks.ok', {
        name: reference.name,
        times,
        gaps: gapsMs.join(' / '),
      }),
    })
  } else {
    patch({
      refPeaksLabel: t('align.refPeaks.partial', {
        name: reference.name,
        times,
        count: peaks.length,
      }),
    })
  }
}

export function setError(message: string | null) {
  useSessionStore.getState().setError(message)
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

function buildInitialCutWorkState(): {
  cutWorkSegments: Record<number, import('../common/types').CutWorkSegment[]>
  cutSelectedTrackIds: number[]
} {
  const cutWorkSegments: Record<
    number,
    import('../common/types').CutWorkSegment[]
  > = {}
  const cutSelectedTrackIds: number[] = []
  for (const track of get().tracks) {
    if (track.isMetronome) continue
    const range = audibleMixRange(track)
    if (range.endMs <= range.startMs) continue
    cutSelectedTrackIds.push(track.id)
    cutWorkSegments[track.id] = [
      {
        id: newSegmentId(),
        startMs: range.startMs,
        endMs: range.endMs,
        selected: false,
      },
    ]
  }
  return { cutWorkSegments, cutSelectedTrackIds }
}

function resetCutWorkState(): void {
  const { cutWorkSegments, cutSelectedTrackIds } = buildInitialCutWorkState()
  patch({
    cutPhase: 'edit',
    cutSelectedTrackIds,
    cutWorkSegments,
  })
}

/** Clear segment selection but keep scissors cuts. */
function clearCutSegmentSelection(): void {
  const prev = get().cutWorkSegments
  const next: Record<number, import('../common/types').CutWorkSegment[]> = {}
  for (const [key, segments] of Object.entries(prev)) {
    next[Number(key)] = segments.map((seg) => ({ ...seg, selected: false }))
  }
  patch({ cutWorkSegments: next })
}

/** Toggle découpage preview speed (0.5 / 0.25); same value again returns to 1×. */
export function setCutPlaybackRate(rate: 0.5 | 0.25 | 1) {
  if (!get().cutMode || get().cutMerging) return
  const current = get().cutPlaybackRate
  const next = rate === current ? 1 : rate

  const audioContext = getAudioContext()
  const hasSources =
    getPlaybackSources().length > 0 || get().playingTrackIds.length > 0
  let positionMs = get().mixSeekMs
  if (audioContext && mixTimelineStartCtx !== null) {
    positionMs = getMixPositionMs()
  }

  patch({ cutPlaybackRate: next })

  // Rebuild the graph whenever sources exist (playing or paused): buffer
  // rates / SoundTouch must match the new tempo. seekMixTo alone skips
  // restart while paused in cut mode.
  if (hasSources) {
    const wasPaused = Boolean(get().mixPaused)
    void (async () => {
      try {
        await playTracks(get().tracks, {
          awaitEnd: true,
          asMix: true,
          applyOffsets: true,
          startAtMs: positionMs,
        })
        if (wasPaused) {
          const ctx = getAudioContext()
          if (ctx) {
            await ctx.suspend()
            setMixPausedBoth(true)
            tickClockDisplays()
          }
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : t('error.playbackFailed'),
        )
      }
    })()
    return
  }

  tickClockDisplays()
}

/** Reset découpage cuts to one segment per track (initial cut state). */
export function cancelCutSelection() {
  if (!get().cutMode || get().cutMerging) return
  resetCutWorkState()
}

export function toggleCutSegmentSelected(trackId: number, segmentId: string) {
  if (!get().cutMode || get().cutPhase !== 'edit' || get().cutMerging) return
  const segments = get().cutWorkSegments[trackId]
  if (!segments) return
  patch({
    cutWorkSegments: {
      ...get().cutWorkSegments,
      [trackId]: segments.map((seg) =>
        seg.id === segmentId ? { ...seg, selected: !seg.selected } : seg,
      ),
    },
  })
}

export function splitCutSegmentsAtPlayhead() {
  if (!get().cutMode || get().cutMerging) return
  let prev = get().cutWorkSegments
  if (Object.keys(prev).length === 0) {
    const built = buildInitialCutWorkState()
    prev = built.cutWorkSegments
    patch({
      cutWorkSegments: built.cutWorkSegments,
      cutSelectedTrackIds: built.cutSelectedTrackIds,
    })
  }
  const playheadMs = getMixPositionMs()
  const next: Record<number, import('../common/types').CutWorkSegment[]> = {}
  for (const key of Object.keys(prev)) {
    const trackId = Number(key)
    next[trackId] = splitSegmentsAtPlayhead(prev[trackId]!, playheadMs)
  }
  const hasSplit = Object.values(next).some((segs) => segs.length > 1)
  patch({
    cutWorkSegments: next,
    ...(hasSplit ? { cutPhase: 'edit' as const } : {}),
  })
}

/** Selected cut work segments across all tracks (mix timeline). */
export function selectedCutWorkSegments(): Array<{
  trackId: number
  startMs: number
  endMs: number
}> {
  const out: Array<{ trackId: number; startMs: number; endMs: number }> = []
  const work = get().cutWorkSegments
  for (const [key, segments] of Object.entries(work)) {
    const trackId = Number(key)
    for (const seg of segments) {
      if (!seg.selected) continue
      out.push({ trackId, startMs: seg.startMs, endMs: seg.endMs })
    }
  }
  return out
}

export function cutMergeBlockedReason(): 'none' | 'empty' | 'overlap' {
  const selected = selectedCutWorkSegments()
  if (selected.length === 0) return 'empty'
  if (segmentsOverlap(selected)) return 'overlap'
  return 'none'
}

function persistCloudTrackMuteRanges(trackId: number) {
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

export function applyCutMute() {
  if (!get().cutMode || get().cutPhase !== 'edit' || get().cutMerging) return
  const selected = selectedCutWorkSegments()
  if (selected.length === 0) return

  const byTrack = new Map<number, Array<{ startMs: number; endMs: number }>>()
  for (const seg of selected) {
    const list = byTrack.get(seg.trackId) ?? []
    list.push({ startMs: seg.startMs, endMs: seg.endMs })
    byTrack.set(seg.trackId, list)
  }

  const tracks = get().tracks.map((track) => {
    const segs = byTrack.get(track.id)
    if (!segs) return track
    const added = segs.map((s) =>
      bufferRangeFromMix(track, s.startMs, s.endMs),
    )
    const muteRanges = mergeMuteRanges([
      ...(track.muteRanges ?? []),
      ...added,
    ])
    return { ...track, muteRanges }
  })

  patch({ tracks })
  for (const trackId of byTrack.keys()) {
    persistCloudTrackMuteRanges(trackId)
  }
  scheduleGuestDraftSave()
  clearCutSegmentSelection()
}

/** Remove one mute window (buffer-local ms, as shown on the hatched bar). */
export function removeCutMuteRange(
  trackId: number,
  startMs: number,
  endMs: number,
) {
  if (!get().cutMode) return
  if (!(endMs > startMs)) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track) return

  const merged = mergeMuteRanges(track.muteRanges ?? [])
  const next = merged.filter(
    (range) => range.startMs !== startMs || range.endMs !== endMs,
  )
  if (next.length === merged.length) return

  const tracks = get().tracks.map((row) =>
    row.id === trackId
      ? {
          ...row,
          muteRanges: next.length > 0 ? next : undefined,
        }
      : row,
  )
  patch({ tracks })
  persistCloudTrackMuteRanges(trackId)
  scheduleGuestDraftSave()
}

/** Placeholder row shown while Fusionner encodes (progress on the track). */
function beginPendingMergeTrack(options: {
  name: string
  durationMs: number
  offsetMs: number
}): Track {
  const trackCounter = get().trackCounter + 1
  const empty = new Blob([], { type: 'audio/webm' })
  const track: Track = {
    id: trackCounter,
    name: options.name,
    blob: empty,
    url: URL.createObjectURL(empty),
    durationMs: options.durationMs,
    offsetMs: options.offsetMs,
    cloudStatus: 'local',
    fromCutMerge: true,
    mergePending: true,
  }
  patch({
    trackCounter,
    tracks: [...get().tracks, track],
    enabledTrackIds: [...get().enabledTrackIds, track.id],
    trackVolumes: { ...get().trackVolumes, [track.id]: 1 },
    cutMerging: true,
    cutMergeTrackId: track.id,
    cutMergeProgress: 0,
  })
  updateSessionTimerDisplay()
  return track
}

async function finalizePendingMergeTrack(
  trackId: number,
  blob: Blob,
  durationMs: number,
): Promise<Track | null> {
  const prev = get().tracks.find((t) => t.id === trackId)
  if (!prev?.mergePending) return null
  URL.revokeObjectURL(prev.url)
  clearBufferCache(trackId)
  const url = URL.createObjectURL(blob)
  const next: Track = {
    ...prev,
    blob,
    url,
    durationMs,
    mergePending: undefined,
  }
  patch({
    tracks: get().tracks.map((t) => (t.id === trackId ? next : t)),
  })
  updateSessionTimerDisplay()
  void import('./cloudUpload.client').then((mod) =>
    mod.maybeAutoUploadTrack(trackId),
  )
  scheduleGuestDraftSave()
  markPwaUsefulSession()
  void refreshTrackClipFlags([trackId])
  return next
}

/**
 * Offline-merge mix-timeline pieces into a new fromCutMerge track.
 * Used by découpage Fusionner and by the post-Sync silence merge invite.
 */
export async function mergeTimelinePieces(
  pieces: Array<{ track: Track; startMs: number; endMs: number }>,
  options?: {
    name?: string
    /** When true (découpage), refresh cut work segments around the result. */
    updateCutWork?: boolean
  },
): Promise<Track | null> {
  if (get().cutMerging) return null
  if (pieces.length === 0) return null

  const sourceTrackIds = [...new Set(pieces.map((p) => p.track.id))]
  const offsetMs = Math.min(...pieces.map((p) => p.startMs))
  const endMs = Math.max(...pieces.map((p) => p.endMs))
  const durationMs = Math.max(1, Math.round(endMs - offsetMs))
  const nameParts = sourceTrackIds
    .map((id) => get().tracks.find((t) => t.id === id)?.name)
    .filter((n): n is string => Boolean(n))
  const name =
    options?.name ??
    (nameParts.length > 0
      ? t('cut.merge.trackName', { names: nameParts.join(' + ') })
      : t('cut.merge.trackNameFallback'))

  setError(null)
  const pending = beginPendingMergeTrack({ name, durationMs, offsetMs })

  for (const id of sourceTrackIds) {
    setTrackEnabled(id, false)
  }

  if (options?.updateCutWork) {
    const pendingSeg: import('../common/types').CutWorkSegment = {
      id: newSegmentId(),
      startMs: offsetMs,
      endMs: offsetMs + durationMs,
      selected: false,
    }
    const cleared: Record<
      number,
      import('../common/types').CutWorkSegment[]
    > = {}
    for (const [key, segments] of Object.entries(get().cutWorkSegments)) {
      cleared[Number(key)] = segments.map((seg) => ({
        ...seg,
        selected: false,
      }))
    }
    cleared[pending.id] = [pendingSeg]
    patch({
      cutPhase: 'edit',
      cutWorkSegments: cleared,
      cutSelectedTrackIds: [
        ...new Set([...get().cutSelectedTrackIds, pending.id]),
      ],
    })
  }

  try {
    const {
      encodeAudioBufferForMerge,
      renderMergedCutBuffer,
      mergeProgressOverall,
    } = await import('./audio/encodeMerge.client')

    const onProgress = (update: {
      phase: 'decode' | 'render' | 'encode' | 'save'
      ratio: number
    }) => {
      patch({ cutMergeProgress: mergeProgressOverall(update) })
    }

    const rendered = await renderMergedCutBuffer(pieces, onProgress)
    const encoded = await encodeAudioBufferForMerge(rendered, onProgress)
    onProgress({ phase: 'save', ratio: 0.35 })
    const mergedTrack = await finalizePendingMergeTrack(
      pending.id,
      encoded.blob,
      encoded.durationMs,
    )
    if (!mergedTrack) throw new Error(t('error.exportFailed'))
    onProgress({ phase: 'save', ratio: 1 })

    if (options?.updateCutWork) {
      const range = audibleMixRange(mergedTrack)
      if (range.endMs > range.startMs) {
        patch({
          cutWorkSegments: {
            ...get().cutWorkSegments,
            [mergedTrack.id]: [
              {
                id: newSegmentId(),
                startMs: range.startMs,
                endMs: range.endMs,
                selected: false,
              },
            ],
          },
        })
      }
    }
    return mergedTrack
  } catch (error) {
    for (const id of sourceTrackIds) {
      setTrackEnabled(id, true)
    }
    patch({
      cutMerging: false,
      cutMergeTrackId: null,
      cutMergeProgress: 0,
    })
    deleteTrack(pending.id)
    setError(
      error instanceof Error ? error.message : t('error.exportFailed'),
    )
    return null
  } finally {
    if (get().cutMergeTrackId === pending.id || get().cutMerging) {
      patch({
        cutMerging: false,
        cutMergeTrackId: null,
        cutMergeProgress: 0,
      })
    }
  }
}

export async function mergeSelectedCutSegments(): Promise<boolean> {
  if (!get().cutMode || get().cutPhase !== 'edit' || get().cutMerging) {
    return false
  }
  if (cutMergeBlockedReason() !== 'none') return false

  const selected = selectedCutWorkSegments()
  const pieces = selected
    .map((seg) => {
      const track = get().tracks.find((t) => t.id === seg.trackId)
      if (!track) return null
      return { track, startMs: seg.startMs, endMs: seg.endMs }
    })
    .filter((p): p is NonNullable<typeof p> => p != null)
  if (pieces.length === 0) return false

  const merged = await mergeTimelinePieces(pieces, { updateCutWork: true })
  return merged != null
}

const HIGHLIGHT_DIM_VOLUME = 0.3

function syncLiveTrackGains() {
  for (const [id, gain] of trackGains) {
    gain.gain.value = liveTrackGainValue(id)
  }
}

function applyHighlightVolumes(highlighted: number[]) {
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

function clearTrackHighlights() {
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
function liveTrackGainValue(trackId: number): number {
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

const VOLUME_PERSIST_MS = 400
const trackVolumePersistTimers = new Map<number, ReturnType<typeof setTimeout>>()
let masterVolumePersistTimer: ReturnType<typeof setTimeout> | null = null

function canPersistCloudMix(): boolean {
  return !get().readOnlySession || get().canCloudContribute
}

/** Foreign cloud take — local edits OK; never persist to the server. */
function isForeignCloudTrack(track: { cloudTrackId?: string; cloudOwnedByMe?: boolean }) {
  return (
    Boolean(track.cloudTrackId) &&
    get().readOnlySession &&
    !track.cloudOwnedByMe
  )
}

function postLibraryIntent(body: Record<string, unknown>, label: string) {
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

function persistCloudTrackOffset(trackId: number) {
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

function persistCloudTrackOffsets(trackIds: number[]) {
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

function persistCloudTrackOrder() {
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

function persistCloudTrackMuted(trackId: number) {
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

function persistCloudTrackMutes(trackIds: number[]) {
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

function flushPersistTrackVolume(trackId: number) {
  const existing = trackVolumePersistTimers.get(trackId)
  if (existing) {
    clearTimeout(existing)
    trackVolumePersistTimers.delete(trackId)
  }
  if (!canPersistCloudMix()) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track?.cloudTrackId || isForeignCloudTrack(track)) return
  postLibraryIntent(
    {
      intent: 'updateTrackVolume',
      id: track.cloudTrackId,
      volume: getTrackVolume(trackId),
    },
    'update track volume',
  )
}

function schedulePersistTrackVolume(trackId: number) {
  if (!canPersistCloudMix()) return
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track?.cloudTrackId || isForeignCloudTrack(track)) return
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

function flushPersistMasterVolume() {
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

function schedulePersistMasterVolume() {
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

function schedulePersistAlignPrefs() {
  if (get().readOnlySession || !canPersistCloudMix()) return
  if (!get().activeSongPartId) return
  if (alignPrefsPersistTimer) clearTimeout(alignPrefsPersistTimer)
  alignPrefsPersistTimer = setTimeout(() => {
    alignPrefsPersistTimer = null
    flushPersistAlignPrefs()
  }, VOLUME_PERSIST_MS)
}

function persistMetronomeBpm() {
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

/** Flush session metronome tempo to the cloud part (e.g. after first upload binds an id). */
export function flushMetronomeBpmToCloud(): void {
  persistMetronomeBpm()
}

/** Update a session align/count-in flag and persist to the cloud part. */
export function setSessionAlignPref(
  key:
    | 'autoAlignEnabled'
    | 'showCalageWarnings'
    | 'skipCountInPlayback'
    | 'skipCountInDownload',
  on: boolean,
): void {
  if (key === 'autoAlignEnabled' && !on) {
    patch({
      autoAlignEnabled: false,
      skipCountInPlayback: false,
      skipCountInDownload: false,
    })
    cancelReferencePick()
  } else {
    patch({ [key]: on })
  }
  if (key === 'autoAlignEnabled' || key === 'showCalageWarnings') {
    void evaluateReferenceBeat()
  } else {
    refreshSkewWarning()
  }
  schedulePersistAlignPrefs()
  scheduleGuestDraftSave()
}

/** Persist all cloud track volumes + master (e.g. after highlight / dim). */
function persistCloudMixVolumes() {
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
  flushPersistMasterVolume()
}

export function syncLatencyDisplay() {
  patch({
    latencyTrimMs: getLatencyTrimMs(),
    lastReportedLatencyMs: getLastReportedLatencyMs(),
  })
}

export function updateLatencyTrim(value: number) {
  setLatencyTrimMs(value)
  syncLatencyDisplay()
}

export async function refreshDeviceSnapshot(): Promise<void> {
  const snapshot = await refreshAudioDevices()
  patch({
    deviceApiSupported: snapshot.apiSupported,
    deviceSelectable: snapshot.deviceSelectable,
    sinkSelectable: snapshot.sinkSelectable,
    outputOptions: toSelectableDeviceOptions(
      snapshot.outputs,
      t('devices.outputFallback'),
    ),
    inputOptions: toSelectableDeviceOptions(
      snapshot.inputs,
      t('devices.inputFallback'),
    ),
    sinkMonitorId: snapshot.sinkMonitorId,
    sinkPlaybackId: snapshot.sinkPlaybackId,
    inputMonitorId: snapshot.inputMonitorId,
  })
}

export function applySinkMonitorSelection(deviceId: string) {
  setSinkMonitorId(deviceId)
  patch({ sinkMonitorId: deviceId })
}

export function applySinkPlaybackSelection(deviceId: string) {
  setSinkPlaybackId(deviceId)
  patch({ sinkPlaybackId: deviceId })
}

export function applyInputMonitorSelection(deviceId: string) {
  setInputMonitorId(deviceId)
  patch({ inputMonitorId: deviceId, inputOverrideNote: null })
  if (get().state === 'recording') return
  releaseMic()
  void ensureMic()
    .then(({ inputOverrideNote }) => {
      patch({ inputOverrideNote })
    })
    .catch(() => {
      // Next record will surface the error.
    })
}

function startTimer(fromPerf = performance.now()) {
  setStartedAt(fromPerf)
  patch({
    recordingTimerVisible: true,
    timerText: '00:00',
    forgottenStopHint: false,
  })
  const existing = getTimerId()
  if (existing !== null) window.clearInterval(existing)
  const id = window.setInterval(() => {
    const elapsed = performance.now() - getStartedAt()
    const tracks = get().tracks
    // Only warn when overdubbing past existing takes. A metronome alone
    // yields max=0, which must not trigger on the first content take.
    const otherTakesMs = getMaxTrackDurationMs(tracks)
    const forgottenStopHint =
      get().state === 'recording' &&
      otherTakesMs > 0 &&
      elapsed > otherTakesMs + 10_000
    patch({ timerText: formatTime(elapsed), forgottenStopHint })
    if (
      elapsed >= MAX_RECORDING_MS &&
      get().state === 'recording' &&
      !get().sessionStopping
    ) {
      const timerId = getTimerId()
      if (timerId !== null) {
        window.clearInterval(timerId)
        setTimerId(null)
      }
      void stopSession()
    }
  }, 200)
  setTimerId(id)
}

function stopTimer(): number {
  const startedAt = getStartedAt()
  const elapsed = startedAt > 0 ? performance.now() - startedAt : 0
  setStartedAt(0)
  const timerId = getTimerId()
  if (timerId !== null) {
    window.clearInterval(timerId)
    setTimerId(null)
  }
  patch({ forgottenStopHint: false })
  updateSessionTimerDisplay()
  return elapsed
}

function settlePlayWaiters() {
  const waiters = playWaiters
  playWaiters = []
  for (const resolve of waiters) resolve()
}

export function stopPlayheadClock() {
  const raf = getPlayheadRaf()
  if (raf !== null) {
    cancelAnimationFrame(raf)
    setPlayheadRaf(null)
  }
}

export function getMixPositionMs(): number {
  const audioContext = getAudioContext()
  if (!audioContext || mixTimelineStartCtx === null) return get().mixSeekMs
  const rate = Math.max(0.05, get().cutPlaybackRate || 1)
  return Math.max(
    0,
    (audioContext.currentTime - mixTimelineStartCtx) * 1000 * rate,
  )
}

export function getTrackPositionMs(trackId: number): number {
  const head = trackPlayheads.get(trackId)
  const audioContext = getAudioContext()
  if (!audioContext || !head) return 0
  if (audioContext.currentTime < head.when) return head.skipS * 1000
  const into = audioContext.currentTime - head.when
  const posS = Math.min(head.skipS + head.lengthS, head.skipS + into)
  return Math.max(0, posS * 1000)
}

/** Update mix seek / clock fields from the live timeline (or scrub position). */
export function tickClockDisplays() {
  const { seekDragActive, mixSeekMs } = get()

  if (seekDragActive) {
    patch({ mixClockText: formatCentis(mixSeekMs) })
    return
  }

  const positionMs = getMixPositionMs()
  if (mixTimelineStartCtx !== null) {
    patch({ mixSeekMs: positionMs, mixClockText: formatCentis(positionMs) })
  } else {
    patch({ mixClockText: formatCentis(positionMs) })
  }
}

export function startPlayheadClock() {
  stopPlayheadClock()
  const tick = () => {
    tickClockDisplays()
    setPlayheadRaf(requestAnimationFrame(tick))
  }
  setPlayheadRaf(requestAnimationFrame(tick))
}

export function setTrackAudible(trackId: number, audible: boolean) {
  const gain = trackGains.get(trackId)
  if (gain) {
    gain.gain.value = audible ? getTrackVolume(trackId) : 0
  }
}

export function stopPlayback(options?: { resetSeek?: boolean }) {
  const positionBeforeStop = getMixPositionMs()
  stopPlayheadClock()

  for (const source of getPlaybackSources()) {
    source.onended = null
  }
  stopPlaybackSources()
  trackGains.clear()
  trackPlayheads.clear()
  clearPlayingIds()

  patch({ mixListenActive: false })
  setMixPausedBoth(false)
  mixEpochPerf = null
  mixTimelineStartCtx = null

  if (options?.resetSeek) {
    patch({ mixSeekMs: 0 })
  } else if (positionBeforeStop > 0) {
    patch({ mixSeekMs: positionBeforeStop })
  }

  const audioContext = getAudioContext()
  if (audioContext?.state === 'suspended' && !getMixPaused()) {
    void audioContext.resume()
  }

  settlePlayWaiters()
  const seek = get().mixSeekMs
  patch({ mixClockText: formatCentis(seek) })
}

/** Stop mix playback and reset the playhead to the start (no auto-play). */
export function stopMixToStart() {
  if (get().state === 'recording') return
  stopPlayback({ resetSeek: true })
  patch({
    mixSeekMs: 0,
    mixClockText: formatCentis(0),
    mixSeekRatio: 0,
    contentSyncPickFromId: null,
    referencePickActive: false,
  })
}

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

/**
 * Stop mix briefly for an align/offset change, keep the playhead, then
 * resume (or re-pause) at the same position.
 */
async function withMixTransportPreserved(
  work: () => void | Promise<void>,
): Promise<void> {
  const hasSources =
    getPlaybackSources().length > 0 || get().playingTrackIds.length > 0
  const wasPaused = Boolean(get().mixPaused && hasSources)
  const wasPlaying = Boolean(!get().mixPaused && hasSources)
  const positionMs = getMixPositionMs()

  if (wasPlaying || wasPaused) {
    stopPlayback({ resetSeek: false })
  }
  patch({
    mixSeekMs: positionMs,
    mixClockText: formatCentis(positionMs),
  })

  try {
    await work()
  } finally {
    patch({
      mixSeekMs: positionMs,
      mixClockText: formatCentis(positionMs),
    })
    if (!wasPlaying && !wasPaused) return
    const tracks = get().tracks
    if (tracks.length === 0 || get().state === 'recording') return
    try {
      await playTracks(tracks, {
        awaitEnd: true,
        asMix: true,
        applyOffsets: true,
        startAtMs: positionMs,
      })
      if (wasPaused) {
        const audioContext = getAudioContext()
        if (audioContext) {
          await audioContext.suspend()
          setMixPausedBoth(true)
          tickClockDisplays()
        }
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : t('error.playbackFailed'),
      )
    }
  }
}

export function applyManualTrackOffset(trackId: number, offsetMs: number) {
  const invite = get().contentSyncInvite
  if (
    invite &&
    trackId === invite.fromTrackId &&
    invite.step !== 'merging' &&
    invite.step !== 'listenMerge' &&
    invite.step !== 'acceptMerge'
  ) {
    void applyContentSyncFocusOffset(trackId, offsetMs)
    return
  }
  void withMixTransportPreserved(() => {
    commitTrackOffsetMs(trackId, offsetMs)
  })
}

function commitTrackOffsetMs(trackId: number, offsetMs: number) {
  const tracks = get().tracks.map((track) =>
    track.id === trackId ? { ...track, offsetMs } : track,
  )
  const trackAlignDetails = { ...get().trackAlignDetails }
  delete trackAlignDetails[trackId]
  const alignAttentionByTrackId = { ...get().alignAttentionByTrackId }
  delete alignAttentionByTrackId[trackId]
  patch({ tracks, trackAlignDetails, alignAttentionByTrackId })
  refreshSkewWarning()
  persistCloudTrackOffset(trackId)
  scheduleGuestDraftSave()
  scheduleMixPeakRefresh()
}

/**
 * During the post-Sync invite flow: nudge the focus take, jump playback to
 * its start, and show “Satisfait du calage ?” immediately.
 */
async function applyContentSyncFocusOffset(
  trackId: number,
  offsetMs: number,
): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.fromTrackId !== trackId) return

  clearContentSyncInviteTimer()
  commitTrackOffsetMs(trackId, offsetMs)
  setCalageMode(true)
  patchContentSyncInvite({
    step: 'satisfied',
    afterManualAdjust: true,
  })

  const from = get().tracks.find((track) => track.id === trackId)
  if (!from) return
  const startMs = audibleMixRange(from).startMs
  try {
    setError(null)
    await seekMixTo(startMs)
  } catch {
    // seekMixTo already sets error
  }
}

/** Tracks that can show / use content Sync (punch-in or delayed start). */
export function trackOffersContentSync(track: Track): boolean {
  if (track.isMetronome) return false
  if (track.punchIn) return true
  return track.offsetMs > PUNCH_IN_POSITION_MS
}

function armSimpleContentSyncOffer() {
  if (contentSyncSimpleOfferTimer) {
    clearTimeout(contentSyncSimpleOfferTimer)
    contentSyncSimpleOfferTimer = null
  }
  const until = Date.now() + CONTENT_SYNC_SIMPLE_OFFER_MS
  patch({ contentSyncSimpleOfferUntil: until })
  contentSyncSimpleOfferTimer = setTimeout(() => {
    contentSyncSimpleOfferTimer = null
    if (get().contentSyncSimpleOfferUntil !== until) return
    patch({ contentSyncSimpleOfferUntil: 0 })
  }, CONTENT_SYNC_SIMPLE_OFFER_MS)
}

function clearSimpleContentSyncOffer() {
  if (contentSyncSimpleOfferTimer) {
    clearTimeout(contentSyncSimpleOfferTimer)
    contentSyncSimpleOfferTimer = null
  }
  if (get().contentSyncSimpleOfferUntil !== 0) {
    patch({ contentSyncSimpleOfferUntil: 0 })
  }
}

export function beginContentSyncPick(trackId: number) {
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track || !trackOffersContentSync(track)) return
  const current = get().contentSyncPickFromId
  if (current === trackId) {
    patch({ contentSyncPickFromId: null })
    return
  }
  patch({ contentSyncPickFromId: trackId, referencePickActive: false })
}

export function cancelContentSyncPick() {
  if (get().contentSyncPickFromId == null) return
  patch({ contentSyncPickFromId: null })
}

export function beginReferencePick() {
  if (!get().calageMode) return
  if (get().tracks.length < 2) return
  if (get().referencePickActive) {
    patch({ referencePickActive: false })
    return
  }
  patch({ referencePickActive: true, contentSyncPickFromId: null })
}

export function cancelReferencePick() {
  if (!get().referencePickActive) return
  patch({ referencePickActive: false })
}

/** Set the calage reference track (1–2–3–4 / metronome). */
export function setReferenceTrack(trackId: number) {
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track) return
  if (get().referenceTrackId === trackId) {
    cancelReferencePick()
    return
  }

  void withMixTransportPreserved(() => {
    clearRefPeaks()
    const trackAlignDetails = { ...get().trackAlignDetails }
    delete trackAlignDetails[trackId]
    patch({
      referenceTrackId: trackId,
      trackAlignDetails,
      referencePickActive: false,
      referenceBeatDismissedKey: '',
    })
    scheduleGuestDraftSave()
    void evaluateReferenceBeat()
    refreshSkewWarning()
  })
}

/**
 * Align a punch-in take against another track via onset NCC (±500 ms).
 * Call when the user picks the target while contentSyncPickFromId is set.
 */
export async function completeContentSyncAgainst(
  againstTrackId: number,
): Promise<void> {
  const fromId = get().contentSyncPickFromId
  if (fromId == null) return
  if (againstTrackId === fromId) return

  const from = get().tracks.find((t) => t.id === fromId)
  const against = get().tracks.find((t) => t.id === againstTrackId)
  if (!from || !against || against.isMetronome) {
    cancelContentSyncPick()
    return
  }

  patch({ contentSyncPickFromId: null })
  setError(null)
  const previousOffsetMs = from.offsetMs

  try {
    const [{ refineOffsetByOverlap }, bufFrom, bufAgainst] = await Promise.all([
      import('./audio/overlapAlign.client'),
      decodeTrack(from),
      decodeTrack(against),
    ])
    const refined = refineOffsetByOverlap(
      bufAgainst,
      bufFrom,
      from.offsetMs,
    )
    if (!refined) {
      showNotice({
        id: `content-sync-weak-${fromId}`,
        message: t('tracks.contentSync.weak'),
        tone: 'align',
      })
      return
    }
    applyManualTrackOffset(fromId, Math.round(refined.offsetMs))
    beginContentSyncInvite({
      fromTrackId: fromId,
      againstTrackId,
      previousOffsetMs,
      keepName: against.name,
    })
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : t('tracks.contentSync.failed'),
    )
  }
}

let contentSyncInviteTimer: ReturnType<typeof setTimeout> | null = null

function clearContentSyncInviteTimer() {
  if (contentSyncInviteTimer) {
    clearTimeout(contentSyncInviteTimer)
    contentSyncInviteTimer = null
  }
}

function patchContentSyncInvite(
  partial: Partial<import('../store/sessionStore').ContentSyncInvite>,
) {
  const current = get().contentSyncInvite
  if (!current) return
  patch({ contentSyncInvite: { ...current, ...partial } })
}

function beginContentSyncInvite(options: {
  fromTrackId: number
  againstTrackId: number
  previousOffsetMs: number
  keepName: string
}) {
  clearContentSyncInviteTimer()
  dismissNotice()
  patch({
    contentSyncInvite: {
      step: 'listenSync',
      fromTrackId: options.fromTrackId,
      againstTrackId: options.againstTrackId,
      previousOffsetMs: options.previousOffsetMs,
      cutPointMs: null,
      mergedTrackId: null,
      keepName: options.keepName,
      afterManualAdjust: false,
    },
  })
}

/** Close the post-Sync invite; optionally discard an unaccepted merge. */
export function dismissContentSyncInvite() {
  clearContentSyncInviteTimer()
  const invite = get().contentSyncInvite
  if (!invite) return

  const { mergedTrackId, againstTrackId, fromTrackId, step } = invite
  patch({ contentSyncInvite: null })

  if (
    mergedTrackId != null &&
    (step === 'listenMerge' ||
      step === 'acceptMerge' ||
      step === 'merging')
  ) {
    // Unaccepted merge → drop it and restore sources.
    if (get().tracks.some((t) => t.id === mergedTrackId)) {
      deleteTrack(mergedTrackId)
    }
    setTrackEnabled(againstTrackId, true)
    setTrackEnabled(fromTrackId, true)
  }
}

export async function contentSyncInviteListenSync(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'listenSync') return

  const from = get().tracks.find((t) => t.id === invite.fromTrackId)
  if (!from) {
    dismissContentSyncInvite()
    return
  }

  const startMs = audibleMixRange(from).startMs
  clearContentSyncInviteTimer()
  try {
    setError(null)
    void seekMixTo(startMs)
  } catch {
    // seekMixTo already sets error
  }

  contentSyncInviteTimer = setTimeout(() => {
    contentSyncInviteTimer = null
    if (get().contentSyncInvite?.step !== 'listenSync') return
    patchContentSyncInvite({ step: 'satisfied', afterManualAdjust: false })
  }, 1000)
}

/**
 * After rejecting auto-Sync: stay in (or enter) Calage, nudge by hand, then
 * listen again — merge invite still follows if satisfied.
 */
export async function contentSyncInviteListenAdjust(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'adjustListen') return

  const from = get().tracks.find((t) => t.id === invite.fromTrackId)
  if (!from) {
    dismissContentSyncInvite()
    return
  }

  const startMs = audibleMixRange(from).startMs
  clearContentSyncInviteTimer()
  try {
    setError(null)
    void seekMixTo(startMs)
  } catch {
    // seekMixTo already sets error
  }

  contentSyncInviteTimer = setTimeout(() => {
    contentSyncInviteTimer = null
    if (get().contentSyncInvite?.step !== 'adjustListen') return
    patchContentSyncInvite({ step: 'satisfied', afterManualAdjust: true })
  }, 2000)
}

export function contentSyncInviteSatisfied(yes: boolean) {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'satisfied') return
  clearContentSyncInviteTimer()

  if (yes) {
    patchContentSyncInvite({ step: 'mergeAsk' })
    return
  }

  // Keep the current offset as a base for ± ms nudges; open Calage and
  // continue the invite flow (listen → merge) instead of sending to Découpage.
  setCalageMode(true)
  patchContentSyncInvite({
    step: 'adjustListen',
    afterManualAdjust: true,
  })
}

export function contentSyncInviteMergeAsk(yes: boolean) {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'mergeAsk') return
  clearContentSyncInviteTimer()

  if (!yes) {
    patchContentSyncInvite({ step: 'goCut' })
    return
  }

  void runContentSyncSilenceMerge()
}

export function contentSyncInviteGoCut() {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'goCut') return
  clearContentSyncInviteTimer()
  patch({ contentSyncInvite: null })
  setCutMode(true)
}

async function runContentSyncSilenceMerge(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'mergeAsk') return

  const against = get().tracks.find((t) => t.id === invite.againstTrackId)
  const from = get().tracks.find((t) => t.id === invite.fromTrackId)
  if (!against || !from) {
    dismissContentSyncInvite()
    return
  }

  patchContentSyncInvite({ step: 'merging' })
  setError(null)

  try {
    const [{ findQuietestOverlapCutMs }, bufAgainst, bufFrom] =
      await Promise.all([
        import('./audio/silenceCut.client'),
        decodeTrack(against),
        decodeTrack(from),
      ])

    // Fresh offsets after Sync.
    const againstNow = get().tracks.find((t) => t.id === invite.againstTrackId)
    const fromNow = get().tracks.find((t) => t.id === invite.fromTrackId)
    if (!againstNow || !fromNow) {
      dismissContentSyncInvite()
      return
    }

    const cutPointMs = findQuietestOverlapCutMs(
      {
        buffer: bufAgainst,
        offsetMs: againstNow.offsetMs,
        durationMs: againstNow.durationMs,
      },
      {
        buffer: bufFrom,
        offsetMs: fromNow.offsetMs,
        durationMs: fromNow.durationMs,
      },
    )

    if (cutPointMs == null) {
      setError(t('tracks.contentSync.invite.mergeNoSilence'))
      patchContentSyncInvite({ step: 'goCut' })
      return
    }

    const rangeAgainst = audibleMixRange(againstNow)
    const rangeFrom = audibleMixRange(fromNow)
    if (
      !(cutPointMs > rangeAgainst.startMs + 20) ||
      !(cutPointMs < rangeFrom.endMs - 20)
    ) {
      setError(t('tracks.contentSync.invite.mergeNoSilence'))
      patchContentSyncInvite({ step: 'goCut' })
      return
    }

    const pieces = [
      {
        track: againstNow,
        startMs: rangeAgainst.startMs,
        endMs: cutPointMs,
      },
      {
        track: fromNow,
        startMs: cutPointMs,
        endMs: rangeFrom.endMs,
      },
    ]

    const merged = await mergeTimelinePieces(pieces, {
      name: t('cut.merge.trackName', {
        names: `${againstNow.name} + ${fromNow.name}`,
      }),
      updateCutWork: false,
    })

    if (!merged) {
      // mergeTimelinePieces already sets error / re-enables sources
      patchContentSyncInvite({ step: 'goCut' })
      return
    }

    patchContentSyncInvite({
      step: 'listenMerge',
      cutPointMs,
      mergedTrackId: merged.id,
    })
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : t('tracks.contentSync.invite.mergeFailed'),
    )
    patchContentSyncInvite({ step: 'goCut' })
  }
}

export async function contentSyncInviteListenMerge(): Promise<void> {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'listenMerge') return
  if (invite.cutPointMs == null || invite.mergedTrackId == null) return

  const startMs = Math.max(0, invite.cutPointMs - 2000)
  clearContentSyncInviteTimer()
  try {
    setError(null)
    void seekMixTo(startMs)
  } catch {
    // seekMixTo already sets error
  }

  contentSyncInviteTimer = setTimeout(() => {
    contentSyncInviteTimer = null
    if (get().contentSyncInvite?.step !== 'listenMerge') return
    patchContentSyncInvite({ step: 'acceptMerge' })
  }, 4000)
}

export function contentSyncInviteAcceptMerge(yes: boolean) {
  const invite = get().contentSyncInvite
  if (!invite || invite.step !== 'acceptMerge') return
  clearContentSyncInviteTimer()

  const { mergedTrackId, againstTrackId, fromTrackId, keepName } = invite
  if (mergedTrackId == null) {
    patch({ contentSyncInvite: null })
    return
  }

  if (!yes) {
    // Clear merge refs first so deleteTrack doesn’t wipe the whole invite.
    patchContentSyncInvite({
      step: 'goCut',
      mergedTrackId: null,
      cutPointMs: null,
    })
    deleteTrack(mergedTrackId)
    setTrackEnabled(againstTrackId, true)
    setTrackEnabled(fromTrackId, true)
    return
  }

  // Keep merge: rename to first track, delete sources.
  renameTrack(mergedTrackId, keepName)
  patch({ contentSyncInvite: null })
  if (againstTrackId !== mergedTrackId) deleteTrack(againstTrackId)
  if (fromTrackId !== mergedTrackId) deleteTrack(fromTrackId)
  setTrackEnabled(mergedTrackId, true)
  scheduleGuestDraftSave()
}

export async function evaluateReferenceBeat(): Promise<void> {
  const reference = getReferenceTrack()
  if (!reference || reference.blob.size === 0) {
    patch({
      referenceBeatWarning: null,
      referenceBeatDismissedKey: '',
    })
    refreshSkewWarning()
    return
  }

  if (!get().autoAlignEnabled) {
    patch({
      referenceBeatWarning: null,
      referenceBeatDismissedKey: '',
    })
    refreshSkewWarning()
    return
  }

  try {
    let peaks: number[]
    if (reference.isMetronome) {
      const bpm = get().metronomeBpm ?? DEFAULT_METRONOME_BPM
      peaks = metronomeReferencePeaksSec(bpm)
    } else {
      const buffer = await decodeTrack(reference)
      peaks = findVolumePeaks(buffer, 4)
    }
    const assessment = assessCountInBeat(peaks)
    applyReferencePeaksLabel(reference, assessment.peaks)

    if (assessment.ok) {
      patch({
        referenceBeatWarning: null,
        referenceBeatDismissedKey: '',
      })
    } else if (assessment.reason === 'irregular') {
      patch({
        referenceBeatWarning: {
          key: `beat:${reference.id}:irregular:${assessment.peaks.map((p) => p.toFixed(3)).join(',')}`,
          message: t('warn.beat.irregular', { name: reference.name }),
          reason: 'irregular',
        },
      })
    } else {
      patch({
        referenceBeatWarning: {
          key: `beat:${reference.id}:missing:${peaks.length}`,
          message: t('warn.beat.missing', {
            name: reference.name,
            count: peaks.length,
          }),
          reason: 'missing',
        },
      })
    }
  } catch {
    patch({
      referenceBeatWarning: {
        key: `beat:${reference.id}:error`,
        message: t('warn.beat.error', { name: reference.name }),
        reason: 'error',
      },
    })
  }

  refreshSkewWarning()
}

/**
 * Align takes on the reference using shared "3-4" counts.
 * Reference must contain 1-2-3-4; later tracks should contain 3-4 in sync.
 * Only the given track ids are measured — existing offsets on other takes
 * are left untouched.
 */
export async function autoAlignTracksFromCounts(
  trackIds: ReadonlyArray<number>,
): Promise<void> {
  const targets = [...new Set(trackIds)].filter((id) =>
    get().tracks.some((track) => track.id === id),
  )
  if (targets.length === 0) return

  const { tracks, trackAlignDetails } = get()
  if (tracks.length < 2) {
    throw new Error(t('error.needTwoTracks'))
  }

  const reference = getReferenceTrack()
  if (!reference) {
    throw new Error(t('error.missingReference'))
  }

  let refPeaks: number[]
  if (reference.isMetronome) {
    const bpm = get().metronomeBpm ?? DEFAULT_METRONOME_BPM
    refPeaks = metronomeReferencePeaksSec(bpm)
  } else {
    const refBuffer = await decodeTrack(reference)
    refPeaks = findVolumePeaks(refBuffer, 4)
  }
  if (refPeaks.length < 4) {
    const error = new Error(
      t('error.refPeaks', {
        name: reference.name,
        count: refPeaks.length,
      }),
    ) as Error & { trackId?: number }
    error.trackId = reference.id
    throw error
  }

  const refThree = refPeaks[2]!
  const refFour = refPeaks[3]!
  applyReferencePeaksLabel(reference, refPeaks)

  const targetSet = new Set(targets)
  const nextTracks = tracks.map((track) => ({ ...track }))
  const nextDetails = { ...trackAlignDetails }
  const alignedIds: number[] = []

  for (const track of nextTracks) {
    if (track.id === reference.id) continue
    if (track.isMetronome) continue
    if (!targetSet.has(track.id)) continue

    const buffer = await decodeTrack(track)
    const peaks = findVolumePeaks(buffer, 8)
    const pair = findTakeThreeFourPeaks(peaks, refThree, refFour)
    if (!pair) {
      const error = new Error(
        t('error.trackPeaks', {
          name: track.name,
          count: peaks.length,
        }),
      ) as Error & { trackId?: number }
      error.trackId = track.id
      throw error
    }

    const [takeThree, takeFour] = pair
    const offsetFromThree =
      reference.offsetMs + (refThree - takeThree) * 1000
    const offsetFromFour = reference.offsetMs + (refFour - takeFour) * 1000
    const measured = (offsetFromThree + offsetFromFour) / 2
    track.offsetMs = Math.round(measured)
    nextDetails[track.id] = {
      delta3Ms: Math.round((refThree - takeThree) * 1000),
      delta4Ms: Math.round((refFour - takeFour) * 1000),
    }
    alignedIds.push(track.id)
  }

  const nextAttention = { ...get().alignAttentionByTrackId }
  for (const id of alignedIds) {
    delete nextAttention[id]
  }
  patch({
    tracks: nextTracks,
    trackAlignDetails: nextDetails,
    alignAttentionByTrackId: nextAttention,
  })
  refreshSkewWarning()
  persistCloudTrackOffsets(alignedIds)
}

function noteAlignAttention(trackId: number, message: string) {
  patch({
    alignAttentionByTrackId: {
      ...get().alignAttentionByTrackId,
      [trackId]: message,
    },
  })
}

function alignErrorTrackId(
  error: unknown,
  fallbackId: number | null,
): number | null {
  if (
    error &&
    typeof error === 'object' &&
    'trackId' in error &&
    typeof (error as { trackId: unknown }).trackId === 'number'
  ) {
    return (error as { trackId: number }).trackId
  }
  return fallbackId
}

/** After a new take: always auto-align that take (never reshuffle others). */
async function maybeAutoAlignAfterTake(newTrackId: number): Promise<void> {
  if (!get().autoAlignEnabled) return
  if (get().tracks.length < 2) return
  if (get().referenceTrackId === newTrackId) return
  try {
    await autoAlignTracksFromCounts([newTrackId])
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : t('error.autoAlignDeferredGeneric')
    const trackId = alignErrorTrackId(error, newTrackId)
    if (trackId != null) noteAlignAttention(trackId, message)
    // Full error copy only in calage; outside, the “!” chip carries the signal.
    if (get().calageMode) {
      setError(
        error instanceof Error
          ? t('error.autoAlignDeferred', { message: error.message })
          : t('error.autoAlignDeferredGeneric'),
      )
    }
  }
}

/** Manual action: recalculate auto-align for one non-reference track. */
export async function realignTrack(trackId: number): Promise<void> {
  if (!get().autoAlignEnabled) return
  setError(null)
  try {
    await withMixTransportPreserved(() => autoAlignTracksFromCounts([trackId]))
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('error.autoAlignFailed')
    noteAlignAttention(alignErrorTrackId(error, trackId) ?? trackId, message)
    throw error instanceof Error ? error : new Error(message)
  }
}

/** Manual action: recalculate auto-align for every non-reference track. */
export async function realignAllTracks(): Promise<void> {
  if (!get().autoAlignEnabled) return
  setError(null)
  try {
    await withMixTransportPreserved(() =>
      autoAlignTracksFromCounts(alignableTracks().map((track) => track.id)),
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : t('error.autoAlignFailed')
    const trackId = alignErrorTrackId(error, null)
    if (trackId != null) noteAlignAttention(trackId, message)
    throw error instanceof Error ? error : new Error(message)
  }
}

/** Mix-timeline cut just after the reference "4", with pad (seconds). */
export async function getSkipCountInStartSec(): Promise<number | null> {
  const reference = getReferenceTrack()
  if (!reference || reference.blob.size === 0) return null

  try {
    let peaks: number[]
    if (reference.isMetronome) {
      const bpm = get().metronomeBpm ?? DEFAULT_METRONOME_BPM
      peaks = metronomeReferencePeaksSec(bpm)
    } else {
      const buffer = await decodeTrack(reference)
      peaks = findVolumePeaks(buffer, 4)
    }
    const assessment = assessCountInBeat(peaks)
    if (!assessment.ok) return null
    applyReferencePeaksLabel(reference, assessment.peaks)
    return getSkipCountInStartS({
      reference,
      peakFourSec: assessment.peaks[3]!,
      peaks: assessment.peaks,
    })
  } catch {
    return null
  }
}

/** Raise a mix start so playback begins after the count-in when enabled. */
export async function applySkipCountInStartMs(
  startAtMs: number,
): Promise<number> {
  const clamped = Math.max(0, startAtMs)
  if (!get().skipCountInPlayback || clamped > 0) {
    return clamped
  }
  const cutSec = await getSkipCountInStartSec()
  if (cutSec == null) return clamped
  return Math.max(clamped, cutSec * 1000)
}

export async function downloadSelectedMix() {
  if (get().mixExporting) return
  const selected = selectedTracks().filter(
    (track) => track.blob.size > 0 && !track.isMetronome,
  )
  if (selected.length === 0) {
    setError(t('error.exportNoTracks'))
    return
  }

  const filename = downloadFilenameForSelection(
    get().sessionTitle,
    selected,
    get().tracks.length,
    get().songWorkName,
  )

  // Pick save location first while the click gesture is still valid.
  const saveTarget = await beginSaveWithMemory(filename)
  if (saveTarget.kind === 'cancelled') return

  patch({ mixExporting: true })
  setError(null)

  try {
    const trackVolumes: Record<number, number> = {}
    for (const track of selected) {
      trackVolumes[track.id] = getTrackVolume(track.id)
    }
    let mixed = await renderSelectedMixBuffer(selected, {
      trackVolumes,
      masterVolume: clampMasterVolume(get().masterVolume),
    })
    if (get().skipCountInDownload) {
      const cutS = await getSkipCountInStartSec()
      if (cutS != null) {
        if (cutS >= mixed.duration - 0.05) {
          throw new Error(t('error.countInTooLate'))
        }
        mixed = trimAudioBufferFrom(mixed, cutS)
      }
    }
    const { encodeAudioBufferToMp3 } = await import('../mp3-encode.client')
    const mp3 = await encodeAudioBufferToMp3(mixed, 192)
    if (saveTarget.kind === 'handle') {
      await writeSaveTarget(saveTarget, mp3)
    } else {
      downloadBlobLegacy(mp3, filename)
    }
  } catch (error) {
    setError(
      error instanceof Error ? error.message : t('error.exportFailed'),
    )
  } finally {
    patch({ mixExporting: false })
  }
}

export async function playTracks(
  tracksToPlay: Track[],
  options?: {
    awaitEnd?: boolean
    asMix?: boolean
    applyOffsets?: boolean
    startAtMs?: number
    /** Override metronome length (e.g. MAX_RECORDING_MS for punch-in). */
    metroDurationMs?: number
    /**
     * When monitor buffers end, leave the graph running (metronome) instead of
     * stopPlayback — needed while a punch-in take continues past mix end.
     */
    sustainAfterBuffersEnd?: boolean
  },
): Promise<void> {
  const asMix = Boolean(options?.asMix)
  const sourceTracks = asMix ? get().tracks : tracksToPlay
  const playable = sourceTracks.filter(
    (track) => track.blob.size > 0 && !track.isMetronome,
  )
  const metroTrack = sourceTracks.find((track) => track.isMetronome)
  const metroBpm = get().metronomeBpm
  const wantMetro =
    Boolean(metroTrack) &&
    metroBpm != null &&
    (asMix || tracksToPlay.some((track) => track.isMetronome))

  if (playable.length === 0 && !wantMetro) {
    if (sourceTracks.some((track) => track.downloadPending)) {
      return Promise.reject(new Error(t('error.tracksStillLoading')))
    }
    return Promise.reject(new Error(t('error.emptyTrack')))
  }

  let startAtMs = Math.max(0, options?.startAtMs ?? 0)
  if (asMix) {
    startAtMs = await applySkipCountInStartMs(startAtMs)
  }
  stopPlayback({ resetSeek: false })
  patch({ mixSeekMs: startAtMs, mixListenActive: asMix })
  tickClockDisplays()

  const ctx = await ensureAudioContext()
  const applyOffsets = options?.applyOffsets ?? true
  trackGains.clear()

  const decoded = await Promise.all(
    playable.map(async (track) => ({
      track,
      buffer: await decodeTrack(track),
    })),
  )

  const playbackRate =
    get().cutMode ? Math.max(0.05, get().cutPlaybackRate || 1) : 1

  const gain = ctx.createGain()
  gain.gain.value = clampMasterVolume(get().masterVolume)
  setPlaybackGain(gain)
  // Await worklet load BEFORE choosing timelineStart — otherwise a slow
  // SoundTouch register pushes schedule times into the past and play is silent.
  await connectPlaybackBus(ctx, gain, ctx.destination, playbackRate)

  const timelineStart = ctx.currentTime + MIX_LOOKAHEAD_S
  mixEpochPerf =
    performance.now() + MIX_LOOKAHEAD_S * 1000 - startAtMs / playbackRate
  mixTimelineStartCtx = timelineStart - startAtMs / (1000 * playbackRate)
  setMixPausedBoth(false)
  trackPlayheads.clear()

  const bufferSources: AudioBufferSourceNode[] = []
  const allSources: AudioScheduledSourceNode[] = []
  const playing = new Set<number>()

  for (const { track, buffer } of decoded) {
    const scheduled = scheduleTrackSource(
      ctx,
      gain,
      track,
      buffer,
      timelineStart,
      applyOffsets,
      asMix || applyOffsets ? startAtMs : 0,
      {
        volume: liveTrackGainValue(track.id),
        playbackRate,
        onTrackGain: (id, trackGain) => {
          trackGains.set(id, trackGain)
        },
        onPlayhead: (id, playhead) => {
          trackPlayheads.set(id, playhead)
        },
      },
    )
    if (!scheduled) continue
    bufferSources.push(...scheduled.sources)
    allSources.push(...scheduled.sources)
    playing.add(track.id)
  }

  // Default: cap clicks at non-metronome content. Punch-in can request a
  // longer train so the click keeps going past existing takes.
  const mixEndMs = Math.max(getMixDurationMs(sourceTracks), startAtMs)
  const metroPlayMs = Math.max(
    0,
    options?.metroDurationMs ?? mixEndMs - startAtMs,
  )

  if (wantMetro && metroTrack && metroBpm != null && metroPlayMs > 0) {
    const metroGain = ctx.createGain()
    metroGain.gain.value = liveTrackGainValue(metroTrack.id)
    metroGain.connect(gain)
    trackGains.set(metroTrack.id, metroGain)
    const clicks = scheduleMetronomeClicks(ctx, metroGain, {
      bpm: metroBpm,
      timelineStart,
      startAtMs,
      durationMs: metroPlayMs,
      playbackRate,
    })
    allSources.push(...clicks)
    playing.add(metroTrack.id)
  }

  setPlaybackSources(allSources)
  syncPlayingIds(playing)
  startPlayheadClock()
  tickClockDisplays()

  const awaitEnd = options?.awaitEnd ?? true
  const sustainAfterBuffersEnd = Boolean(options?.sustainAfterBuffersEnd)
  const startDelayMs = Math.max(0, (timelineStart - ctx.currentTime) * 1000)

  return new Promise<void>((resolve) => {
    let settled = false
    let remaining = bufferSources.length

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      playWaiters = playWaiters.filter((waiter) => waiter !== resolveAsDone)
      fn()
    }

    const resolveAsDone = () => {
      finish(() => {
        stopPlayback({ resetSeek: true })
        resolve()
      })
    }

    const resolveKeepGraph = () => {
      finish(() => resolve())
    }

    if (bufferSources.length === 0) {
      if (awaitEnd && wantMetro && metroPlayMs > 0) {
        playWaiters.push(resolveAsDone)
        window.setTimeout(() => {
          resolveAsDone()
        }, startDelayMs + metroPlayMs / playbackRate)
        return
      }
      finish(() => {
        stopPlayback({ resetSeek: true })
        resolve()
      })
      return
    }

    if (awaitEnd) {
      playWaiters.push(resolveAsDone)
    }

    for (const source of bufferSources) {
      source.onended = () => {
        if (getMixPaused()) return
        remaining -= 1
        if (remaining > 0) return

        // Punch-in / overdub: keep metronome (and timeline) after monitors end.
        if (sustainAfterBuffersEnd || get().state === 'recording') {
          if (awaitEnd) resolveKeepGraph()
          return
        }

        if (awaitEnd) {
          resolveAsDone()
          return
        }

        stopPlayback({ resetSeek: true })
      }
    }

    if (!awaitEnd) {
      window.setTimeout(() => {
        finish(() => resolve())
      }, startDelayMs)
    }
  })
}

function createRecording(stream: MediaStream): ActiveRecording {
  preferMimeType = pickMimeType()
  const chunks: BlobPart[] = []

  const recorder = preferMimeType
    ? new MediaRecorder(stream, { mimeType: preferMimeType })
    : new MediaRecorder(stream)

  const onData = (event: BlobEvent) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  recorder.addEventListener('dataavailable', onData)

  return { recorder, chunks, onData }
}

function stopRecorderToBlob(recording: ActiveRecording): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { recorder, chunks, onData } = recording

    const onStop = () => {
      recorder.removeEventListener('error', onError)
      recorder.removeEventListener('dataavailable', onData)
      const type = recorder.mimeType || preferMimeType || 'audio/webm'
      resolve(new Blob(chunks, { type }))
    }
    const onError = () => {
      recorder.removeEventListener('stop', onStop)
      recorder.removeEventListener('dataavailable', onData)
      reject(new Error(t('error.recordFailed')))
    }

    recorder.addEventListener('stop', onStop, { once: true })
    recorder.addEventListener('error', onError, { once: true })

    try {
      recorder.stop()
    } catch (error) {
      recorder.removeEventListener('stop', onStop)
      recorder.removeEventListener('error', onError)
      recorder.removeEventListener('dataavailable', onData)
      reject(
        error instanceof Error
          ? error
          : new Error(t('error.recordFailed')),
      )
    }
  })
}

export async function beginRecording(options?: {
  offsetMs?: number
  timerFromPerf?: number
}) {
  setError(null)
  discardPendingRecording()
  const { stream, inputOverrideNote } = await ensureMic()
  patch({ inputOverrideNote })
  const recording = createRecording(stream)

  setActiveRecording(recording)
  recording.recorder.start()
  pendingTakeOffsetMs = options?.offsetMs ?? 0
  pendingTakePunchIn = false
  pendingTakeRestartMs = pendingTakeOffsetMs

  await startMeter(stream, (level) => patch({ meterLevel: level }))
  startTimer(options?.timerFromPerf ?? performance.now())
  setTransportState('recording')
  void applyAudioSink('monitor')
}

/**
 * Start monitor playback and the next take on the same mix timeline.
 * The recorder starts at mix t0 (not earlier) to avoid pre-roll / chunk bleed.
 */
export async function beginOverdubRecording(monitor: Track[]): Promise<void> {
  setError(null)
  discardPendingRecording()
  const { stream, inputOverrideNote } = await ensureMic()
  patch({ inputOverrideNote })
  const recording = createRecording(stream)
  const ctx = await ensureAudioContext()
  await applyAudioSink('monitor')

  const monitorAudio = monitor.filter((track) => !track.isMetronome)
  const metroTrack = monitor.find((track) => track.isMetronome)
  const metroBpm = get().metronomeBpm

  const decoded =
    monitorAudio.length > 0
      ? await Promise.all(
          monitorAudio.map(async (track) => ({
            track,
            buffer: await decodeTrack(track),
          })),
        )
      : []

  stopPlayback()

  if (decoded.length === 0 && !(metroTrack && metroBpm != null)) {
    setActiveRecording(recording)
    recording.recorder.start()
    pendingTakeOffsetMs = 0
    pendingTakePunchIn = false
    pendingTakeRestartMs = 0
    mixEpochPerf = null
    await startMeter(stream, (level) => patch({ meterLevel: level }))
    startTimer()
    setTransportState('recording')
    return
  }

  // Refresh reported latency for UI after getMonitorLatencySec.
  const latencySec = getMonitorLatencySec(ctx)
  syncLatencyDisplay()
  const lookaheadSec = Math.max(MIX_LOOKAHEAD_S, latencySec + 0.06)
  const timelineStart = ctx.currentTime + lookaheadSec
  const monitorStart = timelineStart - latencySec

  mixEpochPerf = performance.now() + lookaheadSec * 1000
  mixTimelineStartCtx = timelineStart
  setMixPausedBoth(false)
  trackPlayheads.clear()
  trackGains.clear()

  const gain = ctx.createGain()
  gain.gain.value = clampMasterVolume(get().masterVolume)
  gain.connect(ctx.destination)
  setPlaybackGain(gain)

  const bufferSources: AudioBufferSourceNode[] = []
  const allSources: AudioScheduledSourceNode[] = []
  const playing = new Set<number>()

  for (const { track, buffer } of decoded) {
    const scheduled = scheduleTrackSource(
      ctx,
      gain,
      track,
      buffer,
      monitorStart,
      true,
      0,
      {
        volume: liveTrackGainValue(track.id),
        onTrackGain: (id, trackGain) => {
          trackGains.set(id, trackGain)
        },
        onPlayhead: (id, playhead) => {
          trackPlayheads.set(id, playhead)
        },
      },
    )
    if (!scheduled) continue
    bufferSources.push(...scheduled.sources)
    allSources.push(...scheduled.sources)
    playing.add(track.id)
  }

  if (metroTrack && metroBpm != null) {
    const metroGain = ctx.createGain()
    metroGain.gain.value = liveTrackGainValue(metroTrack.id)
    metroGain.connect(gain)
    trackGains.set(metroTrack.id, metroGain)
    const clicks = scheduleMetronomeClicks(ctx, metroGain, {
      bpm: metroBpm,
      timelineStart: monitorStart,
      startAtMs: 0,
      durationMs: MAX_RECORDING_MS,
    })
    allSources.push(...clicks)
    playing.add(metroTrack.id)
  }

  setPlaybackSources(allSources)
  syncPlayingIds(playing)

  let remainingMonitor = bufferSources.length
  for (const source of bufferSources) {
    source.onended = () => {
      remainingMonitor -= 1
      if (remainingMonitor > 0) return
      // Keep metronome clicks while the take continues past monitor end.
      if (metroTrack && metroBpm != null) return
      stopPlayheadClock()
      clearPlayingIds()
      setPlaybackSources([])
      trackPlayheads.clear()
      mixTimelineStartCtx = null
      try {
        getPlaybackGain()?.disconnect()
      } catch {
        // already disconnected
      }
      setPlaybackGain(null)
      setMixPausedBoth(false)
      const audioContext = getAudioContext()
      if (audioContext?.state === 'suspended') {
        void audioContext.resume()
      }
      patch({ mixClockText: '00:00.000' })
    }
  }

  startPlayheadClock()

  const armDelayMs = Math.max(0, (timelineStart - ctx.currentTime) * 1000)
  await startMeter(stream, (level) => patch({ meterLevel: level }))
  startTimer(mixEpochPerf)
  setTransportState('recording')

  setPendingRecording(recording)
  await new Promise<void>((resolve, reject) => {
    setOverdubArmTimer(
      window.setTimeout(() => {
        setOverdubArmTimer(null)
        try {
          if (getPendingRecording() !== recording) {
            resolve()
            return
          }
          setPendingRecording(null)
          setActiveRecording(recording)
          recording.recorder.start()
          const recordPerf = performance.now()
          pendingTakeOffsetMs =
            mixEpochPerf !== null ? recordPerf - mixEpochPerf : 0
          pendingTakePunchIn = false
          pendingTakeRestartMs = 0
          resolve()
        } catch (error) {
          setPendingRecording(null)
          reject(
            error instanceof Error
              ? error
              : new Error(t('error.recordStart')),
          )
        }
      }, armDelayMs),
    )
  })
}

export async function finalizeCurrentTake(): Promise<Track> {
  const active = getActiveRecording()
  if (!active || active.recorder.state === 'inactive') {
    throw new Error(t('error.noActiveRecording'))
  }

  const durationMs = stopTimer()
  setActiveRecording(null)
  const offsetMs = pendingTakeOffsetMs
  const punchIn = pendingTakePunchIn
  pendingTakeOffsetMs = 0
  pendingTakePunchIn = false
  pendingTakeRestartMs = 0

  const blob = await stopRecorderToBlob(active)
  stopMeterNodes()
  patch({ meterLevel: 0 })

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })

  if (blob.size === 0) {
    throw new Error(t('error.noAudioData'))
  }

  const track = await appendTrackFromBlob(blob, {
    durationMs,
    offsetMs,
    punchIn,
  })
  if (punchIn || offsetMs > PUNCH_IN_POSITION_MS) {
    armSimpleContentSyncOffer()
  }
  return track
}

/** Shared path: mic take or imported file → session track + cloud hook. */
async function appendTrackFromBlob(
  blob: Blob,
  options: {
    durationMs: number
    offsetMs?: number
    name?: string
    fromCutMerge?: boolean
    punchIn?: boolean
  },
): Promise<Track> {
  const trackCounter = get().trackCounter + 1
  const tracks = get().tracks
  const takeIndex =
    tracks.filter((track) => !track.isMetronome).length + 1
  const track: Track = {
    id: trackCounter,
    name: options.name ?? defaultTrackName(takeIndex),
    blob,
    url: URL.createObjectURL(blob),
    durationMs: options.durationMs,
    offsetMs: options.offsetMs ?? 0,
    cloudStatus: 'local',
    ...(options.fromCutMerge ? { fromCutMerge: true } : {}),
    ...(options.punchIn ? { punchIn: true } : {}),
  }

  const becameReference = get().referenceTrackId == null
  const enabledTrackIds = [...get().enabledTrackIds, track.id]
  let referenceTrackId = get().referenceTrackId

  if (becameReference) {
    referenceTrackId = track.id
  }

  patch({
    trackCounter,
    tracks: [...tracks, track],
    enabledTrackIds,
    referenceTrackId,
    trackVolumes: { ...get().trackVolumes, [track.id]: 1 },
  })
  updateSessionTimerDisplay()

  if (becameReference || track.id === referenceTrackId) {
    await evaluateReferenceBeat()
  }
  // Punch-ins have no 3–4 count-in — skip beat auto-align.
  if (!options.punchIn) {
    await maybeAutoAlignAfterTake(track.id)
  }
  void import('./cloudUpload.client').then((mod) =>
    mod.maybeAutoUploadTrack(track.id),
  )
  scheduleGuestDraftSave()
  markPwaUsefulSession()
  void refreshTrackClipFlags([track.id])
  return track
}

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
  scheduleGuestDraftSave()
}

/** Rebuild metronome from a persisted BPM (cloud open / hydrate). No cloud write. */
export async function hydrateMetronomeFromBpm(
  bpm: number | null,
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
      trackVolumes: { ...get().trackVolumes, [track.id]: 1 },
    })
  }
}

function isAudioImportFile(file: File): boolean {
  if (file.type.startsWith('audio/')) return true
  return /\.(mp3|wav|ogg|m4a|aac|flac|webm|mp4|aiff?)$/i.test(file.name)
}

async function measureBlobDurationMs(blob: Blob): Promise<number> {
  // Offline decode: file-picker `change` is outside the user-gesture window, so a
  // live AudioContext cannot be resumed (Chrome autoplay policy).
  const copy = await blob.arrayBuffer()
  const offline = new OfflineAudioContext(1, 1, 44100)
  const buffer = await offline.decodeAudioData(copy.slice(0))
  return Math.round(buffer.duration * 1000)
}

/**
 * Import one or more audio files from the device as tracks (same blob pipeline
 * as a mic take). No-op while recording. Local-only in consultation (no cloud).
 */
export async function importAudioFiles(
  files: ArrayLike<File> | File[],
): Promise<void> {
  if (get().state === 'recording') return

  const list = Array.from(files).filter(isAudioImportFile)
  if (list.length === 0) {
    setError(t('error.importNoAudio'))
    return
  }

  // First track via import (not mic): hide calage warnings for this session.
  if (get().tracks.length === 0 && get().showCalageWarnings) {
    patch({ showCalageWarnings: false })
    refreshSkewWarning()
  }

  stopPlayback()

  try {
    for (const file of list) {
      const blob =
        file.type && file.type.startsWith('audio/')
          ? file
          : new Blob([file], { type: guessAudioMime(file.name) })

      if (blob.size === 0) {
        throw new Error(t('error.importNoAudio'))
      }

      let durationMs: number
      try {
        durationMs = await measureBlobDurationMs(blob)
      } catch {
        throw new Error(t('error.importDecodeFailed'))
      }

      if (durationMs < 100) {
        throw new Error(t('error.importNoAudio'))
      }
      if (durationMs > MAX_RECORDING_MS) {
        throw new Error(t('error.importTooLong'))
      }

      const name = await resolveImportTrackName(file)
      await appendTrackFromBlob(blob, { durationMs, offsetMs: 0, name })
    }
    setError(null)
  } catch (error) {
    setError(
      error instanceof Error ? error.message : t('error.importFailed'),
    )
  }
}

function guessAudioMime(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.mp3')) return 'audio/mpeg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  if (lower.endsWith('.ogg')) return 'audio/ogg'
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4'
  if (lower.endsWith('.aac')) return 'audio/aac'
  if (lower.endsWith('.flac')) return 'audio/flac'
  if (lower.endsWith('.webm')) return 'audio/webm'
  if (lower.endsWith('.aif') || lower.endsWith('.aiff')) return 'audio/aiff'
  return 'audio/mpeg'
}

export async function abortCurrentTake(options?: {
  seekToMs?: number
}): Promise<void> {
  const seekToMs = Math.max(0, options?.seekToMs ?? 0)
  discardPendingRecording()
  stopPlayback({ resetSeek: false })
  stopMeterNodes()
  patch({ meterLevel: 0 })
  stopTimer()
  pendingTakeOffsetMs = 0
  pendingTakePunchIn = false
  pendingTakeRestartMs = 0
  patch({ mixSeekMs: seekToMs, mixClockText: formatCentis(seekToMs) })

  const recording = getActiveRecording()
  setActiveRecording(null)
  if (!recording || recording.recorder.state === 'inactive') return

  try {
    await stopRecorderToBlob(recording)
  } catch {
    // Discarded take — ignore stop errors.
  }
}

/** Throw away the in-progress take and restart from where it began. */
export async function discard() {
  if (get().state !== 'recording') return

  try {
    const restartAtMs = pendingTakeRestartMs
    const restartPunchIn =
      pendingTakePunchIn || restartAtMs > PUNCH_IN_POSITION_MS
    await abortCurrentTake({ seekToMs: restartAtMs })
    if (restartPunchIn && get().tracks.length > 0) {
      await beginPunchInRecording()
    } else if (get().tracks.length > 0) {
      await beginOverdubRecording(get().tracks.slice())
    } else {
      await beginRecording({ offsetMs: 0 })
    }
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : t('error.discardFailed'),
    )
    stopMeterNodes()
    stopTimer()
    setTransportState('idle')
  }
}

/** Mid-mix punch-in: keep/resume monitoring and arm the mic at the current playhead. */
export async function beginPunchInRecording(): Promise<void> {
  setError(null)
  discardPendingRecording()
  const { stream, inputOverrideNote } = await ensureMic()
  patch({ inputOverrideNote })
  const ctx = await ensureAudioContext()
  await applyAudioSink('monitor')

  const { mixPaused, playingTrackIds, mixSeekMs, tracks } = get()
  const hasPlayback =
    getPlaybackSources().length > 0 || playingTrackIds.length > 0
  const activelyPlaying = hasPlayback && !mixPaused

  if (!activelyPlaying) {
    const startAtMs = Math.max(0, getMixPositionMs() || mixSeekMs)
    if (tracks.length === 0) {
      await beginRecording({ offsetMs: 0 })
      return
    }
    // Fire monitoring from the paused/idle playhead, then arm the mic.
    // Metronome must outlive existing takes (user may record past mix end).
    void playTracks(tracks, {
      awaitEnd: true,
      asMix: true,
      applyOffsets: true,
      startAtMs,
      metroDurationMs: MAX_RECORDING_MS,
      sustainAfterBuffersEnd: true,
    }).catch((error) => {
      setError(
        error instanceof Error ? error.message : t('error.playbackFailed'),
      )
    })
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, Math.round(MIX_LOOKAHEAD_S * 1000) + 30)
    })
  } else {
    // Already listening: extend the click train past the current mix end.
    extendMetronomeForRecording()
  }

  const recording = createRecording(stream)
  const latencySec = getMonitorLatencySec(ctx)
  syncLatencyDisplay()

  setActiveRecording(recording)
  recording.recorder.start()
  const posAtStart = getMixPositionMs()
  pendingTakeOffsetMs = Math.max(0, posAtStart - latencySec * 1000)
  pendingTakePunchIn = true
  pendingTakeRestartMs = Math.max(0, posAtStart)

  // Mark recording before awaiting meter setup so playTracks onended (mix end)
  // keeps the metronome instead of tearing the graph down mid-punch-in.
  startTimer(performance.now())
  setTransportState('recording')
  await startMeter(stream, (level) => patch({ meterLevel: level }))
}

/**
 * Schedule extra metronome clicks from the end of current mix content so a
 * punch-in take keeps hearing the click after existing tracks finish.
 */
function extendMetronomeForRecording(): void {
  const metroTrack = get().tracks.find((track) => track.isMetronome)
  const bpm = get().metronomeBpm
  const ctx = getAudioContext()
  const master = getPlaybackGain()
  if (
    !metroTrack ||
    bpm == null ||
    !ctx ||
    !master ||
    mixTimelineStartCtx == null
  ) {
    return
  }

  const playbackRate =
    get().cutMode ? Math.max(0.05, get().cutPlaybackRate || 1) : 1
  const fromMs = Math.max(getMixDurationMs(get().tracks), getMixPositionMs())
  let metroGain = trackGains.get(metroTrack.id)
  if (!metroGain) {
    metroGain = ctx.createGain()
    metroGain.gain.value = liveTrackGainValue(metroTrack.id)
    metroGain.connect(master)
    trackGains.set(metroTrack.id, metroGain)
  }

  const clicks = scheduleMetronomeClicks(ctx, metroGain, {
    bpm,
    timelineStart: mixTimelineStartCtx + fromMs / (1000 * playbackRate),
    startAtMs: fromMs,
    durationMs: MAX_RECORDING_MS,
    playbackRate,
  })
  if (clicks.length === 0) return
  setPlaybackSources([...getPlaybackSources(), ...clicks])
  const playing = new Set(get().playingTrackIds)
  playing.add(metroTrack.id)
  syncPlayingIds(playing)
}

function shouldPunchInFromMixPosition(): boolean {
  const { playingTrackIds, mixSeekMs, tracks } = get()
  if (tracks.length === 0) return false
  const hasPlayback =
    getPlaybackSources().length > 0 || playingTrackIds.length > 0
  const positionMs = hasPlayback ? getMixPositionMs() : mixSeekMs
  if (positionMs <= PUNCH_IN_POSITION_MS) return false
  // Active play or paused / seeked mid-mix.
  return hasPlayback || mixSeekMs > PUNCH_IN_POSITION_MS
}

export async function startSession() {
  try {
    if (shouldPunchInFromMixPosition()) {
      await beginPunchInRecording()
      return
    }
    stopPlayback()
    pendingTakeOffsetMs = 0
    pendingTakePunchIn = false
    pendingTakeRestartMs = 0
    if (get().tracks.length > 0) {
      await beginOverdubRecording(get().tracks.slice())
    } else {
      await beginRecording({ offsetMs: 0 })
    }
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : t('error.micAccess'),
    )
    setTransportState('idle')
  }
}

export async function nextTrack() {
  if (get().state !== 'recording') return

  try {
    stopPlayback()
    await finalizeCurrentTake()
    await beginOverdubRecording(get().tracks.slice())
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : t('error.nextTrackFailed'),
    )
    stopMeterNodes()
    stopTimer()
    setTransportState('idle')
  }
}

export async function stopSession() {
  if (get().sessionStopping) return
  patch({ sessionStopping: true })
  discardPendingRecording()
  stopPlayback({ resetSeek: true })

  const startedAt = getStartedAt()
  const elapsedMs = startedAt > 0 ? performance.now() - startedAt : 0
  const keepTake = elapsedMs >= 1000
  const shouldAutoplay = get().autoplayAfterStop
  let newTrack: Track | null = null

  try {
    const active = getActiveRecording()
    if (active && active.recorder.state !== 'inactive') {
      if (keepTake) {
        newTrack = await finalizeCurrentTake()
      } else {
        setActiveRecording(null)
        pendingTakeOffsetMs = 0
        pendingTakePunchIn = false
        pendingTakeRestartMs = 0
        stopTimer()
        try {
          await stopRecorderToBlob(active)
        } catch {
          // Too short to keep — discard quietly.
        }
      }
    }
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : t('error.stopFailed'),
    )
  } finally {
    stopMeterNodes()
    patch({ meterLevel: 0 })
    const timerId = getTimerId()
    if (timerId !== null) {
      window.clearInterval(timerId)
      setTimerId(null)
    }
    releaseMic()
    setActiveRecording(null)
    await closeAudioContext()
    setStartedAt(0)
    setTransportState('idle')
    // Punch-in: leave the playhead at the new take, not mix t=0.
    const resumeMs =
      newTrack &&
      (newTrack.punchIn || newTrack.offsetMs > PUNCH_IN_POSITION_MS)
        ? audibleMixRange(newTrack).startMs
        : 0
    patch({
      mixSeekMs: resumeMs,
      mixClockText: formatCentis(resumeMs),
      sessionStopping: false,
      hint: '',
      ...(keepTake &&
      get().tracks.length > 0 &&
      !isCloudSignedIn() &&
      !isGuestSignInPromptDismissed()
        ? { guestSignInPrompt: true }
        : {}),
    })
    updateSessionTimerDisplay()
  }

  if (
    shouldAutoplay &&
    get().tracks.some((track) => !track.isMetronome)
  ) {
    setError(null)
    const startAtMs =
      newTrack &&
      (newTrack.punchIn || newTrack.offsetMs > PUNCH_IN_POSITION_MS)
        ? audibleMixRange(newTrack).startMs
        : 0
    void playTracks(get().tracks, {
      awaitEnd: true,
      asMix: true,
      applyOffsets: true,
      startAtMs,
    }).catch((error) => {
      setError(error instanceof Error ? error.message : t('error.playbackFailed'))
    })
  }
}

export async function seekMixTo(ms: number) {
  const { tracks, state, mixPaused, playingTrackIds, cutMode } = get()
  if (tracks.length === 0 || state === 'recording') return

  const duration = getMixDurationMs(tracks)
  const target = Math.max(0, Math.min(duration, ms))

  // In découpage, scrubbing only moves the playhead unless mix playback
  // is actively running (paused or idle must not restart audio).
  const activelyPlaying =
    !mixPaused &&
    (getPlaybackSources().length > 0 || playingTrackIds.length > 0)
  if (cutMode && !activelyPlaying) {
    // Realign a paused/frozen timeline so clock ticks keep the scrubbed spot
    // (otherwise tickClockDisplays would snap back via getMixPositionMs).
    const audioContext = getAudioContext()
    const rate = Math.max(0.05, get().cutPlaybackRate || 1)
    if (audioContext && mixTimelineStartCtx !== null) {
      mixTimelineStartCtx = audioContext.currentTime - target / (1000 * rate)
    }
    patch({ mixSeekMs: target, mixClockText: formatCentis(target) })
    return
  }

  patch({ mixSeekMs: target })
  tickClockDisplays()

  const wasPaused = mixPaused && playingTrackIds.length > 0

  try {
    setError(null)
    await playTracks(tracks, {
      awaitEnd: true,
      asMix: true,
      applyOffsets: true,
      startAtMs: target,
    })
    const audioContext = getAudioContext()
    if (wasPaused && audioContext) {
      await audioContext.suspend()
      setMixPausedBoth(true)
      tickClockDisplays()
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : t('error.playbackFailed'))
  }
}

export async function toggleMixPlayPause() {
  const { tracks, mixPaused, playingTrackIds, mixSeekMs } = get()
  const audioContext = getAudioContext()
  const hasPlayback =
    getPlaybackSources().length > 0 || playingTrackIds.length > 0

  if (hasPlayback && audioContext) {
    try {
      if (audioContext.state === 'running' && !mixPaused) {
        await audioContext.suspend()
        setMixPausedBoth(true)
        tickClockDisplays()
        return
      }
      if (audioContext.state === 'suspended' || mixPaused) {
        await audioContext.resume()
        setMixPausedBoth(false)
        tickClockDisplays()
        return
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : t('error.pauseFailed'),
      )
      return
    }
  }

  if (tracks.length === 0) return
  setError(null)
  const duration = getMixDurationMs(tracks)
  const startAtMs =
    duration > 0 && mixSeekMs >= Math.max(0, duration - 30) ? 0 : mixSeekMs
  void playTracks(tracks, {
    awaitEnd: true,
    asMix: true,
    applyOffsets: true,
    startAtMs,
  }).catch((error) => {
    setError(error instanceof Error ? error.message : t('error.playbackFailed'))
  })
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
    clearContentSyncInviteTimer()
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

/** Wipe the local deck and cloud session context (blank recording screen). */
export function clearLocalDeckSession(): void {
  cloudOpenGeneration += 1
  if (get().state === 'recording') {
    discardPendingRecording()
    const recording = getActiveRecording()
    setActiveRecording(null)
    if (recording && recording.recorder.state !== 'inactive') {
      try {
        recording.recorder.ondataavailable = null
        recording.recorder.onstop = null
        recording.recorder.stop()
      } catch {
        // Discarded take — ignore stop errors.
      }
    }
    stopTimer()
    stopMeterNodes()
    patch({ meterLevel: 0 })
    setTransportState('idle')
  }

  stopPlayback({ resetSeek: true })
  writeActiveSongPartId(null)
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()
  clearTrackPeakCache()
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
    activeSongPartId: null,
    deckSongPartId: null,
    deckSongPartSiblings: [],
    deckSongId: null,
    readOnlySession: false,
    canCloudContribute: false,
    songAllowsCollaboration: false,
    deckLibraryPath: null,
    songWorkName: null,
    songIsPublic: false,
    sharedOwnerLabel: null,
    sessionTitle: defaultSessionTitle(),
    calageMode: false,
    mixMode: false,
    cutMode: false,
    cutPhase: 'idle',
    cutSelectedTrackIds: [],
    cutWorkSegments: {},
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    error: null,
    notice: null,
    noticeSuppressedId: null,
    referenceBeatDismissedKey: '',
    hint: '',
    guestSignInPrompt: false,
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  void import('./cloudUpload.client').then((mod) => {
    void mod.ensurePendingDeckLibraryPath()
  })
}

/** Drop cloud song context and all loaded takes (e.g. on sign-out). */
export function resetDeckOnSignOut() {
  clearLocalDeckSession()
}

/** Replace the deck with tracks loaded from a cloud song part (session). */
let cloudOpenGeneration = 0

function finalizeDownloadedTrack(
  trackId: number,
  blob: Blob,
  generation: number,
) {
  if (generation !== cloudOpenGeneration) {
    return
  }
  const prev = get().tracks.find((t) => t.id === trackId)
  if (!prev?.downloadPending) return
  URL.revokeObjectURL(prev.url)
  clearBufferCache(trackId)
  const url = URL.createObjectURL(blob)
  patch({
    tracks: get().tracks.map((t) =>
      t.id === trackId
        ? {
            ...t,
            blob,
            url,
            downloadPending: undefined,
            downloadProgress: undefined,
            cloudStatus: 'synced' as const,
          }
        : t,
    ),
  })
  updateSessionTimerDisplay()
  void refreshTrackClipFlags()
  if (get().referenceTrackId === trackId) void evaluateReferenceBeat()
}

function patchTrackDownloadProgress(
  trackId: number,
  ratio: number,
  generation: number,
) {
  if (generation !== cloudOpenGeneration) return
  const clamped = Math.max(0, Math.min(1, ratio))
  patch({
    tracks: get().tracks.map((t) =>
      t.id === trackId && t.downloadPending
        ? { ...t, downloadProgress: clamped }
        : t,
    ),
  })
}

export async function loadCloudSongIntoSession(
  songPartId: string,
  options?: { quiet?: boolean; force?: boolean },
): Promise<boolean> {
  if (get().state === 'recording') return false

  // After a local take uploads, we navigate to /session/:id while the deck
  // already holds the audio. Don't wipe it into empty download stubs.
  const current = get()
  if (
    !options?.force &&
    current.deckSongPartId === songPartId &&
    current.tracks.some(
      (t) => !t.isMetronome && t.blob.size > 0 && !t.downloadPending,
    )
  ) {
    return true
  }

  const generation = ++cloudOpenGeneration
  const { fetchAndHydrateSong, fetchRemoteTrackBlob, writeActiveSongPartId } =
    await import('./cloudUpload.client')
  const opened = await fetchAndHydrateSong(songPartId, options)
  if (!opened || generation !== cloudOpenGeneration) return false

  stopPlayback({ resetSeek: true })
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()
  clearTrackPeakCache()

  const empty = new Blob([], { type: 'audio/webm' })
  const tracks: Track[] = []
  const trackVolumes: Record<number, number> = {}
  const enabledTrackIds: number[] = []
  const downloadJobs: Array<{ localId: number; url: string }> = []

  let counter = 0
  for (const remote of opened.remoteTracks) {
    counter += 1
    const stubUrl = URL.createObjectURL(empty)
    tracks.push({
      id: counter,
      name: remote.name,
      blob: empty,
      url: stubUrl,
      durationMs: remote.durationMs,
      offsetMs: remote.offsetMs,
      muteRanges:
        Array.isArray(remote.muteRanges) && remote.muteRanges.length > 0
          ? remote.muteRanges
          : undefined,
      cloudStatus: 'synced',
      cloudTrackId: remote.id,
      cloudOwnedByMe: Boolean(remote.uploadedByMe),
      uploadedByPseudo: remote.uploadedByPseudo,
      downloadPending: true,
      downloadProgress: 0,
    })
    const vol = Number(remote.volume)
    trackVolumes[counter] = Number.isFinite(vol)
      ? Math.min(1.5, Math.max(0, vol))
      : 1
    if (!remote.muted) enabledTrackIds.push(counter)
    downloadJobs.push({ localId: counter, url: remote.url })
  }

  const readOnly = !opened.isOwner
  const canCloudContribute = opened.canCollaborate
  if (opened.isOwner || canCloudContribute) {
    writeActiveSongPartId(opened.part.id)
  }

  const deckLibraryPath =
    opened.song.ownerPseudo && opened.song.groupId
      ? {
          ownerPseudo: opened.song.ownerPseudo,
          groupId: opened.song.groupId,
          groupName: opened.song.groupName,
          repertoireId: opened.song.repertoireId,
          repertoireName: opened.song.repertoireName,
          songId: opened.song.id,
          songName: opened.song.name,
        }
      : null
  const songWorkName = opened.song.name
  const sharedOwnerLabel = readOnly
    ? formatPseudoHandle(opened.song.ownerPseudo)
    : null

  patch({
    tracks,
    trackCounter: tracks.length,
    enabledTrackIds,
    playingTrackIds: [],
    highlightedTrackIds: [],
    referenceTrackId: tracks[0]?.id ?? null,
    trackAlignDetails: {},
    alignAttentionByTrackId: {},
    trackClipById: {},
    mixPeakAtUnityMaster: null,
    mixClipWarning: false,
    trackVolumes,
    masterVolume: opened.part.masterVolume,
    autoAlignEnabled: opened.part.autoAlignEnabled,
    showCalageWarnings: opened.part.showCalageWarnings,
    skipCountInPlayback: opened.part.skipCountInPlayback,
    skipCountInDownload: opened.part.skipCountInDownload,
    metronomeBpm: opened.part.metronomeBpm,
    sessionTitle: opened.part.name ?? '',
    activeSongPartId:
      opened.isOwner || canCloudContribute ? opened.part.id : null,
    deckSongPartId: opened.part.id,
    deckSongPartSiblings: opened.siblings,
    deckSongId: opened.song.id,
    readOnlySession: readOnly,
    canCloudContribute,
    songAllowsCollaboration: Boolean(opened.song.allowsCollaboration),
    deckLibraryPath,
    songWorkName,
    songIsPublic: Boolean(opened.song.isPublic),
    sharedOwnerLabel,
    calageMode: false,
    mixMode: readOnly && !canCloudContribute,
    cutMode: false,
    cutPhase: 'idle',
    cutSelectedTrackIds: [],
    cutWorkSegments: {},
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    error: null,
    notice: null,
    noticeSuppressedId: null,
    ...(readOnly
      ? {
          referenceBeatDismissedKey: '',
          skewWarningDismissedKey: '',
        }
      : {}),
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  if (opened.part.metronomeBpm != null) {
    await hydrateMetronomeFromBpm(opened.part.metronomeBpm)
  }

  // Download audio in parallel; deck UI is already showing stubs.
  void Promise.all(
    downloadJobs.map(async ({ localId, url }) => {
      try {
        const blob = await fetchRemoteTrackBlob(url, (ratio) => {
          patchTrackDownloadProgress(localId, ratio, generation)
        })
        finalizeDownloadedTrack(localId, blob, generation)
      } catch {
        if (generation !== cloudOpenGeneration) return
        // Keep the row but clear the busy bar so the user can retry / leave.
        patch({
          tracks: get().tracks.map((t) =>
            t.id === localId && t.downloadPending
              ? {
                  ...t,
                  downloadPending: undefined,
                  downloadProgress: undefined,
                  cloudStatus: 'error' as const,
                }
              : t,
          ),
        })
        if (!options?.quiet) {
          setError(t('cloud.error.openFailed'))
        }
      }
    }),
  )

  return generation === cloudOpenGeneration
}

/**
 * After a library mutation on a song (public / collab / …), refresh deck
 * metadata without re-downloading audio (avoids wiping local blobs).
 */
export async function refreshOpenDeckForSong(songId: string): Promise<void> {
  const { deckSongId, deckSongPartId, state } = get()
  if (!songId || deckSongId !== songId || !deckSongPartId) return
  if (state === 'recording') return
  const { fetchAndHydrateSong, writeActiveSongPartId } = await import(
    './cloudUpload.client'
  )
  const opened = await fetchAndHydrateSong(deckSongPartId, { quiet: true })
  if (!opened || get().deckSongPartId !== deckSongPartId) return

  const readOnly = !opened.isOwner
  const canCloudContribute = opened.canCollaborate
  if (opened.isOwner || canCloudContribute) {
    writeActiveSongPartId(opened.part.id)
  }

  const deckLibraryPath =
    opened.song.ownerPseudo && opened.song.groupId
      ? {
          ownerPseudo: opened.song.ownerPseudo,
          groupId: opened.song.groupId,
          groupName: opened.song.groupName,
          repertoireId: opened.song.repertoireId,
          repertoireName: opened.song.repertoireName,
          songId: opened.song.id,
          songName: opened.song.name,
        }
      : get().deckLibraryPath

  patch({
    masterVolume: opened.part.masterVolume,
    autoAlignEnabled: opened.part.autoAlignEnabled,
    showCalageWarnings: opened.part.showCalageWarnings,
    skipCountInPlayback: opened.part.skipCountInPlayback,
    skipCountInDownload: opened.part.skipCountInDownload,
    metronomeBpm: opened.part.metronomeBpm,
    sessionTitle: opened.part.name ?? '',
    activeSongPartId:
      opened.isOwner || canCloudContribute ? opened.part.id : null,
    deckSongPartId: opened.part.id,
    deckSongPartSiblings: opened.siblings,
    deckSongId: opened.song.id,
    readOnlySession: readOnly,
    canCloudContribute,
    songAllowsCollaboration: Boolean(opened.song.allowsCollaboration),
    deckLibraryPath,
    songWorkName: opened.song.name,
    songIsPublic: Boolean(opened.song.isPublic),
    sharedOwnerLabel: readOnly
      ? formatPseudoHandle(opened.song.ownerPseudo)
      : null,
  })
}

/** Home path for the current deck: `/session/:id` when a cloud session is loaded. */
export function getDeckHomePath(): string {
  const id = get().deckSongPartId
  return id ? librarySessionPath(id) : '/'
}

/**
 * If a cloud song part is the upload target but not loaded on the deck yet,
 * hydrate it (e.g. after refresh or closing the library).
 * Stale ids (deleted part, empty library) are cleared quietly.
 */
export async function hydrateActiveSongIfNeeded(): Promise<void> {
  const {
    activeSongPartId,
    deckSongPartId,
    state,
    readOnlySession,
    canCloudContribute,
  } = get()
  if (
    (readOnlySession && !canCloudContribute) ||
    !activeSongPartId ||
    activeSongPartId === deckSongPartId ||
    state === 'recording'
  ) {
    return
  }
  const ok = await loadCloudSongIntoSession(activeSongPartId, { quiet: true })
  if (!ok) {
    writeActiveSongPartId(null)
    patch({
      activeSongPartId: null,
      deckSongPartId: null,
      deckSongPartSiblings: [],
      deckSongId: null,
      canCloudContribute: false,
      deckLibraryPath: null,
      songWorkName: null,
      songIsPublic: false,
      error: null,
    })
  }
}

/**
 * When the browser comes back online: clear offline open errors, upload any
 * local takes (signed-in + auto-cloud), and reload a session that has no
 * playable audio yet (failed open / failed downloads).
 */
let resumeOnlineInFlight: Promise<boolean> | null = null

export async function resumeAfterNetworkOnline(
  options?: { songPartId?: string | null },
): Promise<boolean> {
  if (resumeOnlineInFlight) return resumeOnlineInFlight
  resumeOnlineInFlight = resumeAfterNetworkOnlineImpl(options).finally(() => {
    resumeOnlineInFlight = null
  })
  return resumeOnlineInFlight
}

async function resumeAfterNetworkOnlineImpl(
  options?: { songPartId?: string | null },
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false
  }
  if (get().state === 'recording') return false

  const offlineOpen = t('cloud.error.openOffline')
  if (get().error === offlineOpen) setError(null)

  const cloud = await import('./cloudUpload.client')
  if (cloud.isCloudSignedIn()) {
    await cloud.ensurePendingDeckLibraryPath()
    if (get().autoCloudSave) {
      await cloud.uploadAllLocalTracks()
    }
  }

  const partId = options?.songPartId ?? get().deckSongPartId
  if (!partId) return true

  const hasPlayable = get().tracks.some(
    (track) =>
      !track.isMetronome && track.blob.size > 0 && !track.downloadPending,
  )
  // Failed open / empty stubs only — never wipe local audio that already plays.
  if (!hasPlayable) {
    return loadCloudSongIntoSession(partId, { force: true, quiet: true })
  }
  return true
}


export function normalizeAndSetSessionTitle(raw: string) {
  const songPartId = get().activeSongPartId
  // Cloud sessions may be unnamed (null); local guest titles keep the default.
  const name =
    songPartId && !get().readOnlySession
      ? raw.replace(/\s+/g, ' ').trim().slice(0, LIBRARY_TITLE_MAX_LEN)
      : normalizeSessionTitle(raw)
  patch({ sessionTitle: name })
  scheduleGuestDraftSave()

  if (get().readOnlySession) return
  if (!songPartId) return

  void fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'rename',
      kind: 'songPart',
      id: songPartId,
      name,
    }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { ok: boolean }
      if (!data.ok) {
        console.error('[cloud] failed to rename part from session title')
      }
    })
    .catch((error) => {
      console.error('[cloud] failed to rename part from session title', error)
    })
}

/** Rename the cloud song (œuvre) from the deck’s highlighted title. */
export function normalizeAndSetSongWorkName(raw: string) {
  const name = normalizeSessionTitle(raw)
  const path = get().deckLibraryPath
  patch({
    songWorkName: name,
    deckLibraryPath: path ? { ...path, songName: name } : null,
  })

  if (get().readOnlySession) return
  const songId = get().deckSongId
  if (!songId || !name) return

  void fetch('/api/cloud/library', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'rename',
      kind: 'song',
      id: songId,
      name,
    }),
  })
    .then(async (res) => {
      const data = (await res.json()) as { ok: boolean }
      if (!data.ok) {
        console.error('[cloud] failed to rename song from deck title')
      }
    })
    .catch((error) => {
      console.error('[cloud] failed to rename song from deck title', error)
    })
}

/**
 * Keep deck breadcrumb / titles in sync when the library renames a node
 * that belongs to the currently loaded session.
 */
export function syncDeckLabelsAfterLibraryRename(
  kind: 'group' | 'repertoire' | 'song' | 'songPart',
  id: string,
  name: string,
): void {
  const state = get()
  const path = state.deckLibraryPath

  if (kind === 'songPart') {
    const touchesDeck =
      id === state.deckSongPartId || id === state.activeSongPartId
    const touchesSibling = state.deckSongPartSiblings.some(
      (sibling) => sibling.id === id,
    )
    if (!touchesDeck && !touchesSibling) return
    patch({
      ...(touchesDeck ? { sessionTitle: name } : {}),
      ...(touchesSibling
        ? {
            deckSongPartSiblings: state.deckSongPartSiblings.map((sibling) =>
              sibling.id === id
                ? { ...sibling, name: name.trim() ? name : null }
                : sibling,
            ),
          }
        : {}),
    })
    return
  }

  if (!path) return
  if (kind === 'group' && path.groupId === id) {
    patch({ deckLibraryPath: { ...path, groupName: name } })
    return
  }
  if (kind === 'repertoire' && path.repertoireId === id) {
    patch({ deckLibraryPath: { ...path, repertoireName: name } })
    return
  }
  if (kind === 'song' && (path.songId === id || state.deckSongId === id)) {
    patch({
      songWorkName: name,
      deckLibraryPath: { ...path, songName: name },
    })
  }
}

/**
 * When the UI language changes, rewrite still-default titles / track names
 * into the new locale so italic + select-on-focus stay correct.
 */
export function rematerializeLocalizedDefaults(locale: Locale) {
  const { sessionTitle, tracks } = get()
  const nextTitle = isDefaultSessionTitleAnyLocale(sessionTitle)
    ? defaultSessionTitle(locale)
    : null
  let tracksChanged = false
  const nextTracks = tracks.map((track, index) => {
    if (!isDefaultTrackNameAnyLocale(track.name)) return track
    const parsed = parseDefaultTrackIndex(track.name)
    const trackIndex = parsed ?? index + 1
    const nextName = defaultTrackName(trackIndex, locale)
    if (nextName === track.name) return track
    tracksChanged = true
    return { ...track, name: nextName }
  })
  if (nextTitle == null && !tracksChanged) return
  patch({
    ...(nextTitle != null ? { sessionTitle: nextTitle } : {}),
    ...(tracksChanged ? { tracks: nextTracks } : {}),
  })
}

/** Probe output latency and mirror it into the session store for the UI. */
export async function initLatencyProbe(): Promise<void> {
  try {
    const ctx = await ensureAudioContext()
    getMonitorLatencySec(ctx)
    syncLatencyDisplay()
  } catch {
    syncLatencyDisplay()
  }
}
