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
  normalizeSessionTitle,
  parseDefaultTrackIndex,
} from './format'
import type { Locale } from './i18n'
import { writeActiveSongPartId } from './cloudPrefs'
import { librarySessionPath } from './libraryPaths'
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
  OFFSET_WARN_MS,
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
  deleteGuestDraft,
  pickGuestDraftToRestore,
  readTabDraftId,
  saveGuestDraft,
  type GuestDraft,
} from './guestDraft.client'
import { isCloudSignedIn, maybeAutoUploadTrack } from './cloudUpload.client'
import { useSessionStore, type SessionStoreState } from '../store/sessionStore'
import { t } from './i18n'

// --- Module-private live playback maps (not in Zustand) ---

let trackGains = new Map<number, GainNode>()
let trackPlayheads = new Map<number, TrackPlayhead>()
let playWaiters: Array<() => void> = []
let preferMimeType = ''
let pendingTakeOffsetMs = 0
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
    cloudStatus: row.cloudStatus ?? 'local',
    cloudTrackId: row.cloudTrackId,
    cloudOwnedByMe: row.cloudOwnedByMe,
    uploadedByPseudo: row.uploadedByPseudo,
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
    activeSongPartId: null,
    deckSongPartId: cloudPartId,
    deckSongPartSiblings: draft.deckSongPartSiblings ?? [],
    deckSongId: draft.cloudSongId,
    readOnlySession: readOnly,
    canCloudContribute: false,
    songAllowsCollaboration: Boolean(draft.allowsCollaboration),
    deckLibraryPath: draft.deckLibraryPath,
    songWorkName: draft.songWorkName,
    sharedOwnerLabel: draft.sharedOwnerLabel,
    calageMode: false,
    mixMode: readOnly && !allowsCollab,
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    error: null,
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  if (tracks.length > 0) void evaluateReferenceBeat()
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

  const localIds = get()
    .tracks.filter(
      (track) =>
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
  return tracks.filter((track) => track.id !== referenceTrackId)
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
    referenceBeatDismissedKey,
    tracks,
    referenceTrackId,
    skewWarningDismissedKey,
    calageMode,
    showCalageWarnings,
    autoAlignEnabled,
  } = get()

  if (!showCalageWarnings || !autoAlignEnabled) {
    patch({
      skewWarningMessage: null,
      skewWarningShowOpenAdvanced: false,
      skewWarningShowDisableAutoAlign: false,
    })
    return
  }

  const beatActive =
    referenceBeatWarning != null &&
    referenceBeatWarning.key !== referenceBeatDismissedKey

  // Battue warning banner (chip on reference track removed in favor of CTA).
  if (beatActive) {
    patch({
      skewWarningMessage: referenceBeatWarning.message,
      skewWarningShowOpenAdvanced: false,
      skewWarningShowDisableAutoAlign: true,
    })
    return
  }

  const skewed = tracks
    .map((track, index) => ({ track, index }))
    .filter(
      ({ track }) =>
        track.id !== referenceTrackId &&
        Math.abs(track.offsetMs) > OFFSET_WARN_MS,
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

  // Offset skew banner only in calage (outside: chip left of trash on each track).
  if (!calageMode) {
    patch({
      skewWarningMessage: null,
      skewWarningShowOpenAdvanced: false,
      skewWarningShowDisableAutoAlign: false,
    })
    return
  }

  const names = skewed.map(({ track }) => track.name).join(', ')
  patch({
    skewWarningMessage: t('warn.skew.short', { names }),
    skewWarningShowOpenAdvanced: false,
    skewWarningShowDisableAutoAlign: false,
  })
}

