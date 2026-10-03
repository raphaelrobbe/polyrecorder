import type { Track, TrackAlignDetail } from '../../common/types'
import { formatCentisCompact } from '../format'
import { assessCountInBeat, findTakeThreeFourPeaks, findVolumePeaks } from '../audio/peaks.client'
import {
  DEFAULT_METRONOME_BPM,
  metronomeReferencePeaksSec,
} from '../audio/metronome.client'
import { decodeTrack, getSkipCountInStartS } from '../audio/mix.client'
import { isAutoAlignOffsetExcluded } from '../audio/runtime.client'
import { t } from '../i18n'
import {
  persistCloudTrackOffsets,
  schedulePersistAlignPrefs,
} from './cloudPersist.client'
import { scheduleGuestDraftSave } from './guest.client'
import {
  autoAlignableTracks,
  clearRefPeaks,
  getReferenceTrack,
} from './helpers.client'
import { refreshSkewWarning, setError, showNotice } from './modes.client'
import { withMixTransportPreserved } from './playback.client'
import { get, patch } from './state.client'
import { scheduleMixPeakRefresh } from './volumes.client'

export function applyReferencePeaksLabel(reference: Track, peaks: number[]) {
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
    // Punch-in / late starts: count-in peaks are not meaningful here.
    if (isAutoAlignOffsetExcluded(track.offsetMs)) continue

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

export function noteAlignAttention(trackId: number, message: string) {
  patch({
    alignAttentionByTrackId: {
      ...get().alignAttentionByTrackId,
      [trackId]: message,
    },
  })
}

export function alignErrorTrackId(
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
export async function maybeAutoAlignAfterTake(newTrackId: number): Promise<void> {
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

type AutoAlignUndoSnapshot = {
  offsets: Record<number, number>
  details: Record<number, TrackAlignDetail | undefined>
}

let autoAlignUndoSnapshot: AutoAlignUndoSnapshot | null = null

export function clearAutoAlignUndoSnapshot() {
  autoAlignUndoSnapshot = null
}

function captureAutoAlignUndoSnapshot(trackIds: ReadonlyArray<number>) {
  const { tracks, trackAlignDetails } = get()
  const offsets: Record<number, number> = {}
  const details: Record<number, TrackAlignDetail | undefined> = {}
  for (const id of trackIds) {
    const track = tracks.find((row) => row.id === id)
    if (!track) continue
    offsets[id] = track.offsetMs
    details[id] = trackAlignDetails[id]
  }
  autoAlignUndoSnapshot = { offsets, details }
}

function offerAutoAlignUndo() {
  const snapshot = autoAlignUndoSnapshot
  if (!snapshot || Object.keys(snapshot.offsets).length === 0) {
    clearAutoAlignUndoSnapshot()
    return
  }
  const { tracks } = get()
  const changed = tracks.some(
    (track) =>
      track.id in snapshot.offsets &&
      Math.round(track.offsetMs) !== Math.round(snapshot.offsets[track.id]!),
  )
  if (!changed) {
    clearAutoAlignUndoSnapshot()
    return
  }
  showNotice({
    id: `auto-align-undo-${Date.now()}`,
    message: t('tracks.autoAlign.undo.invite'),
    tone: 'align',
    action: 'undoAutoAlign',
  })
}

/** Restore offsets from the last manual auto-align invite (Annuler). */
export function undoLastAutoAlign(): void {
  const snapshot = autoAlignUndoSnapshot
  if (!snapshot) return
  clearAutoAlignUndoSnapshot()

  const ids = Object.keys(snapshot.offsets).map(Number)
  void withMixTransportPreserved(() => {
    const trackAlignDetails = { ...get().trackAlignDetails }
    const tracks = get().tracks.map((track) => {
      if (!(track.id in snapshot.offsets)) return track
      const prevDetail = snapshot.details[track.id]
      if (prevDetail === undefined) {
        delete trackAlignDetails[track.id]
      } else {
        trackAlignDetails[track.id] = prevDetail
      }
      return { ...track, offsetMs: snapshot.offsets[track.id]! }
    })
    patch({ tracks, trackAlignDetails })
    refreshSkewWarning()
    persistCloudTrackOffsets(ids)
    scheduleGuestDraftSave()
    scheduleMixPeakRefresh()
  })

  const notice = get().notice
  if (notice?.action === 'undoAutoAlign') {
    patch({ notice: null, noticeSuppressedId: null })
  }
}

/** Manual action: recalculate auto-align for one non-reference track. */
export async function realignTrack(trackId: number): Promise<void> {
  if (!get().autoAlignEnabled) return
  const track = get().tracks.find((row) => row.id === trackId)
  if (!track || isAutoAlignOffsetExcluded(track.offsetMs)) return
  setError(null)
  captureAutoAlignUndoSnapshot([trackId])
  try {
    await withMixTransportPreserved(() => autoAlignTracksFromCounts([trackId]))
    offerAutoAlignUndo()
  } catch (error) {
    clearAutoAlignUndoSnapshot()
    const message =
      error instanceof Error ? error.message : t('error.autoAlignFailed')
    noteAlignAttention(alignErrorTrackId(error, trackId) ?? trackId, message)
    throw error instanceof Error ? error : new Error(message)
  }
}

/** Manual action: recalculate auto-align for every eligible non-reference track. */
export async function realignAllTracks(): Promise<void> {
  if (!get().autoAlignEnabled) return
  const ids = autoAlignableTracks().map((track) => track.id)
  if (ids.length === 0) return
  setError(null)
  captureAutoAlignUndoSnapshot(ids)
  try {
    await withMixTransportPreserved(() => autoAlignTracksFromCounts(ids))
    offerAutoAlignUndo()
  } catch (error) {
    clearAutoAlignUndoSnapshot()
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
