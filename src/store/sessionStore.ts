import { create } from 'zustand'
import type {
  AppState,
  ReferenceBeatWarning,
  TouchReorderState,
  Track,
  TrackAlignDetail,
} from '../types'
import { defaultSessionTitle } from '../lib/format'
import {
  DEFAULT_MONITOR_LATENCY_S,
  getInputMonitorId,
  getLatencyTrimMs,
  getSinkMonitorId,
  getSinkPlaybackId,
  type SelectableDeviceOption,
} from '../lib/audio/runtime'

export type SessionStoreState = {
  tracks: Track[]
  trackCounter: number
  state: AppState
  sessionStopping: boolean

  enabledTrackIds: number[]
  autoAlignTrackIds: number[]
  playingTrackIds: number[]
  referenceTrackId: number | null
  trackAlignDetails: Record<number, TrackAlignDetail>

  calageMode: boolean
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

  sessionTitle: string
  error: string | null
  hint: string
  meterLevel: number
  timerText: string
  recordingTimerVisible: boolean

  autoplayAfterStop: boolean
  skipCountInPlayback: boolean
  skipCountInDownload: boolean

  /** Mirrored from runtime for UI (persisted via runtime setters). */
  latencyTrimMs: number
  lastReportedLatencyMs: number

  refPeaksLabel: string
  referenceBeatWarning: ReferenceBeatWarning | null
  referenceBeatDismissedKey: string
  skewWarningDismissedKey: string
  skewWarningMessage: string | null
  skewWarningShowOpenAdvanced: boolean

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
  setCalageMode: (on: boolean) => void
  setAutoplayAfterStop: (on: boolean) => void
  setSkipCountInPlayback: (on: boolean) => void
  setSkipCountInDownload: (on: boolean) => void
  setKeyboardHintsEnabled: (on: boolean) => void
  setSeekDragActive: (on: boolean) => void
  setMixSeekMs: (ms: number) => void
  setMeterLevel: (level: number) => void
  setInputOverrideNote: (note: string | null) => void
  setDragTrackId: (id: number | null) => void
  setTouchReorder: (state: TouchReorderState | null) => void
  patch: (partial: Partial<SessionStoreState>) => void
}

const initialLatencyTrimMs = getLatencyTrimMs()

export const useSessionStore = create<SessionStoreState>((set) => ({
  tracks: [],
  trackCounter: 0,
  state: 'idle',
  sessionStopping: false,

  enabledTrackIds: [],
  autoAlignTrackIds: [],
  playingTrackIds: [],
  referenceTrackId: null,
  trackAlignDetails: {},

  calageMode: false,
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

  sessionTitle: defaultSessionTitle(),
  error: null,
  hint: '',
  meterLevel: 0,
  timerText: '00:00',
  recordingTimerVisible: false,

  autoplayAfterStop: true,
  skipCountInPlayback: true,
  skipCountInDownload: true,

  latencyTrimMs: initialLatencyTrimMs,
  lastReportedLatencyMs: Math.round(DEFAULT_MONITOR_LATENCY_S * 1000),

  refPeaksLabel: '',
  referenceBeatWarning: null,
  referenceBeatDismissedKey: '',
  skewWarningDismissedKey: '',
  skewWarningMessage: null,
  skewWarningShowOpenAdvanced: false,

  keyboardHintsEnabled:
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : false,
  inputOverrideNote: null,

  deviceApiSupported: false,
  deviceSelectable: false,
  sinkSelectable: false,
  outputOptions: [],
  inputOptions: [],
  sinkMonitorId: getSinkMonitorId(),
  sinkPlaybackId: getSinkPlaybackId(),
  inputMonitorId: getInputMonitorId(),

  dragTrackId: null,
  touchReorder: null,

  setError: (error) => set({ error }),
  setHint: (hint) => set({ hint }),
  setSessionTitle: (title) => set({ sessionTitle: title }),
  setCalageMode: (on) => set({ calageMode: on }),
  setAutoplayAfterStop: (on) => set({ autoplayAfterStop: on }),
  setSkipCountInPlayback: (on) => set({ skipCountInPlayback: on }),
  setSkipCountInDownload: (on) => set({ skipCountInDownload: on }),
  setKeyboardHintsEnabled: (on) => set({ keyboardHintsEnabled: on }),
  setSeekDragActive: (on) => set({ seekDragActive: on }),
  setMixSeekMs: (ms) => set({ mixSeekMs: ms }),
  setMeterLevel: (level) => set({ meterLevel: level }),
  setInputOverrideNote: (note) => set({ inputOverrideNote: note }),
  setDragTrackId: (id) => set({ dragTrackId: id }),
  setTouchReorder: (state) => set({ touchReorder: state }),
  patch: (partial) => set(partial),
}))
