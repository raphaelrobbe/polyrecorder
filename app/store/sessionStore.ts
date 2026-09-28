import { create } from 'zustand'
import type {
  AppState,
  ReferenceBeatWarning,
  TouchReorderState,
  Track,
  TrackAlignDetail,
} from '../common/types'
import {
  DEFAULT_MONITOR_LATENCY_S,
  type SelectableDeviceOption,
} from '../common/devices'
import { defaultSessionTitle } from '../lib/format'

export type SessionStoreState = {
  tracks: Track[]
  trackCounter: number
  state: AppState
  sessionStopping: boolean

  enabledTrackIds: number[]
  playingTrackIds: number[]
  referenceTrackId: number | null
  trackAlignDetails: Record<number, TrackAlignDetail>

  calageMode: boolean
  mixMode: boolean
  mixListenActive: boolean
  mixPaused: boolean
  mixSeekMs: number
  seekDragActive: boolean
  mixExporting: boolean
  mixClockText: string
  mixSeekRatio: number
  meterVisible: boolean
  timerVisible: boolean
  calageTipOpen: boolean
  markingOpen: boolean

  /** Per-track volume multipliers (1 = 100%). */
  trackVolumes: Record<number, number>
  /** Master bus multiplier (1 = 100%, may exceed 1). */
  masterVolume: number
  /** Mix-mode “feature” set: highlighted tracks at 100%, others at 30%. */
  highlightedTrackIds: number[]

  sessionTitle: string
  error: string | null
  hint: string
  meterLevel: number
  timerText: string
  recordingTimerVisible: boolean
  /** Overdub take running past max other-track duration + 10s. */
  forgottenStopHint: boolean
  /** Guest just finished a take — show sign-in invite near the capture bar. */
  guestSignInPrompt: boolean

  autoplayAfterStop: boolean
  skipCountInPlayback: boolean
  skipCountInDownload: boolean
  /** Show beat/skew alignment warnings (session memory; default on). */
  showCalageWarnings: boolean
  /** Auto-align takes from 1-2-3-4 markers (localStorage; default on). */
  autoAlignEnabled: boolean
  /** Persist takes to Scaleway S3 when signed in (localStorage). */
  autoCloudSave: boolean
  /** Current cloud song part (session) id for new uploads (localStorage). */
  activeSongPartId: string | null
  /** Cloud song part currently loaded on the deck (may be empty). */
  deckSongPartId: string | null
  /** Every session of the deck song, in library order (prev / next nav). */
  deckSongPartSiblings: Array<{ id: string; name: string | null }>
  /** Shared public song viewed without ownership (local overdub ok; no cloud mutate). */
  readOnlySession: boolean
  /**
   * Signed-in collaborator on a public collaborative song: may upload new
   * tracks (and mutate their own), but not owner metadata.
   */
  canCloudContribute: boolean
  /**
   * Song allows collaboration (from cloud metadata). Guests see false for
   * `canCloudContribute` until sign-in; this flag keeps the intent for drafts.
   */
  songAllowsCollaboration: boolean
  /** Cloud song (œuvre) id of the deck session, when loaded from library. */
  deckSongId: string | null
  /**
   * Library location for the cloud song on the deck (breadcrumb above the
   * title). Song segment links to `/chanson/:id`.
   */
  deckLibraryPath: {
    ownerPseudo: string
    groupId: string
    groupName: string
    repertoireId: string
    repertoireName: string
    songId: string
    songName: string
  } | null
  /** Song (œuvre) name — highlighted title when a cloud song is loaded. */
  songWorkName: string | null
  /** Owner display for a shared song in consultation (pseudo or null). */
  sharedOwnerLabel: string | null

  /** Mirrored from runtime for UI (persisted via runtime setters). */
  latencyTrimMs: number
  lastReportedLatencyMs: number

  refPeaksLabel: string
  referenceBeatWarning: ReferenceBeatWarning | null
  referenceBeatDismissedKey: string
  skewWarningDismissedKey: string
  skewWarningMessage: string | null
  skewWarningShowOpenAdvanced: boolean
  /** Beat warning banner: offer to turn off auto-align. */
  skewWarningShowDisableAutoAlign: boolean

  keyboardHintsEnabled: boolean
  inputOverrideNote: string | null

  deviceApiSupported: boolean
  deviceSelectable: boolean
  sinkSelectable: boolean
  outputOptions: SelectableDeviceOption[]
  inputOptions: SelectableDeviceOption[]
  sinkMonitorId: string
  sinkPlaybackId: string
  inputMonitorId: string

  dragTrackId: number | null
  touchReorder: TouchReorderState | null

  setError: (error: string | null) => void
  setHint: (hint: string) => void
  setSessionTitle: (title: string) => void
  setSongWorkName: (name: string) => void
  setCalageMode: (on: boolean) => void
  setMixMode: (on: boolean) => void
  setAutoplayAfterStop: (on: boolean) => void
  setSkipCountInPlayback: (on: boolean) => void
  setSkipCountInDownload: (on: boolean) => void
  setShowCalageWarnings: (on: boolean) => void
  setAutoAlignEnabled: (on: boolean) => void
  setAutoCloudSave: (on: boolean) => void
  setActiveSongPartId: (songPartId: string | null) => void
  setKeyboardHintsEnabled: (on: boolean) => void
  setSeekDragActive: (on: boolean) => void
  setMixSeekMs: (ms: number) => void
  setMeterLevel: (level: number) => void
  setInputOverrideNote: (note: string | null) => void
  setDragTrackId: (id: number | null) => void
  setTouchReorder: (state: TouchReorderState | null) => void
  setTrackVolume: (trackId: number, volume: number) => void
  setMasterVolume: (volume: number) => void
  patch: (partial: Partial<SessionStoreState>) => void
}

