import type { ActiveRecording, AppState, Track, TrackPlayhead } from '../types'
import {
  defaultTrackName,
  downloadFilenameForSelection,
  formatCentis,
  formatCentisCompact,
  formatTime,
  getMaxTrackDurationMs,
  getMixDurationMs,
  normalizeSessionTitle,
} from './format'
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
} from './audio/runtime'
import {
  decodeTrack,
  getSkipCountInStartS,
  MASTER_VOLUME_MAX,
  renderSelectedMixBuffer,
  scheduleTrackSource,
  TRACK_VOLUME_MAX,
  trimAudioBufferFrom,
} from './audio/mix'
import {
  assessCountInBeat,
  findTakeThreeFourPeaks,
  findVolumePeaks,
} from './audio/peaks'
import { encodeAudioBufferToMp3 } from '../mp3-encode'
import { useSessionStore, type SessionStoreState } from '../store/sessionStore'

// --- Module-private live playback maps (not in Zustand) ---

let trackGains = new Map<number, GainNode>()
let trackPlayheads = new Map<number, TrackPlayhead>()
let playWaiters: Array<() => void> = []
let preferMimeType = ''
let pendingTakeOffsetMs = 0
let mixEpochPerf: number | null = null
let mixTimelineStartCtx: number | null = null
/** 4th count-in peak time (seconds) in the reference track buffer. */
let refPeakFourSec: number | null = null

function patch(partial: Partial<SessionStoreState>): void {
  useSessionStore.setState(partial)
}

function get() {
  return useSessionStore.getState()
}

function setTransportState(state: AppState) {
  setAppAudioState(state)
  patch({ state, hint: computeHint(state, get().tracks.length) })
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
      return 'Casque conseillé : sans casque, le micro peut reprendre le son des haut-parleurs et fausser le calage.'
    }
    return 'Casque conseillé. Monitoring compensé pour la latence audio.'
  }
  return 'Écoute en cours.'
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
  refPeakFourSec = null
  patch({
    refPeaksLabel: '',
    referenceBeatWarning: null,
    referenceBeatDismissedKey: '',
  })
}

export function syncReferenceTrackRules() {
  const { tracks, referenceTrackId, autoAlignTrackIds, trackAlignDetails } =
    get()

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

  const nextAutoAlign = autoAlignTrackIds.filter((id) => id !== nextReferenceId)
  const nextDetails = { ...trackAlignDetails }
  delete nextDetails[nextReferenceId!]
  if (tracks.length < 2) {
    for (const key of Object.keys(nextDetails)) {
      delete nextDetails[Number(key)]
    }
  }

  patch({
    referenceTrackId: nextReferenceId,
    autoAlignTrackIds: nextAutoAlign,
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
  } = get()

  if (
    referenceBeatWarning &&
    referenceBeatWarning.key !== referenceBeatDismissedKey
  ) {
    patch({
      skewWarningMessage: referenceBeatWarning.message,
      skewWarningShowOpenAdvanced:
        !calageMode && referenceBeatWarning.reason !== 'missing',
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
    })
    return
  }

  const key = skewFingerprint(skewed)
  if (key === skewWarningDismissedKey) {
    patch({ skewWarningMessage: null })
    return
  }

  const names = skewed.map(({ track }) => track.name).join(', ')
  patch({
    skewWarningMessage: calageMode
      ? `Calage auto élevé sur ${names}.`
      : `Calage auto élevé sur ${names}. Vérifie le sync en mode calage.`,
    skewWarningShowOpenAdvanced: !calageMode,
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
    refPeakFourSec = null
    patch({ refPeaksLabel: '' })
    return
  }

  refPeakFourSec = peaks.length >= 4 ? peaks[3]! : null
  const times = peaks
    .map((peak) => formatCentisCompact(peak * 1000))
    .join(' · ')

  if (peaks.length >= 4) {
    const gapsMs = [1, 2, 3].map((index) =>
      Math.round((peaks[index]! - peaks[index - 1]!) * 1000),
    )
    patch({
      refPeaksLabel: `1-2-3-4 (${reference.name}) : ${times}\nécarts ${gapsMs.join(' / ')} ms`,
    })
  } else {
    patch({
      refPeaksLabel: `Battue 1-2-3-4 (${reference.name}) : ${times} (${peaks.length}/4)`,
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
  patch({ mixMode: false })
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
}

export function setMasterVolume(volume: number) {
  const next = clampMasterVolume(volume)
  patch({ masterVolume: next })
  const master = getPlaybackGain()
  if (master) {
    master.gain.value = next
  }
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
    outputOptions: toSelectableDeviceOptions(snapshot.outputs, 'Sortie'),
    inputOptions: toSelectableDeviceOptions(snapshot.inputs, 'Micro'),
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
  })
  const existing = getTimerId()
  if (existing !== null) window.clearInterval(existing)
  const id = window.setInterval(() => {
    const elapsed = performance.now() - getStartedAt()
    patch({ timerText: formatTime(elapsed) })
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
}

export function applyManualTrackOffset(trackId: number, offsetMs: number) {
  const wasListening =
    get().mixListenActive || get().playingTrackIds.length > 0
  if (wasListening) stopPlayback({ resetSeek: false })

  const tracks = get().tracks.map((track) =>
    track.id === trackId ? { ...track, offsetMs } : track,
  )
  const autoAlignTrackIds = get().autoAlignTrackIds.filter(
    (id) => id !== trackId,
  )
  const trackAlignDetails = { ...get().trackAlignDetails }
  delete trackAlignDetails[trackId]
  patch({ tracks, autoAlignTrackIds, trackAlignDetails })
  refreshSkewWarning()
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
          message: `Battue 1-2-3-4 irrégulière ou non détectée sur la piste de référence (${reference.name}).`,
          reason: 'irregular',
        },
      })
    } else {
      patch({
        referenceBeatWarning: {
          key: `beat:${reference.id}:missing:${peaks.length}`,
          message: `Battue 1-2-3-4 non détectée sur « ${reference.name} » (${peaks.length}/4 attaques).`,
          reason: 'missing',
        },
      })
    }
  } catch {
    patch({
      referenceBeatWarning: {
        key: `beat:${reference.id}:error`,
        message: `Impossible d'analyser la battue de « ${reference.name} ».`,
        reason: 'error',
      },
    })
  }

  refreshSkewWarning()
}

