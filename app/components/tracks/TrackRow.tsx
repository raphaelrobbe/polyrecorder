import { useEffect, useLayoutEffect, useState } from 'react'
import { formatPseudoHandle } from '../../common/user'
import type { Track } from '../../common/types'
import {
  defaultTrackName,
  formatAlignDetail,
  formatCentis,
  formatTime,
  getMixDurationMs,
  isDefaultTrackName,
} from '../../lib/format'
import { TRACK_VOLUME_MAX } from '../../lib/audio/mix.client'
import {
  isAutoAlignOffsetExcluded,
  isOffsetSkewWarning,
} from '../../lib/audio/runtime.client'
import {
  applyManualTrackOffset,
  beginContentSyncPick,
  beginReferencePick,
  completeContentSyncAgainst,
  consumeMetronomeBpmFocusRequest,
  createOrUpdateMetronome,
  deleteTrack,
  getTrackPositionMs,
  getTrackVolume,
  realignTrack,
  renameTrack,
  setError,
  setReferenceTrack,
  setTrackEnabled,
  setTrackVolume,
  setCalageMode,
  setMixMode,
  seekMixTo,
  showNotice,
  flushVolumeCloudPersist,
  toggleCutSegmentSelected,
  toggleTrackHighlight,
  trackOffersContentSync,
} from '../../lib/sessionActions.client'
import {
  clampMetronomeBpm,
  DEFAULT_METRONOME_BPM,
} from '../../lib/audio/metronome.client'
import { audibleMixRange } from '../../lib/audio/segments.client'
import { uploadTrackToCloud } from '../../lib/cloudUpload.client'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import type { loader as rootLoader } from '../../root'
import { useSessionStore } from '../../store/sessionStore'
import { useRouteLoaderData } from '@remix-run/react'
import { Button } from '../Button'
import { IconAutoAlign, IconCloudSave, IconHighlight, IconTrash } from '../icons'
import { MsOffsetEditor } from '../MsOffsetEditor'
import { NudgeValueField } from '../NudgeValueField'
import { VolumeRibbon } from '../VolumeRibbon'
import { TrackDragHandle } from './TrackDragHandle'
import { CutMuteBars } from './CutMuteBars'
import { TrackMute } from './TrackMute'
import { TrackNameInput } from './TrackNameInput'

type TrackRowProps = {
  track: Track
  index: number
  isDragging: boolean
  dragOver: 'before' | 'after' | null
  className?: string
}