export const useSessionStore = create<SessionStoreState>((set) => ({
  tracks: [],
  trackCounter: 0,
  state: 'idle',
  sessionStopping: false,

  enabledTrackIds: [],
  playingTrackIds: [],
  referenceTrackId: null,
  trackAlignDetails: {},

  calageMode: false,
  mixMode: false,
  mixListenActive: false,
  mixPaused: false,
  mixSeekMs: 0,
  seekDragActive: false,
  mixExporting: false,
  mixClockText: '00:00.000',
  mixSeekRatio: 0,
  meterVisible: false,
  timerVisible: false,
  calageTipOpen: false,
  markingOpen: false,

  trackVolumes: {},
  masterVolume: 1,
  highlightedTrackIds: [],

  sessionTitle: defaultSessionTitle(),
  error: null,
  hint: '',
  meterLevel: 0,
  timerText: '00:00',
  recordingTimerVisible: false,
  forgottenStopHint: false,
  guestSignInPrompt: false,

  autoplayAfterStop: true,
  skipCountInPlayback: true,
  skipCountInDownload: true,
  showCalageWarnings: true,
  autoAlignEnabled: true,
  autoCloudSave: true,
  activeSongPartId: null,
  deckSongPartId: null,
  deckSongPartSiblings: [],
  readOnlySession: false,
  canCloudContribute: false,
  songAllowsCollaboration: false,
  deckSongId: null,
  deckLibraryPath: null,
  songWorkName: null,
  sharedOwnerLabel: null,

  // Hydrated from audio runtime on the client (refreshDeviceSnapshot / init).
  latencyTrimMs: 0,
  lastReportedLatencyMs: Math.round(DEFAULT_MONITOR_LATENCY_S * 1000),

  refPeaksLabel: '',
  referenceBeatWarning: null,
  referenceBeatDismissedKey: '',
  skewWarningDismissedKey: '',
  skewWarningMessage: null,
  skewWarningShowOpenAdvanced: false,
  skewWarningShowDisableAutoAlign: false,

  // any-* : souris/trackpad présents même si le tactile est le pointeur principal
  keyboardHintsEnabled:
    typeof window !== 'undefined'
      ? window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches
      : false,
  inputOverrideNote: null,

  deviceApiSupported: false,
  deviceSelectable: false,
  sinkSelectable: false,
  outputOptions: [],
  inputOptions: [],
  sinkMonitorId: '',
  sinkPlaybackId: '',
  inputMonitorId: '',

  dragTrackId: null,
  touchReorder: null,

  setError: (error) => set({ error }),
  setHint: (hint) => set({ hint }),
  setSessionTitle: (title) => set({ sessionTitle: title }),
  setSongWorkName: (name) => set({ songWorkName: name }),
  setCalageMode: (on) => set({ calageMode: on }),
  setMixMode: (on) => set({ mixMode: on }),
  setAutoplayAfterStop: (on) => set({ autoplayAfterStop: on }),
  setSkipCountInPlayback: (on) => set({ skipCountInPlayback: on }),
  setSkipCountInDownload: (on) => set({ skipCountInDownload: on }),
  setShowCalageWarnings: (on) => set({ showCalageWarnings: on }),
  setAutoAlignEnabled: (on) => set({ autoAlignEnabled: on }),
  setAutoCloudSave: (on) => set({ autoCloudSave: on }),
  setActiveSongPartId: (songPartId) => set({ activeSongPartId: songPartId }),
  setKeyboardHintsEnabled: (on) => set({ keyboardHintsEnabled: on }),
  setSeekDragActive: (on) => set({ seekDragActive: on }),
  setMixSeekMs: (ms) => set({ mixSeekMs: ms }),
  setMeterLevel: (level) => set({ meterLevel: level }),
  setInputOverrideNote: (note) => set({ inputOverrideNote: note }),
  setDragTrackId: (id) => set({ dragTrackId: id }),
  setTouchReorder: (state) => set({ touchReorder: state }),
  setTrackVolume: (trackId, volume) =>
    set((state) => ({
      trackVolumes: { ...state.trackVolumes, [trackId]: volume },
    })),
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  patch: (partial) => set(partial),
}))
