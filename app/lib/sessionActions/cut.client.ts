import type { Track } from '../../common/types'
import {
  audibleMixRange,
  bufferRangeFromMix,
  mergeMuteRanges,
  newSegmentId,
  segmentsOverlap,
  splitSegmentsAtPlayhead,
} from '../audio/segments.client'
import {
  clearBufferCache,
  getAudioContext,
  getPlaybackSources,
} from '../audio/runtime.client'
import { t } from '../i18n'
import { markPwaUsefulSession } from '../pwaInstallPrefs'
import { persistCloudTrackMuteRanges } from './cloudPersist.client'
import { scheduleGuestDraftSave } from './guest.client'
import { setMixPausedBoth, updateSessionTimerDisplay } from './helpers.client'
import { setError } from './modes.client'
import {
  getMixPositionMs,
  playTracks,
  tickClockDisplays,
} from './playback.client'
import { get, getMixTimelineStartCtx, patch } from './state.client'
import { deleteTrack, setTrackEnabled } from './tracks.client'
import { refreshTrackClipFlags } from './volumes.client'

export function buildInitialCutWorkState(): {
  cutWorkSegments: Record<number, import('../../common/types').CutWorkSegment[]>
  cutSelectedTrackIds: number[]
} {
  const cutWorkSegments: Record<
    number,
    import('../../common/types').CutWorkSegment[]
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
  const next: Record<number, import('../../common/types').CutWorkSegment[]> = {}
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
  if (audioContext && getMixTimelineStartCtx() !== null) {
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
  const next: Record<number, import('../../common/types').CutWorkSegment[]> = {}
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
  void import('../cloudUpload.client').then((mod) =>
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
    const pendingSeg: import('../../common/types').CutWorkSegment = {
      id: newSegmentId(),
      startMs: offsetMs,
      endMs: offsetMs + durationMs,
      selected: false,
    }
    const cleared: Record<
      number,
      import('../../common/types').CutWorkSegment[]
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
    } = await import('../audio/encodeMerge.client')

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