/**
 * Align later takes on the reference using shared "3-4" counts.
 * Reference must contain 1-2-3-4; later tracks should contain 3-4 in sync.
 */
export async function autoAlignTracksFromCounts(): Promise<void> {
  const { tracks, autoAlignTrackIds, trackAlignDetails } = get()
  if (tracks.length < 2) {
    throw new Error('Il faut au moins deux pistes pour caler.')
  }

  const reference = getReferenceTrack()
  if (!reference) {
    throw new Error('Piste de référence manquante.')
  }

  const refBuffer = await decodeTrack(reference)
  const refPeaks = findVolumePeaks(refBuffer, 4)
  if (refPeaks.length < 4) {
    throw new Error(
      `${reference.name} : ${refPeaks.length}/4 attaques trouvées. Fais 4 sons bien espacés (voix ou claquements).`,
    )
  }

  const refThree = refPeaks[2]!
  const refFour = refPeaks[3]!
  applyReferencePeaksLabel(reference, refPeaks)

  const autoAlign = new Set(autoAlignTrackIds)
  const nextTracks = tracks.map((track) => ({ ...track }))
  const nextDetails = { ...trackAlignDetails }

  for (const track of nextTracks) {
    if (track.id === reference.id) continue
    if (!autoAlign.has(track.id)) continue

    const buffer = await decodeTrack(track)
    const peaks = findVolumePeaks(buffer, 8)
    const pair = findTakeThreeFourPeaks(peaks, refThree, refFour)
    if (!pair) {
      throw new Error(
        `${track.name} : ${peaks.length}/2 attaques trouvées. Fais 2 sons nets pour « 3 4 » (voix ou claquements).`,
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
  }

  patch({ tracks: nextTracks, trackAlignDetails: nextDetails })
  refreshSkewWarning()
}

async function maybeAutoAlignAfterTake(): Promise<void> {
  if (get().tracks.length < 2) return
  const hasTargets = alignableTracks().some((track) =>
    get().autoAlignTrackIds.includes(track.id),
  )
  if (!hasTargets) return
  try {
    await autoAlignTracksFromCounts()
  } catch (error) {
    setError(
      error instanceof Error
        ? `Calage auto reporté : ${error.message}`
        : 'Calage auto reporté.',
    )
  }
}

/** Mix-timeline cut just after the reference "4", with pad (seconds). */
export async function getSkipCountInStartSec(): Promise<number> {
  const reference = getReferenceTrack()
  if (!reference) {
    throw new Error('Piste de référence manquante.')
  }

  let fourSec = refPeakFourSec
  let peaks: number[] | undefined
  if (fourSec == null) {
    const buffer = await decodeTrack(reference)
    peaks = findVolumePeaks(buffer, 4)
    if (peaks.length < 4) {
      throw new Error(
        `${reference.name} : ${peaks.length}/4 attaques trouvées. Fais 4 sons bien espacés pour supprimer le 1-2-3-4.`,
      )
    }
    applyReferencePeaksLabel(reference, peaks)
    fourSec = peaks[3]!
  }

  return getSkipCountInStartS({
    reference,
    peakFourSec: fourSec,
    peaks,
  })
}

/** Raise a mix start so playback begins after the count-in when enabled. */
export async function applySkipCountInStartMs(
  startAtMs: number,
): Promise<number> {
  const clamped = Math.max(0, startAtMs)
  if (!get().skipCountInPlayback || clamped > 0) return clamped
  try {
    const cutMs = (await getSkipCountInStartSec()) * 1000
    return Math.max(clamped, cutMs)
  } catch {
    return clamped
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export async function downloadSelectedMix() {
  if (get().mixExporting) return
  const selected = selectedTracks().filter((track) => track.blob.size > 0)
  if (selected.length === 0) {
    setError('Sélectionne au moins une piste à exporter.')
    return
  }

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
      if (cutS >= mixed.duration - 0.05) {
        throw new Error(
          'Le « 4 » est trop près de la fin : rien à exporter après le décompte.',
        )
      }
      mixed = trimAudioBufferFrom(mixed, cutS)
    }
    const mp3 = await encodeAudioBufferToMp3(mixed, 192)
    downloadBlob(
      mp3,
      downloadFilenameForSelection(
        get().sessionTitle,
        selected,
        get().tracks.length,
      ),
    )
  } catch (error) {
    setError(
      error instanceof Error ? error.message : 'Export MP3 impossible.',
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
    return Promise.reject(new Error('Piste vide, rien à lire.'))
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
      reject(new Error("L'enregistrement a échoué."))
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
          : new Error("L'enregistrement a échoué."),
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
              : new Error("Impossible de démarrer l'enregistrement."),
          )
        }
      }, armDelayMs),
    )
  })
}

