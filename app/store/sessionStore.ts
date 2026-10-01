import { create } from 'zustand'
import type {
  AppState,
  CutWorkSegment,
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

/** Chip / session warning tone (matches mode button colors). */
export type NoticeTone = 'simple' | 'mix' | 'align' | 'warn'

export type SessionNotice = {
  id: string
  message: string
  tone: NoticeTone
  action?: 'disableAutoAlign' | 'undoAutoAlign'
}

/** Post–content-Sync guided invite (listen → satisfy → merge…). */
export type ContentSyncInviteStep =
  | 'listenSync'
  | 'satisfied'
  | 'adjustListen'
  | 'mergeAsk'
  | 'goCut'
  | 'listenMerge'
  | 'acceptMerge'
  | 'merging'

export type ContentSyncInvite = {
  step: ContentSyncInviteStep
  /** Punch-in / newer take that was synced. */
  fromTrackId: number
  /** Track synced against (usually the earlier take). */
  againstTrackId: number
  /** Offset before Sync, for undo if the user rejects. */
  previousOffsetMs: number
  /** Quiet cut on the mix timeline (set when merging). */
  cutPointMs: number | null
  /** Pending / finished merge track id. */
  mergedTrackId: number | null
  /** Display name of the first (against) track — used when accepting merge. */
  keepName: string
  /** True when the latest listen was after a manual offset tweak. */
  afterManualAdjust: boolean
}

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
  /** Cut / découpage work mode (exclusive with mix + calage). */
  cutMode: boolean
  /** Cut UI: idle = normal track chrome; edit = after first scissors split. */
  cutPhase: 'idle' | 'edit'
  /** Tracks included in découpage (all non-metronome by default). */
  cutSelectedTrackIds: number[]
  /** Per-track work segments in mix-timeline ms. */
  cutWorkSegments: Record<number, CutWorkSegment[]>
  /** Découpage preview speed (1 | 0.5 | 0.25). */
  cutPlaybackRate: number
  /** Cut merge (Fusionner) in progress. */
  cutMerging: boolean
  /** Placeholder track id receiving merge progress (null when idle). */
  cutMergeTrackId: number | null
  /** Overall merge progress 0–1 while cutMerging. */
  cutMergeProgress: number
  mixListenActive: boolean
  mixPaused: boolean
  mixSeekMs: number
  seekDragActive: boolean
  mixExporting: boolean
  mixClockText: string
  mixSeekRatio: number
  /**
   * Punch-in content sync: when set, click another track to align
   * this punch-in take against it. Null = idle.
   */
  contentSyncPickFromId: number | null
  /**
   * Until this epoch ms, Sync is offered in simple mode after a punch-in take.
   * 0 = not offered (calage still shows Sync when relevant).
   */
  contentSyncSimpleOfferUntil: number
  /** Guided invite after a successful content Sync. */
  contentSyncInvite: ContentSyncInvite | null
  /** Calage: pick a new reference track (click REF. then a target). */
  referencePickActive: boolean
  meterVisible: boolean
  timerVisible: boolean
  calageTipOpen: boolean
  markingOpen: boolean

  /** Dismissible deck notice (chip click or auto beat warning). */
  notice: SessionNotice | null
  /** Notice id closed with × — blocks auto-reopen until chip click or mode leave. */
  noticeSuppressedId: string | null

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
  /**
   * Session metronome tempo (BPM). Null = no metronome track.
   * Persisted on SongPart when signed in; regenerated client-side on open.
   */
  metronomeBpm: number | null
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
  /** Whether the deck song is public (share link works for others). */
  songIsPublic: boolean
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
  /**
   * Tracks that failed peak detection / auto-align — “!” chip outside calage
   * (banner text is only shown in calage mode).
   */
  alignAttentionByTrackId: Record<number, string>
  /**
   * Tracks whose decoded audio is clipped at capture (mix mode “!” / warn chip).
   */
  trackClipById: Record<number, boolean>
  /**
   * Mix bus peak with masterVolume = 1 (cached; refresh on track volume / new take).
   */
  mixPeakAtUnityMaster: number | null
  /** True when mixPeakAtUnityMaster × masterVolume ≥ 1. */
  mixClipWarning: boolean
  /**
   * Pref: auto-lower master when the mix bus would clip.
   */
  autoMasterPreventClip: boolean
  /**
   * Pref: auto-raise master toward ~0.85 peak when the mix is too quiet.
   */
  autoMasterBoost: boolean
  /**
   * After an auto master correction in mix mode: which pref caused it
   * (shown as a checkbox under the deck). Null when idle.
   */
  masterAutoCorrectHint: 'prevent' | 'boost' | null
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
  setCutMode: (on: boolean) => void
  setAutoplayAfterStop: (on: boolean) => void
  setSkipCountInPlayback: (on: boolean) => void
  setSkipCountInDownload: (on: boolean) => void
  setShowCalageWarnings: (on: boolean) => void
  setAutoAlignEnabled: (on: boolean) => void
  setAutoMasterPreventClip: (on: boolean) => void
  setAutoMasterBoost: (on: boolean) => void
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
  cutMode: false,
  cutPhase: 'idle',
  cutSelectedTrackIds: [],
  cutWorkSegments: {},
  cutPlaybackRate: 1,
  cutMerging: false,
  cutMergeTrackId: null,
  cutMergeProgress: 0,
  mixListenActive: false,
  mixPaused: false,
  mixSeekMs: 0,
  seekDragActive: false,
  mixExporting: false,
  mixClockText: '00:00.000',
  mixSeekRatio: 0,
  contentSyncPickFromId: null,
  contentSyncSimpleOfferUntil: 0,
  contentSyncInvite: null,
  referencePickActive: false,
  meterVisible: false,
  timerVisible: false,
  calageTipOpen: false,
  markingOpen: false,

  notice: null,
  noticeSuppressedId: null,

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
  metronomeBpm: null,
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
  songIsPublic: false,
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
  alignAttentionByTrackId: {},
  trackClipById: {},
  mixPeakAtUnityMaster: null,
  mixClipWarning: false,
  autoMasterPreventClip: true,
  autoMasterBoost: true,
  masterAutoCorrectHint: null,

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

  setError: (error) => {
    if (error == null) {
      set((s) => ({
        error: null,
        ...(s.notice?.id === 'error' ? { notice: null } : {}),
      }))
      return
    }
    set({
      error,
      notice: { id: 'error', message: error, tone: 'warn' },
    })
  },
  setHint: (hint) => set({ hint }),
  setSessionTitle: (title) => set({ sessionTitle: title }),
  setSongWorkName: (name) => set({ songWorkName: name }),
  setCalageMode: (on) => set({ calageMode: on }),
  setMixMode: (on) => set({ mixMode: on }),
  setCutMode: (on) => set({ cutMode: on }),
  setAutoplayAfterStop: (on) => set({ autoplayAfterStop: on }),
  setSkipCountInPlayback: (on) => set({ skipCountInPlayback: on }),
  setSkipCountInDownload: (on) => set({ skipCountInDownload: on }),
  setShowCalageWarnings: (on) => set({ showCalageWarnings: on }),
  setAutoAlignEnabled: (on) => set({ autoAlignEnabled: on }),
  setAutoMasterPreventClip: (on) => set({ autoMasterPreventClip: on }),
  setAutoMasterBoost: (on) => set({ autoMasterBoost: on }),
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
