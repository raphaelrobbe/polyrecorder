import type {
  ActiveRecording,
  AppState,
  AudioContextWithSink,
  AudioSinkMode,
} from '../../common/types'
import { t } from '../i18n'

export const MIX_LOOKAHEAD_S = 0.12
/** Fallback when the browser reports no output latency (seconds). */
export const DEFAULT_MONITOR_LATENCY_S = 0.045

export const LATENCY_TRIM_KEY = 'polyrecorder.latencyTrimMs'
export const SINK_MONITOR_KEY = 'polyrecorder.sinkMonitor'
export const SINK_PLAYBACK_KEY = 'polyrecorder.sinkPlayback'
export const INPUT_MONITOR_KEY = 'polyrecorder.inputMonitor'

export const OFFSET_WARN_MS = 300
export const MAX_RECORDING_MS = 5 * 60 * 1000

function loadLatencyTrimMs(): number {
  try {
    const raw = localStorage.getItem(LATENCY_TRIM_KEY)
    if (raw == null) return 0
    const value = Number(raw)
    if (!Number.isFinite(value)) return 0
    return Math.max(-150, Math.min(150, Math.round(value)))
  } catch {
    return 0
  }
}

function loadSinkId(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function saveSinkId(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // ignore quota / private mode
  }
}

// --- Module singleton (live Web Audio / MediaRecorder nodes stay here) ---

let audioContext: AudioContext | null = null
let mediaStream: MediaStream | null = null
let analyser: AnalyserNode | null = null
let meterSource: MediaStreamAudioSourceNode | null = null
let meterRaf: number | null = null
let meterLevelCallback: ((level: number) => void) | null = null

let playbackSources: AudioBufferSourceNode[] = []
let playbackGain: GainNode | null = null
let bufferCache = new Map<number, AudioBuffer>()

let timerId: number | null = null
let startedAt = 0
let playheadRaf: number | null = null
let overdubArmTimer: number | null = null

let activeRecording: ActiveRecording | null = null
let pendingRecording: ActiveRecording | null = null

/** Mirrors app transport so sink mode / resume policy stay correct. */
let appState: AppState = 'idle'
let mixPaused = false

let latencyTrimMs = loadLatencyTrimMs()
let sinkMonitorId = loadSinkId(SINK_MONITOR_KEY)
let sinkPlaybackId = loadSinkId(SINK_PLAYBACK_KEY)
let inputMonitorId = loadSinkId(INPUT_MONITOR_KEY)
let lastReportedLatencyMs = Math.round(DEFAULT_MONITOR_LATENCY_S * 1000)

export type MeterLevelCallback = (level: number) => void

export type EnsureMicResult = {
  stream: MediaStream
  /** Non-null when the OS opened a different input than requested. */
  inputOverrideNote: string | null
}

export type AudioDevicesSnapshot = {
  apiSupported: boolean
  deviceSelectable: boolean
  sinkSelectable: boolean
  outputs: MediaDeviceInfo[]
  inputs: MediaDeviceInfo[]
  sinkMonitorId: string
  sinkPlaybackId: string
  inputMonitorId: string
}

export type SelectableDeviceOption = {
  deviceId: string
  label: string
}

// --- Getters / setters for singleton state ---

export function getAudioContext(): AudioContext | null {
  return audioContext
}

export function getMediaStream(): MediaStream | null {
  return mediaStream
}

export function getAnalyser(): AnalyserNode | null {
  return analyser
}

export function getPlaybackSources(): AudioBufferSourceNode[] {
  return playbackSources
}

export function setPlaybackSources(sources: AudioBufferSourceNode[]) {
  playbackSources = sources
}

export function getPlaybackGain(): GainNode | null {
  return playbackGain
}

export function setPlaybackGain(gain: GainNode | null) {
  playbackGain = gain
}

export function getBufferCache(): Map<number, AudioBuffer> {
  return bufferCache
}

export function clearBufferCache(trackId?: number) {
  if (trackId == null) bufferCache.clear()
  else bufferCache.delete(trackId)
}

export function getActiveRecording(): ActiveRecording | null {
  return activeRecording
}

export function setActiveRecording(recording: ActiveRecording | null) {
  activeRecording = recording
}

export function getPendingRecording(): ActiveRecording | null {
  return pendingRecording
}