export async function finalizeCurrentTake(): Promise<Track> {
  const active = getActiveRecording()
  if (!active || active.recorder.state === 'inactive') {
    throw new Error('Aucun enregistrement en cours.')
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
    throw new Error("Aucune donnée audio capturée. Réessaie l'enregistrement.")
  }

  const trackCounter = get().trackCounter + 1
  const tracks = get().tracks
  const track: Track = {
    id: trackCounter,
    name: defaultTrackName(tracks.length + 1),
    blob,
    url: URL.createObjectURL(blob),
    durationMs,
    offsetMs,
  }

  const becameReference = get().referenceTrackId == null
  const enabledTrackIds = [...get().enabledTrackIds, track.id]
  let autoAlignTrackIds = get().autoAlignTrackIds
  let referenceTrackId = get().referenceTrackId

  if (becameReference) {
    referenceTrackId = track.id
  } else {
    autoAlignTrackIds = [...autoAlignTrackIds, track.id]
  }

  patch({
    trackCounter,
    tracks: [...tracks, track],
    enabledTrackIds,
    autoAlignTrackIds,
    referenceTrackId,
    trackVolumes: { ...get().trackVolumes, [track.id]: 1 },
  })
  updateSessionTimerDisplay()

  if (becameReference || track.id === referenceTrackId) {
    await evaluateReferenceBeat()
  }
  await maybeAutoAlignAfterTake()
  return track
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
        : 'Impossible de recommencer la prise.',
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
        : "Impossible d'accéder au micro.",
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
        : 'Impossible de passer à la piste suivante.',
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
        : "Impossible d'arrêter proprement.",
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
      setError(error instanceof Error ? error.message : 'Lecture impossible.')
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
    setError(error instanceof Error ? error.message : 'Lecture impossible.')
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
          : 'Impossible de mettre en pause.',
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
    setError(error instanceof Error ? error.message : 'Lecture impossible.')
  })
}

