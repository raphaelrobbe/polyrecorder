import type { ReferenceBeatWarning, Track } from '../../common/types'
import { isOffsetSkewWarning } from '../../lib/audio/runtime.client'
import { t } from '../../lib/i18n'
import { useSessionStore } from '../../store/sessionStore'

export type TrackRowAttention = {
  nameKey: string
  chipRail: boolean
  simpleDupChipColumn: boolean
  simpleMixChipColumn: boolean
  simpleCalageChipColumn: boolean
  mixChipColumn: boolean
  calageChipColumn: boolean
  showDuplicateNameChip: boolean
  showRecordClipChip: boolean
  showAttentionChip: boolean
  showBeatAttention: boolean
  attentionTitle: string
  attentionAria: string
  alignAttentionMessage: string | undefined
  referenceBeatWarning: ReferenceBeatWarning | null
}

/** Derive attention / chip-rail flags for a track row from store + track props. */
export function useTrackRowAttention(track: Track): TrackRowAttention {
  const calageMode = useSessionStore((s) => s.calageMode)
  const mixMode = useSessionStore((s) => s.mixMode)
  const cutMode = useSessionStore((s) => s.cutMode)
  const referenceTrackId = useSessionStore((s) => s.referenceTrackId)
  const tracks = useSessionStore((s) => s.tracks)
  const skewWarningDismissedKey = useSessionStore(
    (s) => s.skewWarningDismissedKey,
  )
  const referenceBeatWarning = useSessionStore((s) => s.referenceBeatWarning)
  const alignAttentionByTrackId = useSessionStore(
    (s) => s.alignAttentionByTrackId,
  )
  const trackClipById = useSessionStore((s) => s.trackClipById)
  const showCalageWarnings = useSessionStore((s) => s.showCalageWarnings)
  const autoAlignEnabled = useSessionStore((s) => s.autoAlignEnabled)

  const isReference = track.id === referenceTrackId
  const skewFingerprint = tracks
    .filter(
      (t) => t.id !== referenceTrackId && isOffsetSkewWarning(t.offsetMs),
    )
    .map((t) => `${t.id}:${Math.round(t.offsetMs)}`)
    .join('|')
  const skewActive =
    skewFingerprint.length > 0 &&
    skewFingerprint !== skewWarningDismissedKey
  const alignAttentionMessage = alignAttentionByTrackId[track.id]
  const isSimpleMode = !mixMode && !calageMode && !cutMode
  const beatWarningActive = referenceBeatWarning != null
  const showBeatAttention =
    beatWarningActive &&
    isReference &&
    showCalageWarnings &&
    autoAlignEnabled &&
    !mixMode &&
    !cutMode
  const showAlignAttention =
    Boolean(alignAttentionMessage) &&
    showCalageWarnings &&
    autoAlignEnabled &&
    (isSimpleMode || calageMode)
  const showSkewAttention =
    autoAlignEnabled &&
    showCalageWarnings &&
    skewActive &&
    !isReference &&
    (isSimpleMode || calageMode) &&
    isOffsetSkewWarning(track.offsetMs)
  const showAttentionChip =
    showSkewAttention || showAlignAttention || showBeatAttention
  const attentionTitle = showBeatAttention
    ? referenceBeatWarning!.message
    : (alignAttentionMessage ??
      t('warn.skew.long', { names: track.name }))
  const attentionAria = showBeatAttention
    ? t('warn.beat.chip.aria')
    : alignAttentionMessage
      ? t('warn.attention')
      : t('warn.skew.chip.aria', { name: track.name })
  const nameKey = track.name.trim().toLowerCase()
  const showDuplicateNameChip =
    isSimpleMode &&
    nameKey.length > 0 &&
    tracks.filter((t) => t.name.trim().toLowerCase() === nameKey).length > 1
  const showRecordClipChip =
    (isSimpleMode || mixMode) &&
    !track.isMetronome &&
    Boolean(trackClipById[track.id])
  /** Reserve chip columns so "!" line up across tracks. */
  const simpleDupChipColumn =
    isSimpleMode &&
    tracks.some((t) => {
      const key = t.name.trim().toLowerCase()
      if (!key) return false
      return tracks.filter((o) => o.name.trim().toLowerCase() === key).length > 1
    })
  const simpleMixChipColumn =
    isSimpleMode &&
    tracks.some((t) => !t.isMetronome && Boolean(trackClipById[t.id]))
  const simpleCalageChipColumn =
    isSimpleMode &&
    showCalageWarnings &&
    autoAlignEnabled &&
    (beatWarningActive ||
      Object.keys(alignAttentionByTrackId).length > 0 ||
      (skewActive &&
        tracks.some(
          (t) =>
            t.id !== referenceTrackId && isOffsetSkewWarning(t.offsetMs),
        )))
  const mixChipColumn =
    mixMode &&
    tracks.some((t) => !t.isMetronome && Boolean(trackClipById[t.id]))
  const calageChipColumn =
    calageMode &&
    showCalageWarnings &&
    autoAlignEnabled &&
    (beatWarningActive ||
      Object.keys(alignAttentionByTrackId).length > 0 ||
      (skewActive &&
        tracks.some(
          (t) =>
            t.id !== referenceTrackId && isOffsetSkewWarning(t.offsetMs),
        )))
  const chipRail =
    simpleDupChipColumn ||
    simpleMixChipColumn ||
    simpleCalageChipColumn ||
    mixChipColumn ||
    calageChipColumn

  return {
    nameKey,
    chipRail,
    simpleDupChipColumn,
    simpleMixChipColumn,
    simpleCalageChipColumn,
    mixChipColumn,
    calageChipColumn,
    showDuplicateNameChip,
    showRecordClipChip,
    showAttentionChip,
    showBeatAttention,
    attentionTitle,
    attentionAria,
    alignAttentionMessage,
    referenceBeatWarning,
  }
}