export function setPendingRecording(recording: ActiveRecording | null) {
  pendingRecording = recording
}

export function getTimerId(): number | null {
  return timerId
}

export function setTimerId(id: number | null) {
  timerId = id
}

export function getStartedAt(): number {
  return startedAt
}

export function setStartedAt(value: number) {
  startedAt = value
}

export function getPlayheadRaf(): number | null {
  return playheadRaf
}

export function setPlayheadRaf(id: number | null) {
  playheadRaf = id
}

export function getOverdubArmTimer(): number | null {
  return overdubArmTimer
}

export function setOverdubArmTimer(id: number | null) {
  overdubArmTimer = id
}

export function getAppAudioState(): AppState {
  return appState
}

export function setAppAudioState(state: AppState) {
  appState = state
}

export function getMixPaused(): boolean {
  return mixPaused
}

export function setMixPaused(paused: boolean) {
  mixPaused = paused
}

export function getLatencyTrimMs(): number {
  return latencyTrimMs
}

export function setLatencyTrimMs(value: number) {
  latencyTrimMs = Math.max(-150, Math.min(150, Math.round(value)))
  try {
    localStorage.setItem(LATENCY_TRIM_KEY, String(latencyTrimMs))
  } catch {
    // ignore quota / private mode
  }
}

export function getSinkMonitorId(): string {
  return sinkMonitorId
}

export function setSinkMonitorId(value: string) {
  sinkMonitorId = value
  saveSinkId(SINK_MONITOR_KEY, value)
}

export function getSinkPlaybackId(): string {
  return sinkPlaybackId
}

export function setSinkPlaybackId(value: string) {
  sinkPlaybackId = value
  saveSinkId(SINK_PLAYBACK_KEY, value)
}

export function getInputMonitorId(): string {
  return inputMonitorId
}

export function setInputMonitorId(value: string) {
  inputMonitorId = value
  saveSinkId(INPUT_MONITOR_KEY, value)
}

export function getLastReportedLatencyMs(): number {
  return lastReportedLatencyMs
}

export function prefersHeadphonesHint(): boolean {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  )
}

export function supportsAudioSinkSelect(): boolean {
  return (
    typeof AudioContext !== 'undefined' &&
    typeof (AudioContext.prototype as AudioContextWithSink).setSinkId ===
      'function'
  )
}

/**
 * Device pickers are desktop-only: on phones/tablets, browser I/O selection
 * is unreliable (missing Bluetooth, silent playback, OS-forced mic).
 */
export function allowsAudioDeviceSelect(): boolean {
  return !prefersHeadphonesHint()
}

export function allowsAudioSinkSelect(): boolean {
  return supportsAudioSinkSelect() && allowsAudioDeviceSelect()
}

export function currentAudioSinkMode(): AudioSinkMode {
  return appState === 'recording' ? 'monitor' : 'playback'
}

export function sinkIdForMode(mode: AudioSinkMode): string {
  if (!allowsAudioSinkSelect()) return ''
  return mode === 'monitor' ? sinkMonitorId : sinkPlaybackId
}

export function inputIdForCapture(): string {
  return allowsAudioDeviceSelect() ? inputMonitorId : ''
}

export async function applyAudioSink(mode: AudioSinkMode = currentAudioSinkMode()) {
  if (!supportsAudioSinkSelect() || !audioContext) return
  const ctx = audioContext as AudioContextWithSink
  const sinkId = sinkIdForMode(mode)
  try {
    await ctx.setSinkId(sinkId)
  } catch {
    // Device may have disappeared; fall back to default.
    if (sinkId) {
      try {
        await ctx.setSinkId('')
      } catch {
        // ignore
      }
    }
  }
}

/** Ask for mic access once so enumerateDevices can expose labels. */
export async function unlockAudioDeviceLabels(): Promise<void> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const inputs = devices.filter((device) => device.kind === 'audioinput')
    if (inputs.some((device) => device.label.trim())) return
  } catch {
    // continue and try getUserMedia
  }

  // Don't disturb an in-progress capture.
  if (mediaStream || appState === 'recording') return

  try {
    const probe = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    for (const track of probe.getTracks()) track.stop()
  } catch {
    // Permission denied or unavailable — lists stay unlabeled.
  }
}

