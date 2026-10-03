import type { ActiveRecording, Track } from '../../common/types'
import { resolveImportTrackName } from '../audioImportName.client'
import { scheduleMetronomeClicks } from '../audio/metronome.client'
import { decodeTrack, scheduleTrackSource } from '../audio/mix.client'
import {
  applyAudioSink,
  closeAudioContext,
  discardPendingRecording,
  ensureAudioContext,
  ensureMic,
  getActiveRecording,
  getAudioContext,
  getMonitorLatencySec,
  getPendingRecording,
  getPlaybackGain,
  getPlaybackSources,
  getStartedAt,
  getTimerId,
  MAX_RECORDING_MS,
  MIX_LOOKAHEAD_S,
  pickMimeType,
  releaseMic,
  setActiveRecording,
  setPendingRecording,
  setOverdubArmTimer,
  setPlaybackGain,
  setPlaybackSources,
  setStartedAt,
  setTimerId,
  startMeter,
  stopMeterNodes,
} from '../audio/runtime.client'
import { audibleMixRange } from '../audio/segments.client'
import {
  defaultTrackName,
  formatCentis,
  formatTime,
  getMaxTrackDurationMs,
  getMixDurationMs,
} from '../format'
import { isCloudSignedIn } from '../cloudUpload.client'
import { t } from '../i18n'
import { markPwaUsefulSession } from '../pwaInstallPrefs'
import { evaluateReferenceBeat, maybeAutoAlignAfterTake } from './align.client'
import {
  armSimpleContentSyncOffer,
} from './contentSync.client'
import {
  isGuestSignInPromptDismissed,
  scheduleGuestDraftSave,
} from './guest.client'
import {
  clearPlayingIds,
  setMixPausedBoth,
  setTransportState,
  syncPlayingIds,
  updateSessionTimerDisplay,
} from './helpers.client'
import { refreshSkewWarning, setError } from './modes.client'
import {
  getMixPositionMs,
  playTracks,
  startPlayheadClock,
  stopPlayback,
  stopPlayheadClock,
} from './playback.client'
import {
  get,
  getMixEpochPerf,
  getMixTimelineStartCtx,
  getPendingTakeOffsetMs,
  getPendingTakePunchIn,
  getPendingTakeRestartMs,
  getPreferMimeType,
  patch,
  PUNCH_IN_POSITION_MS,
  setMixEpochPerf,
  setMixTimelineStartCtx,
  setPendingTakeOffsetMs,
  setPendingTakePunchIn,
  setPendingTakeRestartMs,
  setPreferMimeType,
  trackGains,
  trackPlayheads,
} from './state.client'
import {
  clampMasterVolume,
  liveTrackGainValue,
  refreshTrackClipFlags,
} from './volumes.client'
import { syncLatencyDisplay } from './devices.client'

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

export function stopTimer(): number {
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

function createRecording(stream: MediaStream): ActiveRecording {
  setPreferMimeType(pickMimeType())
  const preferMimeType = getPreferMimeType()
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
      const type = recorder.mimeType || getPreferMimeType() || 'audio/webm'
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
  setPendingTakeOffsetMs(options?.offsetMs ?? 0)
  setPendingTakePunchIn(false)
  setPendingTakeRestartMs(getPendingTakeOffsetMs())

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
    setPendingTakeOffsetMs(0)
    setPendingTakePunchIn(false)
    setPendingTakeRestartMs(0)
    setMixEpochPerf(null)
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

  const mixEpochPerf = performance.now() + lookaheadSec * 1000
  setMixEpochPerf(mixEpochPerf)
  setMixTimelineStartCtx(timelineStart)
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
      setMixTimelineStartCtx(null)
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
          const epochPerf = getMixEpochPerf()
          setPendingTakeOffsetMs(
            epochPerf !== null ? recordPerf - epochPerf : 0,
          )
          setPendingTakePunchIn(false)
          setPendingTakeRestartMs(0)
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
  const offsetMs = getPendingTakeOffsetMs()
  const punchIn = getPendingTakePunchIn()
  setPendingTakeOffsetMs(0)
  setPendingTakePunchIn(false)
  setPendingTakeRestartMs(0)

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
  void import('../cloudUpload.client').then((mod) =>
    mod.maybeAutoUploadTrack(track.id),
  )
  scheduleGuestDraftSave()
  markPwaUsefulSession()
  void refreshTrackClipFlags([track.id])
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

export async function abortCurrentTake(options?: {
  seekToMs?: number
}): Promise<void> {
  const seekToMs = Math.max(0, options?.seekToMs ?? 0)
  discardPendingRecording()
  stopPlayback({ resetSeek: false })
  stopMeterNodes()
  patch({ meterLevel: 0 })
  stopTimer()
  setPendingTakeOffsetMs(0)
  setPendingTakePunchIn(false)
  setPendingTakeRestartMs(0)
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
    const restartAtMs = getPendingTakeRestartMs()
    const restartPunchIn =
      getPendingTakePunchIn() || restartAtMs > PUNCH_IN_POSITION_MS
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
  setPendingTakeOffsetMs(Math.max(0, posAtStart - latencySec * 1000))
  setPendingTakePunchIn(true)
  setPendingTakeRestartMs(Math.max(0, posAtStart))

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
  const mixTimelineStartCtx = getMixTimelineStartCtx()
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
    setPendingTakeOffsetMs(0)
    setPendingTakePunchIn(false)
    setPendingTakeRestartMs(0)
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
        setPendingTakeOffsetMs(0)
        setPendingTakePunchIn(false)
        setPendingTakeRestartMs(0)
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