export function setTrackEnabled(trackId: number, enabled: boolean) {
  const enabledSet = new Set(get().enabledTrackIds)
  if (enabled) enabledSet.add(trackId)
  else enabledSet.delete(trackId)
  patch({ enabledTrackIds: [...enabledSet] })
  setTrackAudible(trackId, enabled)
}

export function setAllTracksEnabled(enabled: boolean) {
  const { tracks } = get()
  const enabledTrackIds = enabled ? tracks.map((track) => track.id) : []
  patch({ enabledTrackIds })
  for (const track of tracks) {
    setTrackAudible(track.id, enabled)
  }
}

export function setTrackAutoAlign(trackId: number, on: boolean) {
  const autoAlign = new Set(get().autoAlignTrackIds)
  if (on) autoAlign.add(trackId)
  else autoAlign.delete(trackId)
  const trackAlignDetails = { ...get().trackAlignDetails }
  if (!on) delete trackAlignDetails[trackId]
  patch({
    autoAlignTrackIds: [...autoAlign],
    trackAlignDetails,
  })
}

export function setAllAutoAlign(on: boolean) {
  const alignable = alignableTracks()
  if (!on) {
    const wasListening =
      get().mixListenActive || get().playingTrackIds.length > 0
    if (wasListening) stopPlayback({ resetSeek: false })
    const clearIds = new Set(alignable.map((track) => track.id))
    const tracks = get().tracks.map((track) =>
      clearIds.has(track.id) ? { ...track, offsetMs: 0 } : track,
    )
    const trackAlignDetails = { ...get().trackAlignDetails }
    for (const id of clearIds) delete trackAlignDetails[id]
    patch({
      tracks,
      autoAlignTrackIds: get().autoAlignTrackIds.filter(
        (id) => !clearIds.has(id),
      ),
      trackAlignDetails,
    })
    refreshSkewWarning()
    return
  }

  const autoAlignTrackIds = [
    ...new Set([
      ...get().autoAlignTrackIds,
      ...alignable.map((track) => track.id),
    ]),
  ]
  patch({ autoAlignTrackIds })
  void (async () => {
    try {
      setError(null)
      await autoAlignTracksFromCounts()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Calage auto impossible.',
      )
    }
  })()
}

export function renameTrack(trackId: number, name: string) {
  const trimmed = name.trim().slice(0, 40) || defaultTrackName(1)
  patch({
    tracks: get().tracks.map((track) =>
      track.id === trackId ? { ...track, name: trimmed } : track,
    ),
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
  patch({
    tracks,
    enabledTrackIds: get().enabledTrackIds.filter((id) => id !== trackId),
    autoAlignTrackIds: get().autoAlignTrackIds.filter((id) => id !== trackId),
    trackAlignDetails,
    trackVolumes,
    ...(tracks.length === 0
      ? { calageMode: false, mixMode: false, calageTipOpen: false }
      : {}),
  })
  syncReferenceTrackRules()
  updateSessionTimerDisplay()
  refreshSkewWarning()
  if (get().referenceTrackId != null) void evaluateReferenceBeat()
}

export function deleteAllTracks() {
  if (get().state === 'recording') return
  stopPlayback({ resetSeek: true })
  for (const track of get().tracks) {
    URL.revokeObjectURL(track.url)
  }
  clearBufferCache()
  trackGains.clear()
  trackPlayheads.clear()
  patch({
    tracks: [],
    enabledTrackIds: [],
    autoAlignTrackIds: [],
    playingTrackIds: [],
    referenceTrackId: null,
    trackAlignDetails: {},
    trackVolumes: {},
    masterVolume: 1,
    trackCounter: 0,
    calageMode: false,
    mixMode: false,
    mixSeekMs: 0,
    mixClockText: '00:00.000',
  })
  clearRefPeaks()
  updateSessionTimerDisplay()
  refreshSkewWarning()
}

export function normalizeAndSetSessionTitle(raw: string) {
  patch({ sessionTitle: normalizeSessionTitle(raw) })
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