/** Drop Chromium duplicate "default" / "communications" entries. */
export function toSelectableDeviceOptions(
  devices: MediaDeviceInfo[],
  fallbackLabel: string,
): SelectableDeviceOption[] {
  const options: SelectableDeviceOption[] = []
  for (const device of devices) {
    if (device.deviceId === 'default' || device.deviceId === 'communications') {
      continue
    }
    options.push({
      deviceId: device.deviceId,
      label:
        device.label?.trim() ||
        `${fallbackLabel} ${device.deviceId.slice(0, 6)}…`,
    })
  }
  return options
}

function coerceStoredDeviceId(
  storedId: string,
  devices: MediaDeviceInfo[],
): string {
  if (storedId === '') return ''
  const known = devices.some(
    (device) =>
      device.deviceId === storedId &&
      device.deviceId !== 'default' &&
      device.deviceId !== 'communications',
  )
  return known ? storedId : ''
}

/**
 * Enumerate inputs/outputs and reconcile stored device IDs.
 * Returns data for the UI — does not touch the DOM.
 */
export async function refreshAudioDevices(): Promise<AudioDevicesSnapshot> {
  const apiSupported = supportsAudioSinkSelect()
  const deviceSelectable = allowsAudioDeviceSelect()
  if (!deviceSelectable) {
    return {
      apiSupported,
      deviceSelectable,
      sinkSelectable: false,
      outputs: [],
      inputs: [],
      sinkMonitorId,
      sinkPlaybackId,
      inputMonitorId,
    }
  }

  await unlockAudioDeviceLabels()

  const sinkSelectable = allowsAudioSinkSelect()
  let outputs: MediaDeviceInfo[] = []
  let inputs: MediaDeviceInfo[] = []
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    outputs = devices.filter((device) => device.kind === 'audiooutput')
    inputs = devices.filter((device) => device.kind === 'audioinput')
  } catch {
    outputs = []
    inputs = []
  }

  if (sinkSelectable) {
    const nextMonitor = coerceStoredDeviceId(sinkMonitorId, outputs)
    if (nextMonitor !== sinkMonitorId) setSinkMonitorId(nextMonitor)
    const nextPlayback = coerceStoredDeviceId(sinkPlaybackId, outputs)
    if (nextPlayback !== sinkPlaybackId) setSinkPlaybackId(nextPlayback)
  }

  const nextInput = coerceStoredDeviceId(inputMonitorId, inputs)
  if (nextInput !== inputMonitorId) setInputMonitorId(nextInput)

  return {
    apiSupported,
    deviceSelectable,
    sinkSelectable,
    outputs,
    inputs,
    sinkMonitorId,
    sinkPlaybackId,
    inputMonitorId,
  }
}

export async function ensureAudioContext(): Promise<AudioContext> {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext()
  }
  // Do not auto-resume while the user explicitly paused the mix.
  if (audioContext.state === 'suspended' && !mixPaused) {
    await audioContext.resume()
  }
  await applyAudioSink()
  return audioContext
}

/**
 * Delay between scheduling audio and hearing it (headphones/speakers).
 * During overdub we start the monitor early by this amount so singing
 * lands on the same timeline as the recorder.
 */
export function getReportedLatencyMs(ctx: AudioContext): number {
  const output = typeof ctx.outputLatency === 'number' ? ctx.outputLatency : 0
  const base = typeof ctx.baseLatency === 'number' ? ctx.baseLatency : 0
  const reported = (Math.max(0, output) + Math.max(0, base)) * 1000
  if (reported >= 5) return Math.min(reported, 250)
  return DEFAULT_MONITOR_LATENCY_S * 1000
}

export function getMonitorLatencySec(ctx: AudioContext): number {
  lastReportedLatencyMs = Math.round(getReportedLatencyMs(ctx))
  const totalMs = Math.max(0, lastReportedLatencyMs + latencyTrimMs)
  return Math.min(totalMs / 1000, 0.3)
}

/** Effective monitor latency in ms (reported + user trim), floored at 0. */
export function getEffectiveLatencyMs(): number {
  return Math.max(0, lastReportedLatencyMs + latencyTrimMs)
}

export function stopPlaybackSources() {
  for (const source of playbackSources) {
    try {
      source.stop()
    } catch {
      // already stopped
    }
    try {
      source.disconnect()
    } catch {
      // already disconnected
    }
  }
  playbackSources = []
  if (playbackGain) {
    try {
      playbackGain.disconnect()
    } catch {
      // already disconnected
    }
    playbackGain = null
  }
}