export function TrackRow({
  track,
  index,
  isDragging,
  dragOver,
  className,
}: TrackRowProps) {
  useLocale()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const calageMode = useSessionStore((s) => s.calageMode)
  const mixMode = useSessionStore((s) => s.mixMode)
  const cutMode = useSessionStore((s) => s.cutMode)
  const cutPhase = useSessionStore((s) => s.cutPhase)
  const cutWorkSegments = useSessionStore((s) => s.cutWorkSegments)
  const cutMerging = useSessionStore((s) => s.cutMerging)
  const cutMergeTrackId = useSessionStore((s) => s.cutMergeTrackId)
  const cutMergeProgress = useSessionStore((s) => s.cutMergeProgress)
  const appState = useSessionStore((s) => s.state)
  const readOnlySession = useSessionStore((s) => s.readOnlySession)
  const canCloudContribute = useSessionStore((s) => s.canCloudContribute)
  const enabledTrackIds = useSessionStore((s) => s.enabledTrackIds)
  const referenceTrackId = useSessionStore((s) => s.referenceTrackId)
  const trackAlignDetails = useSessionStore((s) => s.trackAlignDetails)
  const trackVolumes = useSessionStore((s) => s.trackVolumes)
  const highlightedTrackIds = useSessionStore((s) => s.highlightedTrackIds)
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
  const metronomeBpm = useSessionStore((s) => s.metronomeBpm)
  const contentSyncPickFromId = useSessionStore((s) => s.contentSyncPickFromId)
  const contentSyncSimpleOfferUntil = useSessionStore(
    (s) => s.contentSyncSimpleOfferUntil,
  )
  const contentSyncInvite = useSessionStore((s) => s.contentSyncInvite)
  const referencePickActive = useSessionStore((s) => s.referencePickActive)
  const mixSeekMs = useSessionStore((s) => s.mixSeekMs)
  const setSeekDragActive = useSessionStore((s) => s.setSeekDragActive)
  const patch = useSessionStore((s) => s.patch)
  // Re-render on playhead ticks so clocks + span seek caret stay live.
  useSessionStore((s) => s.mixClockText)

  const isEnabled = enabledTrackIds.includes(track.id)
  const isReference = track.id === referenceTrackId
  const isHighlighted = highlightedTrackIds.includes(track.id)
  const alignDetail = trackAlignDetails[track.id]
  const alignDetailText =
    alignDetail && !isReference
      ? formatAlignDetail(track.offsetMs, alignDetail)
      : ''
  const clock = formatCentis(getTrackPositionMs(track.id))
  const volume = trackVolumes[track.id] ?? getTrackVolume(track.id)
  const cutEditing = cutMode && cutPhase === 'edit'
  const contentSyncPickActive = contentSyncPickFromId != null
  const pickActive = contentSyncPickActive || referencePickActive
  const showTitleDelete = !pickActive
  const showDragHandle =
    !calageMode && !mixMode && !cutEditing && !pickActive && !contentSyncInvite
  const uploaderHandle = formatPseudoHandle(track.uploadedByPseudo)
  const uploaderIsMe =
    track.cloudOwnedByMe === true ||
    (user != null &&
      Boolean(track.uploadedByPseudo) &&
      user.pseudo.trim().toLowerCase() ===
        track.uploadedByPseudo!.trim().toLowerCase())
  const uploaderLabel = uploaderIsMe
    ? t('tracks.uploadedBy.me')
    : uploaderHandle
  const showUploader =
    Boolean(uploaderLabel) &&
    (readOnlySession ||
      tracks.some(
        (t) => Boolean(t.uploadedByPseudo) && t.cloudOwnedByMe === false,
      ))
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
  const chipSlotClass =
    'grid h-[1.65rem] w-[1.65rem] shrink-0 place-items-center max-sm:h-[1.45rem] max-sm:w-[1.45rem]'
  /** Match trash control size/radius; beat Button `trash` max-sm defaults. */
  const chipBtnClass =
    'h-full w-full max-sm:!h-full max-sm:!w-full rounded-lg max-sm:rounded-lg p-0 text-[0.78rem] font-extrabold leading-none max-sm:text-[0.7rem]'
  const dupChipButton = showDuplicateNameChip ? (
    <Button
      variant="trash"
      className={cn(
        chipBtnClass,
        'border-ink/28 bg-ink/8 text-ink',
        'hover:enabled:border-ink/35 hover:enabled:bg-ink/12 hover:enabled:text-ink',
      )}
      title={t('warn.duplicateName.hint')}
      aria-label={t('warn.duplicateName.aria', { name: track.name })}
      onClick={() => {
        showNotice({
          id: `dup:${nameKey}`,
          message: t('warn.duplicateName.hint'),
          tone: 'simple',
        })
        const input = document.querySelector<HTMLInputElement>(
          `input[data-rename-track="${track.id}"]`,
        )
        input?.focus()
        input?.select()
      }}
    >
      !
    </Button>
  ) : null
  const mixChipButton = showRecordClipChip ? (
    <Button
      variant="trash"
      className={cn(
        chipBtnClass,
        'border-mode-mix-border bg-mode-mix-bg text-mode-mix',
        'hover:enabled:border-mode-mix-border hover:enabled:bg-mode-mix-hover hover:enabled:text-mode-mix',
      )}
      title={t('mix.clip.record.hint')}
      aria-label={t('mix.clip.record.aria')}
      onClick={() => {
        if (!mixMode) setMixMode(true)
        showNotice({
          id: `mix-clip:${track.id}`,
          message: t('mix.clip.record.hint'),
          tone: 'mix',
        })
      }}
    >
      !
    </Button>
  ) : null
  const calageChipButton = showAttentionChip ? (
    <Button
      variant="trash"
      className={cn(
        chipBtnClass,
        'border-mode-align-border bg-mode-align-bg text-mode-align',
        'hover:enabled:border-mode-align-border hover:enabled:bg-mode-align-hover hover:enabled:text-mode-align',
      )}
      title={attentionTitle}
      aria-label={attentionAria}
      onClick={() => {
        if (showBeatAttention && referenceBeatWarning) {
          showNotice({
            id: referenceBeatWarning.key,
            message: referenceBeatWarning.message,
            tone: 'align',
            action: 'disableAutoAlign',
          })
        } else if (alignAttentionMessage) {
          showNotice({
            id: `align:${track.id}`,
            message: alignAttentionMessage,
            tone: 'align',
          })
        } else {
          showNotice({
            id: `skew:${track.id}`,
            message: t('warn.skew.long', { names: track.name }),
            tone: 'align',
          })
        }
        if (!calageMode) setCalageMode(true)
      }}
    >
      !
    </Button>
  ) : null
  const showCloudSave =
    (!readOnlySession || canCloudContribute) &&
    user != null &&
    !track.isMetronome &&
    (track.cloudStatus === 'local' ||
      track.cloudStatus === 'error' ||
      track.cloudStatus == null)
  const cloudUploading = track.cloudStatus === 'uploading'
  const deleteDisabled =
    isReference &&
    autoAlignEnabled &&
    !track.isMetronome &&
    tracks.filter((t) => !t.isMetronome).length > 1
  const deleteTitle = deleteDisabled
    ? t('tracks.delete.referenceLocked')
    : t('common.delete')

  const offersContentSync = trackOffersContentSync(track)
  const isContentSyncSource = contentSyncPickFromId === track.id
  const isContentSyncTarget =
    contentSyncPickActive &&
    contentSyncPickFromId !== track.id &&
    !track.isMetronome
  const isReferencePickSource = referencePickActive && isReference
  const isReferencePickTarget = referencePickActive && !isReference
  const isPickSource = isContentSyncSource || isReferencePickSource
  const isPickTarget = isContentSyncTarget || isReferencePickTarget
  const simpleContentSyncOffer =
    contentSyncSimpleOfferUntil > 0 &&
    contentSyncSimpleOfferUntil > Date.now()
  const showContentSyncButton =
    offersContentSync &&
    !cutEditing &&
    (!pickActive || isContentSyncSource) &&
    (calageMode ||
      (isSimpleMode && (simpleContentSyncOffer || isContentSyncSource)))
  const inviteActive = contentSyncInvite != null
  const isSyncFocusTrack =
    inviteActive && contentSyncInvite!.fromTrackId === track.id
  const inviteOffsetLocked =
    inviteActive &&
    (contentSyncInvite!.step === 'merging' ||
      contentSyncInvite!.step === 'listenMerge' ||
      contentSyncInvite!.step === 'acceptMerge')
  // Manual ± only in Calage, and during Sync invite only after the user
  // rejected auto-Sync (“Non” → adjustListen / afterManualAdjust).
  const inviteShowsManualOffset =
    inviteActive &&
    (contentSyncInvite!.afterManualAdjust ||
      contentSyncInvite!.step === 'adjustListen')
  const showOffsetCol =
    !pickActive &&
    (inviteActive ? inviteShowsManualOffset : calageMode)
  const showOffsetEditor =
    showOffsetCol &&
    (!inviteActive || isSyncFocusTrack) &&
    !inviteOffsetLocked
  const showRefAlignCol =
    showOffsetCol && autoAlignEnabled && !inviteActive
  const contentSyncFromName =
    contentSyncPickFromId != null
      ? (tracks.find((t) => t.id === contentSyncPickFromId)?.name ?? '')
      : ''
  const trackBrandVar = `var(--brand-${(index % 8) + 1})`
  const mixDur = Math.max(1, getMixDurationMs(tracks))
  const spanRange = !track.isMetronome ? audibleMixRange(track) : null
  const spanLeftPct = spanRange ? (spanRange.startMs / mixDur) * 100 : 0
  const spanWidthPct = spanRange
    ? Math.max(
        0.8,
        ((spanRange.endMs - spanRange.startMs) / mixDur) * 100,
      )
    : 0
  const seekPct = `${Math.max(0, Math.min(1, mixSeekMs / mixDur)) * 100}%`
  const spanSeekDisabled = pickActive || appState === 'recording'
  const isMergePending =
    Boolean(track.mergePending) ||
    (cutMerging && cutMergeTrackId === track.id)
  const isDownloadPending = Boolean(track.downloadPending)
  const isAudioPending = isMergePending || isDownloadPending
  const mergeProgressPct = Math.round(
    Math.max(
      0,
      Math.min(
        1,
        isDownloadPending
          ? (track.downloadProgress ?? 0)
          : cutMergeProgress,
      ),
    ) * 100,
  )
  const deleteBusy = cutMerging || isAudioPending
  const onDeleteTrack = () => {
    if (deleteDisabled || deleteBusy) return
    const ok = window.confirm(
      t('tracks.delete.confirm', { name: track.name }),
    )
    if (!ok) return
    deleteTrack(track.id)
  }

  const [nameDraft, setNameDraft] = useState(track.name)
  const [bpmDraft, setBpmDraft] = useState(
    String(metronomeBpm ?? DEFAULT_METRONOME_BPM),
  )

  useEffect(() => {
    setNameDraft(track.name)
  }, [track.name])

  useEffect(() => {
    if (!isMergePending) return
    const el = document.querySelector<HTMLElement>(
      `[data-track-id="${track.id}"]`,
    )
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [isMergePending, track.id])

  useEffect(() => {
    if (!track.isMetronome) return
    setBpmDraft(String(metronomeBpm ?? DEFAULT_METRONOME_BPM))
  }, [track.isMetronome, metronomeBpm])

  useLayoutEffect(() => {
    if (!track.isMetronome) return
    if (!consumeMetronomeBpmFocusRequest()) return
    const input = document.querySelector<HTMLInputElement>(
      `input[data-metro-bpm="${track.id}"]`,
    )
    if (!input) return
    input.focus()
    input.select()
  }, [track.isMetronome, track.id])

  const applyMetronomeBpm = () => {
    const parsed = Number(bpmDraft)
    const next = clampMetronomeBpm(
      Number.isFinite(parsed) ? parsed : DEFAULT_METRONOME_BPM,
    )
    setBpmDraft(String(next))
    if (next === (metronomeBpm ?? DEFAULT_METRONOME_BPM)) return
    void createOrUpdateMetronome(next)
  }

  return (
    <li
      className={cn(
        'relative grid grid-rows-[auto] items-center gap-x-[0.1rem] touch-manipulation',
        'pl-[0.35rem]',
        !isDownloadPending && 'animate-rise',
        '[&:has([data-mute-menu-open])]:z-30',
        showDragHandle
          ? 'grid-cols-[1.35rem_1.55rem_minmax(0,1fr)] max-sm:grid-cols-[1.2rem_1.4rem_minmax(0,1fr)]'
          : 'grid-cols-[1.55rem_minmax(0,1fr)] max-sm:grid-cols-[1.4rem_minmax(0,1fr)]',
        showRefAlignCol &&
          'grid-cols-[1.55rem_minmax(0,1fr)_2.6rem_7.1rem] grid-rows-[auto_auto] gap-y-[0.1rem] max-sm:grid-cols-[1.4rem_minmax(0,1fr)_2.3rem_6rem]',
        showOffsetCol &&
          !showRefAlignCol &&
          'grid-cols-[1.55rem_minmax(0,1fr)_7.1rem] grid-rows-[auto_auto] gap-x-[0.45rem] gap-y-[0.1rem] max-sm:grid-cols-[1.4rem_minmax(0,1fr)_6rem] max-sm:gap-x-[0.35rem]',
        isDragging && 'opacity-45 touch-none',
        dragOver === 'before' &&
          'before:pointer-events-none before:absolute before:left-0 before:right-0 before:-top-[0.2rem] before:h-0.5 before:rounded-sm before:bg-ink before:content-[""]',
        dragOver === 'after' &&
          'after:pointer-events-none after:absolute after:bottom-[-0.2rem] after:left-0 after:right-0 after:h-0.5 after:rounded-sm after:bg-ink after:content-[""]',
        isPickSource && 'opacity-100',
        pickActive && !isPickTarget && !isPickSource && 'pointer-events-none',
        isPickTarget && 'z-[1] cursor-pointer',
        isMergePending && 'opacity-90',
        isDownloadPending && 'opacity-[0.32]',
        className,
      )}
      data-track-id={track.id}
      data-merge-pending={isMergePending || undefined}
      data-download-pending={isDownloadPending || undefined}
      aria-busy={isAudioPending || undefined}
      data-track-pick-target={isPickTarget ? track.id : undefined}
      style={{
        ...(isPickTarget
          ? { ['--sync-track-tint' as string]: trackBrandVar }
          : null),
        ...(isDownloadPending ? { opacity: 0.32 } : null),
      }}
      role={isPickTarget ? 'button' : undefined}
      tabIndex={isPickTarget ? 0 : undefined}
      aria-label={
        isContentSyncTarget
          ? t('tracks.contentSync.pickTarget.aria', {
              from: contentSyncFromName,
              name: track.name,
            })
          : isReferencePickTarget
            ? t('tracks.ref.pickTarget.aria', { name: track.name })
            : undefined
      }
      onClick={
        isContentSyncTarget
          ? () => {
              void completeContentSyncAgainst(track.id)
            }
          : isReferencePickTarget
            ? () => {
                setReferenceTrack(track.id)
              }
            : undefined
      }
      onKeyDown={
        isPickTarget
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                if (isContentSyncTarget) {
                  void completeContentSyncAgainst(track.id)
                } else if (isReferencePickTarget) {
                  setReferenceTrack(track.id)
                }
              }
            }
          : undefined
      }
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[0.15rem] left-0 top-[0.15rem] w-[0.18rem] rounded-full"
        style={{
          background: isPickSource
            ? 'color-mix(in srgb, var(--ink) 28%, transparent)'
            : trackBrandVar,
        }}
      />
      {showDragHandle ? (
        <TrackDragHandle
          draggable
          data-drag-track={track.id}
          ariaLabel={t('tracks.reorder', { name: track.name })}
        />
      ) : null}
      <div
        className={cn(
          'row-start-1 flex flex-col items-center gap-[0.3rem]',
          showDragHandle ? 'col-start-2' : 'col-start-1',
          (mixMode || cutEditing) && 'self-start pt-[0.2rem]',
          pickActive && 'pointer-events-none',
        )}
      >
        <TrackMute
          title={isEnabled ? t('tracks.audible') : t('tracks.muted')}
          ariaLabel={t('tracks.listen', { name: track.name })}
          checked={isEnabled}
          onCheckedChange={(on) => setTrackEnabled(track.id, on)}
          inputProps={{ 'data-toggle-track': track.id }}
        />
        {mixMode ? (
          <button
            type="button"
            data-highlight-track={track.id}
            aria-pressed={isHighlighted}
            aria-label={t('tracks.highlight', { name: track.name })}
            title={t('tracks.highlight', { name: track.name })}
            onClick={() => toggleTrackHighlight(track.id)}
            className={cn(
              'm-0 inline-flex h-[1.55rem] w-[1.55rem] shrink-0 items-center justify-center rounded-md border-0 bg-transparent p-0',
              'transition-[color,transform,opacity] duration-160',
              'cursor-pointer active:scale-[0.96]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
              '[&_svg]:size-[1.05rem]',
              'max-sm:h-[1.4rem] max-sm:w-[1.4rem] max-sm:[&_svg]:size-[0.95rem]',
              isHighlighted
                ? 'text-ink'
                : 'text-ink-soft/55 hover:text-ink-soft',
            )}
          >
              <IconHighlight filled={isHighlighted} />
          </button>
        ) : null}
      </div>
      <div
        className={cn(
          'row-start-1 flex w-full min-w-0 items-center gap-[0.35rem] rounded-[14px] border box-border py-[0.28rem] pr-[0.4rem] pl-[0.5rem]',
          showDragHandle ? 'col-start-3' : 'col-start-2',
          'max-sm:gap-[0.2rem] max-sm:rounded-[12px] max-sm:py-[0.22rem] max-sm:pr-[0.28rem] max-sm:pl-[0.32rem]',
          (calageMode || mixMode || cutEditing || showUploader || Boolean(spanRange)) &&
            !pickActive &&
            'items-start',
          !isEnabled && !cutMode && !pickActive && 'opacity-55',
          isPickSource && 'border-ink/18 bg-ink/8 text-ink-soft',
          pickActive &&
            !isPickSource &&
            !isPickTarget &&
            'border-ink/12 bg-ink/5 text-ink-soft',
          !pickActive &&
            !isPickSource &&
            !isPickTarget &&
            'border-transparent bg-ink/4',
          isPickTarget &&
            'track-sync-chrome border-[1.5px] transition-[background-color,border-color] duration-160',
        )}
        style={
          isPickTarget
            ? {
                borderColor: `color-mix(in srgb, ${trackBrandVar} 48%, transparent)`,
              }
            : undefined
        }
      >
        <div
          className={cn(
            'flex min-w-0 flex-auto items-center gap-[0.4rem]',
            (calageMode ||
              mixMode ||
              cutEditing ||
              showUploader ||
              Boolean(spanRange) ||
              isAudioPending) &&
              'flex-col items-stretch gap-[0.15rem]',
          )}
        >
          <div
            className={cn(
              'flex min-w-0 items-center gap-[0.4rem]',
              calageMode && 'w-full flex-col items-stretch gap-[0.12rem]',
              (mixMode ||
                cutEditing ||
                showUploader ||
                Boolean(spanRange) ||
                isAudioPending) &&
                !calageMode &&
                'w-full',
            )}
          >
            <div
              className={cn(
                'flex min-w-0 flex-col gap-0',
                calageMode ? 'w-full' : 'flex-auto',
              )}
            >
              {track.isMetronome ? (
                <div className="flex min-w-0 w-full items-center gap-[0.35rem]">
                  <div className="inline-flex min-w-0 flex-auto items-center gap-[0.35rem] py-[0.1rem]">
                    <span className="shrink-0 text-[0.82rem] font-bold text-ink">
                      {t('track.metronome.label')}
                    </span>
                    {calageMode ? null : (
                      <NudgeValueField
                        unit={t('capture.metronome.unit')}
                        labelClassName="min-w-0 justify-start"
                        className="w-[2.85rem] text-[0.82rem]"
                        value={bpmDraft}
                        inputMode="numeric"
                        aria-label={t('capture.metronome.bpm')}
                        spellCheck={false}
                        data-metro-bpm={track.id}
                        onChange={(event) => setBpmDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            event.currentTarget.blur()
                          }
                        }}
                        onFocus={(event) => {
                          event.currentTarget.select()
                          event.currentTarget.addEventListener(
                            'mouseup',
                            (mouseupEvent) => {
                              mouseupEvent.preventDefault()
                              event.currentTarget.select()
                            },
                            { once: true },
                          )
                        }}
                        onBlur={applyMetronomeBpm}
                      />
                    )}
                  </div>
                  {showTitleDelete ? (
                    <Button
                      variant="trash"
                      className="h-[1.3rem] w-[1.3rem] shrink-0 rounded-md border-ink/16 text-ink/45 [&_svg]:size-[0.68rem] max-sm:h-[1.2rem] max-sm:w-[1.2rem] max-sm:[&_svg]:size-[0.62rem]"
                      icon={<IconTrash />}
                      disabled={deleteDisabled || deleteBusy}
                      aria-label={t('tracks.delete', { name: track.name })}
                      title={deleteTitle}
                      data-delete-track={track.id}
                      onClick={onDeleteTrack}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="flex min-w-0 w-full items-center gap-[0.35rem]">
                  <TrackNameInput
                    isDefault={isDefaultTrackName(nameDraft)}
                    data-rename-track={track.id}
                    value={nameDraft}
                    aria-label={t('tracks.name.aria')}
                    maxLength={40}
                    readOnly={cutEditing || pickActive}
                    className={cn(
                      'min-w-0 flex-auto',
                      showUploader && !calageMode && 'py-0',
                      (cutEditing || pickActive) &&
                        'pointer-events-none hover:bg-transparent',
                      isPickSource && 'text-ink-soft',
                    )}
                    onChange={(event) => {
                      setNameDraft(event.target.value)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        event.currentTarget.blur()
                      }
                    }}
                    onFocus={(event) => {
                      if (cutEditing || pickActive) {
                        event.currentTarget.blur()
                        return
                      }
                      if (!isDefaultTrackName(event.currentTarget.value)) return
                      event.currentTarget.select()
                      event.currentTarget.addEventListener(
                        'mouseup',
                        (mouseupEvent) => {
                          mouseupEvent.preventDefault()
                          event.currentTarget.select()
                        },
                        { once: true },
                      )
                    }}
                    onBlur={() => {
                      if (cutEditing) return
                      const next =
                        nameDraft.trim().slice(0, 40) ||
                        defaultTrackName(index + 1)
                      setNameDraft(next)
                      renameTrack(track.id, next)
                    }}
                  />
                  {showContentSyncButton ? (
                    <Button
                      type="button"
                      variant="trim"
                      data-content-sync={track.id}
                      className={cn(
                        'shrink-0 px-[0.32rem] py-[0.12rem] text-[0.62rem] font-semibold tracking-[0.01em] normal-case',
                        isContentSyncSource &&
                          'border-ink/25 bg-ink/10 text-ink-soft hover:enabled:bg-ink/14',
                      )}
                      aria-pressed={isContentSyncSource}
                      aria-label={t('tracks.contentSync.aria', {
                        name: track.name,
                      })}
                      title={t('tracks.contentSync.hint')}
                      onClick={(event) => {
                        event.stopPropagation()
                        beginContentSyncPick(track.id)
                      }}
                    >
                      {t('tracks.contentSync')}
                    </Button>
                  ) : null}
                  {showTitleDelete ? (
                    <Button
                      variant="trash"
                      className="h-[1.3rem] w-[1.3rem] shrink-0 rounded-md border-ink/16 text-ink/45 [&_svg]:size-[0.68rem] max-sm:h-[1.2rem] max-sm:w-[1.2rem] max-sm:[&_svg]:size-[0.62rem]"
                      icon={<IconTrash />}
                      disabled={deleteDisabled || deleteBusy}
                      aria-label={t('tracks.delete', { name: track.name })}
                      title={deleteTitle}
                      data-delete-track={track.id}
                      onClick={onDeleteTrack}
                    />
                  ) : null}
                </div>
              )}
              {!calageMode && showUploader ? (
                <span
                  className="truncate px-[0.15rem] text-[0.62rem] font-medium leading-[1.1] text-ink-soft/80"
                  title={t('tracks.uploadedBy', {
                    pseudo: uploaderHandle ?? uploaderLabel!,
                  })}
                >
                  {uploaderLabel}
                </span>
              ) : null}
              {isAudioPending ? (
                <div
                  className="relative mt-[0.12rem] h-[0.55rem] w-full min-w-0 overflow-hidden rounded-sm bg-ink/10"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={mergeProgressPct}
                  aria-label={
                    isDownloadPending
                      ? t('tracks.download.progress')
                      : t('cut.merge.progress')
                  }
                  title={
                    isDownloadPending
                      ? t('tracks.download.progress')
                      : t('cut.merge.progress')
                  }
                >
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-sm transition-[width] duration-150 ease-out',
                      isDownloadPending
                        ? 'bg-gradient-to-r from-ink/35 to-ink/65'
                        : 'bg-gradient-to-r from-mode-cut to-meter',
                      isDownloadPending &&
                        mergeProgressPct < 3 &&
                        'w-[28%] animate-pulse',
                    )}
                    style={
                      isDownloadPending && mergeProgressPct < 3
                        ? undefined
                        : { width: `${Math.max(mergeProgressPct, 4)}%` }
                    }
                  />
                </div>
              ) : spanRange ? (
                <div
                  role="slider"
                  tabIndex={spanSeekDisabled ? -1 : 0}
                  className={cn(
                    'relative mt-[0.12rem] h-[0.5rem] w-full min-w-0 touch-none rounded-sm bg-ink/8',
                    'cursor-pointer transition-[background] duration-120 hover:bg-ink/12',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-1',
                    spanSeekDisabled && 'pointer-events-none cursor-default',
                  )}
                  style={{ ['--span-seek' as string]: seekPct }}
                  aria-label={t('tracks.span.seekAria', { name: track.name })}
                  title={t('tracks.span.seekHint')}
                  aria-valuemin={0}
                  aria-valuemax={Math.round(mixDur)}
                  aria-valuenow={Math.round(
                    Math.max(0, Math.min(mixDur, mixSeekMs)),
                  )}
                  aria-disabled={spanSeekDisabled || undefined}
                  onPointerDown={(event) => {
                    if (spanSeekDisabled) return
                    event.preventDefault()
                    event.stopPropagation()
                    setSeekDragActive(true)
                    const rect = event.currentTarget.getBoundingClientRect()
                    if (rect.width <= 0) return
                    const ratio = Math.max(
                      0,
                      Math.min(1, (event.clientX - rect.left) / rect.width),
                    )
                    const ms = ratio * mixDur
                    patch({
                      mixSeekMs: ms,
                      mixClockText: formatCentis(ms),
                    })
                    event.currentTarget.setPointerCapture(event.pointerId)
                  }}
                  onPointerMove={(event) => {
                    if (!useSessionStore.getState().seekDragActive) return
                    const rect = event.currentTarget.getBoundingClientRect()
                    if (rect.width <= 0) return
                    const ratio = Math.max(
                      0,
                      Math.min(1, (event.clientX - rect.left) / rect.width),
                    )
                    const ms = ratio * mixDur
                    patch({
                      mixSeekMs: ms,
                      mixClockText: formatCentis(ms),
                    })
                  }}
                  onPointerUp={(event) => {
                    if (!useSessionStore.getState().seekDragActive) return
                    setSeekDragActive(false)
                    try {
                      event.currentTarget.releasePointerCapture(event.pointerId)
                    } catch {
                      // ignore
                    }
                    void seekMixTo(useSessionStore.getState().mixSeekMs)
                  }}
                  onPointerCancel={() => setSeekDragActive(false)}
                  onKeyDown={(event) => {
                    if (spanSeekDisabled) return
                    const step = event.shiftKey ? mixDur * 0.1 : mixDur * 0.02
                    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                      event.preventDefault()
                      event.stopPropagation()
                      const delta =
                        event.key === 'ArrowLeft' ? -step : step
                      void seekMixTo(mixSeekMs + delta)
                    } else if (event.key === 'Home') {
                      event.preventDefault()
                      void seekMixTo(0)
                    } else if (event.key === 'End') {
                      event.preventDefault()
                      void seekMixTo(mixDur)
                    }
                  }}
                >
                  <span
                    className="pointer-events-none absolute top-0 bottom-0 rounded-sm bg-ink/28"
                    style={{
                      left: `${spanLeftPct}%`,
                      width: `${spanWidthPct}%`,
                    }}
                  />
                  <span
                    className="pointer-events-none absolute top-1/2 z-[1] h-[0.72rem] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/75 shadow-[0_0_0_1px_color-mix(in_srgb,var(--paper)_55%,transparent)]"
                    style={{ left: 'var(--span-seek)' }}
                    aria-hidden
                  />
                </div>
              ) : null}
            </div>
            {calageMode &&
            (showUploader || !track.isMetronome) ? (
              <div className="flex w-full min-w-0 items-center gap-[0.55rem]">
                {showUploader ? (
                  <span
                    className="min-w-0 truncate px-[0.15rem] text-[0.62rem] font-medium leading-[1.1] text-ink-soft/80"
                    title={t('tracks.uploadedBy', {
                      pseudo: uploaderHandle ?? uploaderLabel!,
                    })}
                  >
                    {uploaderLabel}
                  </span>
                ) : null}
                {!track.isMetronome ? (
                  <span className="inline-flex shrink-0 items-center gap-[0.55rem] leading-[1.15]">
                    <small
                      className="text-[0.8rem] font-bold tracking-[0.02em] tabular-nums text-ink"
                      data-track-clock={track.id}
                    >
                      {clock}
                    </small>
                    <small className="text-[0.72rem] tabular-nums text-ink-soft">
                      {formatTime(track.durationMs)}
                    </small>
                  </span>
                ) : null}
              </div>
            ) : null}
            {mixMode && (showCloudSave || cloudUploading) ? (
              <Button
                variant="utility"
                className="ml-auto shrink-0 self-center max-sm:ml-[0.08rem]"
                icon={<IconCloudSave />}
                disabled={cloudUploading}
                aria-label={t('tracks.cloudSave', { name: track.name })}
                title={
                  cloudUploading
                    ? t('tracks.cloudSaving')
                    : t('tracks.cloudSave', { name: track.name })
                }
                onClick={() => {
                  void uploadTrackToCloud(track.id)
                }}
              />
            ) : null}
          </div>
          {mixMode ? (
            <div data-volume-ribbon className="w-full min-w-0">
              <VolumeRibbon
                label={t('tracks.volume', { name: track.name })}
                value={volume}
                max={TRACK_VOLUME_MAX}
                onChange={(next) => setTrackVolume(track.id, next)}
                onChangeEnd={() => flushVolumeCloudPersist(track.id)}
                onReset={() => setTrackVolume(track.id, 1)}
              />
            </div>
          ) : null}
          {cutEditing &&
          cutWorkSegments[track.id] &&
          cutWorkSegments[track.id]!.length > 0
            ? (() => {
                const mixDur = Math.max(1, getMixDurationMs(tracks))
                const segs = cutWorkSegments[track.id]!
                return (
                  <div
                    className="relative h-[1.55rem] w-full min-w-0"
                    role="group"
                    aria-label={t('cut.segments.aria', { name: track.name })}
                  >
                    {segs.map((seg) => {
                      const leftPct = (seg.startMs / mixDur) * 100
                      const widthPct = Math.max(
                        0.8,
                        ((seg.endMs - seg.startMs) / mixDur) * 100,
                      )
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          data-cut-segment={`${track.id}:${seg.id}`}
                          aria-pressed={seg.selected}
                          disabled={cutMerging || isMergePending}
                          title={t('cut.segment.toggle')}
                          onClick={() =>
                            toggleCutSegmentSelected(track.id, seg.id)
                          }
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                          className={cn(
                            'absolute top-0 bottom-0 min-w-[0.55rem] rounded-md border-[1.5px] px-[0.2rem] text-[0.62rem] font-bold tabular-nums',
                            'cursor-pointer transition-[background,color,border-color] duration-120',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-mode-cut/40 focus-visible:outline-offset-1',
                            'disabled:cursor-default disabled:opacity-70',
                            seg.selected
                              ? 'border-mode-cut bg-mode-cut text-on-mode-cut'
                              : 'border-mode-cut-border bg-mode-cut-bg text-mode-cut hover:bg-mode-cut-hover',
                          )}
                        />
                      )
                    })}
                  </div>
                )
              })()
            : null}
          {cutMode && (track.muteRanges?.length ?? 0) > 0 ? (
            <CutMuteBars track={track} />
          ) : null}
        </div>
        {!mixMode &&
        !cutEditing &&
        !pickActive &&
        (showCloudSave || cloudUploading) ? (
          <Button
            variant="utility"
            className="ml-[0.15rem] shrink-0 max-sm:ml-[0.08rem]"
            icon={<IconCloudSave />}
            disabled={cloudUploading}
            aria-label={t('tracks.cloudSave', { name: track.name })}
            title={
              cloudUploading
                ? t('tracks.cloudSaving')
                : t('tracks.cloudSave', { name: track.name })
            }
            onClick={() => {
              void uploadTrackToCloud(track.id)
            }}
          />
        ) : null}
        {chipRail && !pickActive ? (
          <div className="ml-[0.12rem] flex shrink-0 items-center gap-[0.2rem] self-start max-sm:ml-[0.06rem]">
            {simpleDupChipColumn ? (
              <div className={chipSlotClass}>{dupChipButton}</div>
            ) : null}
            {simpleMixChipColumn || mixChipColumn ? (
              <div className={chipSlotClass}>{mixChipButton}</div>
            ) : null}
            {simpleCalageChipColumn || calageChipColumn ? (
              <div className={chipSlotClass}>{calageChipButton}</div>
            ) : null}
          </div>
        ) : null}
      </div>
      {showOffsetCol ? (
        <>
          {showRefAlignCol ? (
            isReference ? (
              <button
                type="button"
                className={cn(
                  'col-start-3 row-start-1 inline-flex h-[1.35rem] w-full shrink-0 items-center justify-center justify-self-center',
                  'rounded-md border-0 bg-transparent p-0',
                  'text-[0.62rem] font-extrabold tracking-[0.04em] uppercase text-ink-soft',
                  'cursor-pointer transition-[color,background] duration-160',
                  'hover:bg-ink/8 hover:text-ink',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
                )}
                title={t('tracks.ref.hint')}
                aria-label={t('tracks.ref.aria')}
                data-reference-pick
                onClick={(event) => {
                  event.stopPropagation()
                  beginReferencePick()
                }}
              >
                {t('tracks.ref.badge')}
              </button>
            ) : (
              <Button
                variant="nudge"
                className="col-start-3 row-start-1 justify-self-center [&_svg]:size-[1.28rem]"
                icon={<IconAutoAlign />}
                disabled={isAutoAlignOffsetExcluded(track.offsetMs)}
                title={
                  isAutoAlignOffsetExcluded(track.offsetMs)
                    ? t('tracks.autoAlign.excluded.hint')
                    : t('tracks.autoAlign')
                }
                aria-label={
                  isAutoAlignOffsetExcluded(track.offsetMs)
                    ? t('tracks.autoAlign.excluded.hint')
                    : t('tracks.autoAlign.named', { name: track.name })
                }
                data-auto-align-track={track.id}
                onClick={() => {
                  void (async () => {
                    try {
                      await realignTrack(track.id)
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : t('error.autoAlignFailed'),
                      )
                    }
                  })()
                }}
              />
            )
          ) : null}
          {showOffsetEditor ? (
            <MsOffsetEditor
              className={cn(
                'row-start-1 justify-self-center',
                showRefAlignCol ? 'col-start-4' : 'col-start-3',
              )}
              title={t('tracks.offset.hint')}
              value={Math.round(track.offsetMs)}
              onChange={(next) => applyManualTrackOffset(track.id, next)}
              minusAriaLabel={t('tracks.offset.minus', { name: track.name })}
              plusAriaLabel={t('tracks.offset.plus', { name: track.name })}
              inputAriaLabel={t('tracks.offset.input', { name: track.name })}
              inputProps={{ 'data-offset-track': track.id }}
            />
          ) : showOffsetCol ? (
            <span
              className={cn(
                'row-start-1 justify-self-center',
                showRefAlignCol ? 'col-start-4' : 'col-start-3',
              )}
              aria-hidden="true"
            />
          ) : null}
          <small
            className={cn(
              'row-start-2 block max-w-[8.5rem] min-h-[1.55em] justify-self-center text-center text-[0.62rem] font-semibold leading-[1.25] tabular-nums text-ink-soft',
              showRefAlignCol ? 'col-start-4' : 'col-start-3',
              (!alignDetailText || !showOffsetEditor) && 'invisible',
            )}
          >
            {alignDetailText || '\u00a0'}
          </small>
        </>
      ) : null}
    </li>
  )
}
