import type { Track } from '../../common/types'
import {
  downloadFilenameForSelection,
  formatCentis,
  getMixDurationMs,
} from '../format'
import { scheduleMetronomeClicks } from '../audio/metronome.client'
import {
  decodeTrack,
  renderSelectedMixBuffer,
  scheduleTrackSource,
  trimAudioBufferFrom,
} from '../audio/mix.client'
import { connectPlaybackBus } from '../audio/pitchPreserve.client'
import {
  ensureAudioContext,
  getAudioContext,
  getMixPaused,
  getPlaybackSources,
  getPlayheadRaf,
  MIX_LOOKAHEAD_S,
  setPlaybackGain,
  setPlaybackSources,
  setPlayheadRaf,
  stopPlaybackSources,
} from '../audio/runtime.client'
import {
  beginSaveWithMemory,
  downloadBlobLegacy,
  writeSaveTarget,
} from '../fileSystemMemory.client'
import { t } from '../i18n'
import { applySkipCountInStartMs, getSkipCountInStartSec } from './align.client'
import {
  clearPlayingIds,
  selectedTracks,
  setMixPausedBoth,
  syncPlayingIds,
} from './helpers.client'
import { setError } from './modes.client'
import {
  get,
  getMixTimelineStartCtx,
  getPlayWaiters,
  patch,
  setMixEpochPerf,
  setMixTimelineStartCtx,
  setPlayWaiters,
  trackGains,
  trackPlayheads,
} from './state.client'
import {
  clampMasterVolume,
  getTrackVolume,
  liveTrackGainValue,
} from './volumes.client'

function settlePlayWaiters() {
  const waiters = getPlayWaiters()
  setPlayWaiters([])
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
  const mixTimelineStartCtx = getMixTimelineStartCtx()
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
  if (getMixTimelineStartCtx() !== null) {
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
  setMixEpochPerf(null)
  setMixTimelineStartCtx(null)

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

/**
 * Stop mix briefly for an align/offset change, keep the playhead, then
 * resume (or re-pause) at the same position.
 */
export async function withMixTransportPreserved(
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
    const { encodeAudioBufferToMp3 } = await import('../../mp3-encode.client')
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
  setMixEpochPerf(
    performance.now() + MIX_LOOKAHEAD_S * 1000 - startAtMs / playbackRate,
  )
  setMixTimelineStartCtx(timelineStart - startAtMs / (1000 * playbackRate))
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
      setPlayWaiters(
        getPlayWaiters().filter((waiter) => waiter !== resolveAsDone),
      )
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
        getPlayWaiters().push(resolveAsDone)
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
      getPlayWaiters().push(resolveAsDone)
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
    if (audioContext && getMixTimelineStartCtx() !== null) {
      setMixTimelineStartCtx(audioContext.currentTime - target / (1000 * rate))
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