export async function closeAudioContext() {
  stopMeterNodes()
  stopPlaybackSources()
  if (audioContext && audioContext.state !== 'closed') {
    await audioContext.close()
  }
  audioContext = null
}

export async function ensureMic(): Promise<EnsureMicResult> {
  const wantedId = inputIdForCapture()
  if (mediaStream) {
    const liveTrack = mediaStream
      .getAudioTracks()
      .find((track) => track.readyState === 'live')
    if (liveTrack) {
      const currentId = liveTrack.getSettings().deviceId ?? ''
      // Only reuse when the live track is confirmed to match the selection.
      // An empty currentId cannot prove a match for a specific deviceId.
      if (!wantedId) return { stream: mediaStream, inputOverrideNote: null }
      if (currentId && currentId === wantedId) {
        return { stream: mediaStream, inputOverrideNote: null }
      }
    }
    for (const track of mediaStream.getTracks()) track.stop()
    mediaStream = null
  }

  // Disable browser voice processing: with monitor playback, echoCancellation
  // and noiseSuppression make the next take metallic and very quiet.
  const base: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  }

  const open = (audio: MediaTrackConstraints) =>
    navigator.mediaDevices.getUserMedia({ audio })

  if (wantedId) {
    try {
      mediaStream = await open({ ...base, deviceId: { exact: wantedId } })
    } catch {
      try {
        mediaStream = await open({ ...base, deviceId: { ideal: wantedId } })
      } catch {
        mediaStream = await open(base)
      }
    }
  } else {
    mediaStream = await open(base)
  }

  const liveTrack = mediaStream
    .getAudioTracks()
    .find((track) => track.readyState === 'live')
  const actualId = liveTrack?.getSettings().deviceId ?? ''
  const actualLabel = liveTrack?.label?.trim() || ''

  let inputOverrideNote: string | null = null
  if (wantedId && actualId && actualId !== wantedId) {
    inputOverrideNote = actualLabel
      ? t('settings.devices.inputOverride', { label: actualLabel })
      : t('settings.devices.inputOverrideGeneric')
  }

  return { stream: mediaStream, inputOverrideNote }
}

export function releaseMic() {
  stopMeterNodes()
  if (!mediaStream) return
  for (const track of mediaStream.getTracks()) track.stop()
  mediaStream = null
}

export function stopMeterNodes() {
  if (meterRaf !== null) {
    cancelAnimationFrame(meterRaf)
    meterRaf = null
  }
  meterLevelCallback = null

  try {
    meterSource?.disconnect()
  } catch {
    // already disconnected
  }
  if (meterSource) {
    for (const track of meterSource.mediaStream.getAudioTracks()) {
      track.stop()
    }
  }
  meterSource = null
  analyser = null
}

export async function startMeter(
  stream: MediaStream,
  onLevel?: MeterLevelCallback,
): Promise<void> {
  stopMeterNodes()
  const ctx = await ensureAudioContext()
  meterLevelCallback = onLevel ?? null

  // Clone tracks so the analyser never touches the MediaRecorder input.
  const meterStream = new MediaStream(
    stream.getAudioTracks().map((track) => track.clone()),
  )
  meterSource = ctx.createMediaStreamSource(meterStream)
  analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  meterSource.connect(analyser)

  const data = new Uint8Array(analyser.frequencyBinCount)
  const tick = () => {
    if (!analyser) return
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (const value of data) {
      const centered = (value - 128) / 128
      sum += centered * centered
    }
    const rms = Math.sqrt(sum / data.length)
    const level = Math.min(100, Math.round(rms * 280))
    meterLevelCallback?.(level)
    meterRaf = requestAnimationFrame(tick)
  }
  meterRaf = requestAnimationFrame(tick)
}

export function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

export function clearOverdubArmTimer() {
  if (overdubArmTimer !== null) {
    window.clearTimeout(overdubArmTimer)
    overdubArmTimer = null
  }
}

export function discardPendingRecording() {
  clearOverdubArmTimer()
  if (!pendingRecording) return
  pendingRecording.recorder.removeEventListener(
    'dataavailable',
    pendingRecording.onData,
  )
  pendingRecording = null
}