export function dismissSkewWarning() {
  const {
    referenceBeatWarning,
    referenceBeatDismissedKey,
    tracks,
    referenceTrackId,
  } = get()

  if (
    referenceBeatWarning &&
    referenceBeatWarning.key !== referenceBeatDismissedKey
  ) {
    patch({ referenceBeatDismissedKey: referenceBeatWarning.key })
    refreshSkewWarning()
    return
  }

  const skewed = tracks
    .map((track, index) => ({ track, index }))
    .filter(
      ({ track }) =>
        track.id !== referenceTrackId &&
        Math.abs(track.offsetMs) > OFFSET_WARN_MS,
    )
  patch({
    skewWarningDismissedKey: skewFingerprint(skewed),
    skewWarningMessage: null,
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
  patch({ timerText: formatTime(getMaxTrackDurationMs(tracks)) })
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
  patch({ error: message })
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
    patch({ calageMode: true, mixMode: false, calageTipOpen: false })
    refreshSkewWarning()
    if (tracks.length > 0) void evaluateReferenceBeat()
    return
  }
  patch({ calageMode: false, calageTipOpen: false })
  refreshSkewWarning()
}

export function setMixMode(on: boolean) {
  const { tracks } = get()
  if (tracks.length === 0 && on) {
    patch({ mixMode: false })
    return
  }
  if (on) {
    patch({ mixMode: true, calageMode: false, calageTipOpen: false })
    refreshSkewWarning()
    return
  }
  clearTrackHighlights()
  patch({ mixMode: false })
}

/** Exclusive deck work mode: simple (default), mix, or align. */
export type DeckWorkMode = 'simple' | 'mix' | 'align'

export function setDeckMode(mode: DeckWorkMode) {
  if (mode === 'mix') {
    setMixMode(true)
    return
  }
  if (mode === 'align') {
    setCalageMode(true)
    return
  }
  setMixMode(false)
  setCalageMode(false)
}

const HIGHLIGHT_DIM_VOLUME = 0.3

function syncLiveTrackGains() {
  for (const [id, gain] of trackGains) {
    gain.gain.value = liveTrackGainValue(id)
  }
}

function applyHighlightVolumes(highlighted: number[]) {
  const volumes: Record<number, number> = { ...get().trackVolumes }
  for (const track of get().tracks) {
    volumes[track.id] =
      highlighted.length === 0
        ? 1
        : highlighted.includes(track.id)
          ? 1
          : HIGHLIGHT_DIM_VOLUME
  }
  patch({ trackVolumes: volumes })
  syncLiveTrackGains()
  persistCloudMixVolumes()
}

function clearTrackHighlights() {
  if (get().highlightedTrackIds.length === 0) return
  patch({ highlightedTrackIds: [] })
  applyHighlightVolumes([])
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
}

export function setMasterVolume(volume: number) {
  const next = clampMasterVolume(volume)
  patch({ masterVolume: next })
  const master = getPlaybackGain()
  if (master) {
    master.gain.value = next
  }
  schedulePersistMasterVolume()
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

/** Update a session align/count-in flag and persist to the cloud part. */
export function setSessionAlignPref(
  key:
    | 'autoAlignEnabled'
    | 'showCalageWarnings'
    | 'skipCountInPlayback'
    | 'skipCountInDownload',
  on: boolean,
): void {
  patch({ [key]: on })
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
    const forgottenStopHint =
      get().state === 'recording' &&
      tracks.length > 0 &&
      elapsed > getMaxTrackDurationMs(tracks) + 10_000
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
  return Math.max(0, (audioContext.currentTime - mixTimelineStartCtx) * 1000)
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

export function applyManualTrackOffset(trackId: number, offsetMs: number) {
  const wasListening =
    get().mixListenActive || get().playingTrackIds.length > 0
  if (wasListening) stopPlayback({ resetSeek: false })

  const tracks = get().tracks.map((track) =>
    track.id === trackId ? { ...track, offsetMs } : track,
  )
  const trackAlignDetails = { ...get().trackAlignDetails }
  delete trackAlignDetails[trackId]
  patch({ tracks, trackAlignDetails })
  refreshSkewWarning()
  persistCloudTrackOffset(trackId)
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
    const buffer = await decodeTrack(reference)
    const peaks = findVolumePeaks(buffer, 4)
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

  const refBuffer = await decodeTrack(reference)
  const refPeaks = findVolumePeaks(refBuffer, 4)
  if (refPeaks.length < 4) {
    throw new Error(
      t('error.refPeaks', {
        name: reference.name,
        count: refPeaks.length,
      }),
    )
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
    if (!targetSet.has(track.id)) continue

    const buffer = await decodeTrack(track)
    const peaks = findVolumePeaks(buffer, 8)
    const pair = findTakeThreeFourPeaks(peaks, refThree, refFour)
    if (!pair) {
      throw new Error(
        t('error.trackPeaks', {
          name: track.name,
          count: peaks.length,
        }),
      )
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

  patch({ tracks: nextTracks, trackAlignDetails: nextDetails })
  refreshSkewWarning()
  persistCloudTrackOffsets(alignedIds)
}

/** After a new take: always auto-align that take (never reshuffle others). */
async function maybeAutoAlignAfterTake(newTrackId: number): Promise<void> {
  if (!get().autoAlignEnabled) return
  if (get().tracks.length < 2) return
  if (get().referenceTrackId === newTrackId) return
  try {
    await autoAlignTracksFromCounts([newTrackId])
  } catch (error) {
    setError(
      error instanceof Error
        ? t('error.autoAlignDeferred', { message: error.message })
        : t('error.autoAlignDeferredGeneric'),
    )
  }
}

/** Manual action: recalculate auto-align for one non-reference track. */
export async function realignTrack(trackId: number): Promise<void> {
  if (!get().autoAlignEnabled) return
  setError(null)
  await autoAlignTracksFromCounts([trackId])
}

/** Manual action: recalculate auto-align for every non-reference track. */
export async function realignAllTracks(): Promise<void> {
  if (!get().autoAlignEnabled) return
  setError(null)
  await autoAlignTracksFromCounts(alignableTracks().map((track) => track.id))
}

/** Mix-timeline cut just after the reference "4", with pad (seconds). */
export async function getSkipCountInStartSec(): Promise<number | null> {
  const reference = getReferenceTrack()
  if (!reference || reference.blob.size === 0) return null

  try {
    const buffer = await decodeTrack(reference)
    const peaks = findVolumePeaks(buffer, 4)
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
  const selected = selectedTracks().filter((track) => track.blob.size > 0)
  if (selected.length === 0) {
    setError(t('error.exportNoTracks'))
    return
  }

  const filename = downloadFilenameForSelection(
    get().sessionTitle,
    selected,
    get().tracks.length,
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
  },
): Promise<void> {
  const asMix = Boolean(options?.asMix)
  const sourceTracks = asMix ? get().tracks : tracksToPlay
  const playable = sourceTracks.filter((track) => track.blob.size > 0)
  if (playable.length === 0) {
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

  const gain = ctx.createGain()
  gain.gain.value = clampMasterVolume(get().masterVolume)
  gain.connect(ctx.destination)
  setPlaybackGain(gain)

  const timelineStart = ctx.currentTime + MIX_LOOKAHEAD_S
  mixEpochPerf = performance.now() + MIX_LOOKAHEAD_S * 1000 - startAtMs
  mixTimelineStartCtx = timelineStart - startAtMs / 1000
  setMixPausedBoth(false)
  trackPlayheads.clear()

  const sources: AudioBufferSourceNode[] = []
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
        onTrackGain: (id, trackGain) => {
          trackGains.set(id, trackGain)
        },
        onPlayhead: (id, playhead) => {
          trackPlayheads.set(id, playhead)
        },
      },
    )
    if (!scheduled) continue
    sources.push(scheduled.source)
    playing.add(track.id)
  }

  setPlaybackSources(sources)
  syncPlayingIds(playing)
  startPlayheadClock()
  tickClockDisplays()

  const awaitEnd = options?.awaitEnd ?? true
  const startDelayMs = Math.max(0, (timelineStart - ctx.currentTime) * 1000)

  return new Promise<void>((resolve) => {
    let settled = false
    let remaining = sources.length

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

    if (sources.length === 0) {
      finish(() => {
        stopPlayback({ resetSeek: true })
        resolve()
      })
      return
    }

    if (awaitEnd) {
      playWaiters.push(resolveAsDone)
    }

    for (const source of sources) {
      source.onended = () => {
        if (getMixPaused()) return
        remaining -= 1
        if (remaining > 0) return

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

  const decoded =
    monitor.length > 0
      ? await Promise.all(
          monitor.map(async (track) => ({
            track,
            buffer: await decodeTrack(track),
          })),
        )
      : []

  stopPlayback()

  if (decoded.length === 0) {
    setActiveRecording(recording)
    recording.recorder.start()
    pendingTakeOffsetMs = 0
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

  const sources: AudioBufferSourceNode[] = []
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
    sources.push(scheduled.source)
    playing.add(track.id)
  }

  setPlaybackSources(sources)
  syncPlayingIds(playing)

  let remainingMonitor = sources.length
  for (const source of sources) {
    source.onended = () => {
      remainingMonitor -= 1
      if (remainingMonitor > 0) return
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
  pendingTakeOffsetMs = 0

  const blob = await stopRecorderToBlob(active)
  stopMeterNodes()
  patch({ meterLevel: 0 })

  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })

  if (blob.size === 0) {
    throw new Error(t('error.noAudioData'))
  }

  return appendTrackFromBlob(blob, { durationMs, offsetMs })
}

/** Shared path: mic take or imported file → session track + cloud hook. */
async function appendTrackFromBlob(
  blob: Blob,
  options: { durationMs: number; offsetMs?: number; name?: string },
): Promise<Track> {
  const trackCounter = get().trackCounter + 1
  const tracks = get().tracks
  const track: Track = {
    id: trackCounter,
    name: options.name ?? defaultTrackName(tracks.length + 1),
    blob,
    url: URL.createObjectURL(blob),
    durationMs: options.durationMs,
    offsetMs: options.offsetMs ?? 0,
    cloudStatus: 'local',
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
  await maybeAutoAlignAfterTake(track.id)
  void import('./cloudUpload.client').then((mod) =>
    mod.maybeAutoUploadTrack(track.id),
  )
  scheduleGuestDraftSave()
  return track
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

export async function abortCurrentTake(): Promise<void> {
  discardPendingRecording()
  stopPlayback({ resetSeek: true })
  stopMeterNodes()
  patch({ meterLevel: 0 })
  stopTimer()
  pendingTakeOffsetMs = 0
  patch({ mixSeekMs: 0, mixClockText: formatCentis(0) })

  const recording = getActiveRecording()
  setActiveRecording(null)
  if (!recording || recording.recorder.state === 'inactive') return

  try {
    await stopRecorderToBlob(recording)
  } catch {
    // Discarded take — ignore stop errors.
  }
}

/** Throw away the in-progress take and punch in again from mix t0. */
export async function discard() {
  if (get().state !== 'recording') return

  try {
    await abortCurrentTake()
    if (get().tracks.length > 0) {
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

export async function startSession() {
  try {
    stopPlayback()
    pendingTakeOffsetMs = 0
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

  try {
    const active = getActiveRecording()
    if (active && active.recorder.state !== 'inactive') {
      if (keepTake) {
        await finalizeCurrentTake()
      } else {
        setActiveRecording(null)
        pendingTakeOffsetMs = 0
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
    patch({
      mixSeekMs: 0,
      mixClockText: '00:00.000',
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

  if (shouldAutoplay && get().tracks.length > 0) {
    setError(null)
    void playTracks(get().tracks, {
      awaitEnd: true,
      asMix: true,
      applyOffsets: true,
      startAtMs: 0,
    }).catch((error) => {
      setError(error instanceof Error ? error.message : t('error.playbackFailed'))
    })
  }
}

export async function seekMixTo(ms: number) {
  const { tracks, state, mixPaused, playingTrackIds } = get()
  if (tracks.length === 0 || state === 'recording') return

  const duration = getMixDurationMs(tracks)
  const target = Math.max(0, Math.min(duration, ms))
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
  const track = get().tracks.find((t) => t.id === trackId)
  if (!track) return
  if (get().playingTrackIds.length > 0 || get().mixListenActive) {
    stopPlayback({ resetSeek: false })
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
  const prevHighlights = get().highlightedTrackIds
  const nextHighlights = prevHighlights.filter((id) => id !== trackId)
  patch({
    tracks,
    enabledTrackIds: get().enabledTrackIds.filter((id) => id !== trackId),
    highlightedTrackIds: nextHighlights,
    trackAlignDetails,
    trackVolumes,
    ...(tracks.length === 0
      ? { calageMode: false, mixMode: false, calageTipOpen: false }
      : {}),
  })
  if (prevHighlights.length > 0) {
    applyHighlightVolumes(nextHighlights)
  }
  syncReferenceTrackRules()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  if (get().referenceTrackId != null) void evaluateReferenceBeat()
  scheduleGuestDraftSave()

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
  patch({
    tracks: [],
    enabledTrackIds: [],
    playingTrackIds: [],
    highlightedTrackIds: [],
    referenceTrackId: null,
    trackAlignDetails: {},
    trackVolumes: {},
    masterVolume: 1,
    trackCounter: 0,
    calageMode: false,
    mixMode: false,
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    guestSignInPrompt: false,
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  scheduleGuestDraftSave()

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

/** Drop cloud song context and all loaded takes (e.g. on sign-out). */
export function resetDeckOnSignOut() {
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

  deleteAllTracks()
  writeActiveSongPartId(null)
  patch({
    activeSongPartId: null,
    deckSongPartId: null,
    deckSongPartSiblings: [],
    deckSongId: null,
    readOnlySession: false,
    canCloudContribute: false,
    songAllowsCollaboration: false,
    deckLibraryPath: null,
    songWorkName: null,
    sharedOwnerLabel: null,
    sessionTitle: defaultSessionTitle(),
    error: null,
    hint: '',
    guestSignInPrompt: false,
  })
}

/** Replace the deck with tracks loaded from a cloud song part (session). */
export async function loadCloudSongIntoSession(
  songPartId: string,
  options?: { quiet?: boolean },
): Promise<boolean> {
  if (get().state === 'recording') return false
  const { fetchAndHydrateSong, writeActiveSongPartId } = await import(
    './cloudUpload.client'
  )
  const opened = await fetchAndHydrateSong(songPartId, options)
  if (!opened) return false

  stopPlayback({ resetSeek: true })
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()

  const enabledTrackIds = opened.enabledTrackIds
  const trackVolumes = { ...opened.trackVolumes }

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
    tracks: opened.tracks,
    trackCounter: opened.tracks.length,
    enabledTrackIds,
    playingTrackIds: [],
    highlightedTrackIds: [],
    referenceTrackId: opened.tracks[0]?.id ?? null,
    trackAlignDetails: {},
    trackVolumes,
    masterVolume: opened.part.masterVolume,
    autoAlignEnabled: opened.part.autoAlignEnabled,
    showCalageWarnings: opened.part.showCalageWarnings,
    skipCountInPlayback: opened.part.skipCountInPlayback,
    skipCountInDownload: opened.part.skipCountInDownload,
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
    sharedOwnerLabel,
    calageMode: false,
    mixMode: readOnly && !canCloudContribute,
    mixSeekMs: 0,
    mixClockText: '00:00.000',
    error: null,
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
  if (opened.tracks.length > 0) void evaluateReferenceBeat()
  return true
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
      error: null,
    })
  }
}


export function normalizeAndSetSessionTitle(raw: string) {
  const songPartId = get().activeSongPartId
  // Cloud sessions may be unnamed (null); local guest titles keep the default.
  const name =
    songPartId && !get().readOnlySession
      ? raw.replace(/\s+/g, ' ').trim().slice(0, 60)
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
