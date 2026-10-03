import { useEffect } from 'react'
import { formatPseudoHandle } from '../../common/user'
import type { Track } from '../../common/types'
import {
  formatAlignDetail,
  formatCentis,
  formatTime,
  getMixDurationMs,
} from '../../lib/format'
import { TRACK_VOLUME_MAX } from '../../lib/audio/mix.client'
import {
  completeContentSyncAgainst,
  deleteTrack,
  flushVolumeCloudPersist,
  getTrackPositionMs,
  getTrackVolume,
  seekMixTo,
  setReferenceTrack,
  setTrackEnabled,
  setTrackVolume,
  toggleCutSegmentSelected,
  toggleTrackHighlight,
  trackOffersContentSync,
} from '../../lib/sessionActions.client'
import { audibleMixRange } from '../../lib/audio/segments.client'
import { uploadTrackToCloud } from '../../lib/cloudUpload.client'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import type { loader as rootLoader } from '../../root'
import { useSessionStore } from '../../store/sessionStore'
import { useRouteLoaderData } from '@remix-run/react'
import { Button } from '../Button'
import { IconCloudSave, IconHighlight } from '../icons'
import { VolumeRibbon } from '../VolumeRibbon'
import { TrackDragHandle } from './TrackDragHandle'
import { CutMuteBars } from './CutMuteBars'
import { TrackMute } from './TrackMute'
import { TrackRowCalageControls } from './TrackRowCalageControls'
import { TrackRowChips } from './TrackRowChips'
import { TrackRowTitle } from './TrackRowTitle'
import { useTrackRowAttention } from './useTrackRowAttention'

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

  const attention = useTrackRowAttention(track)

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
  const isSimpleMode = !mixMode && !calageMode && !cutMode
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

  useEffect(() => {
    if (!isMergePending) return
    const el = document.querySelector<HTMLElement>(
      `[data-track-id="${track.id}"]`,
    )
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [isMergePending, track.id])

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
              <TrackRowTitle
                track={track}
                index={index}
                calageMode={calageMode}
                cutEditing={cutEditing}
                pickActive={pickActive}
                showUploader={showUploader}
                showTitleDelete={showTitleDelete}
                showContentSyncButton={showContentSyncButton}
                isContentSyncSource={isContentSyncSource}
                isPickSource={isPickSource}
                deleteDisabled={deleteDisabled}
                deleteBusy={deleteBusy}
                deleteTitle={deleteTitle}
                metronomeBpm={metronomeBpm}
                onDeleteTrack={onDeleteTrack}
              />
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
        <TrackRowChips
          trackId={track.id}
          trackName={track.name}
          nameKey={attention.nameKey}
          pickActive={pickActive}
          calageMode={calageMode}
          mixMode={mixMode}
          chipRail={attention.chipRail}
          simpleDupChipColumn={attention.simpleDupChipColumn}
          simpleMixChipColumn={attention.simpleMixChipColumn}
          simpleCalageChipColumn={attention.simpleCalageChipColumn}
          mixChipColumn={attention.mixChipColumn}
          calageChipColumn={attention.calageChipColumn}
          showDuplicateNameChip={attention.showDuplicateNameChip}
          showRecordClipChip={attention.showRecordClipChip}
          showAttentionChip={attention.showAttentionChip}
          showBeatAttention={attention.showBeatAttention}
          attentionTitle={attention.attentionTitle}
          attentionAria={attention.attentionAria}
          alignAttentionMessage={attention.alignAttentionMessage}
          referenceBeatWarning={attention.referenceBeatWarning}
        />
      </div>
      <TrackRowCalageControls
        track={track}
        isReference={isReference}
        showOffsetCol={showOffsetCol}
        showRefAlignCol={showRefAlignCol}
        showOffsetEditor={showOffsetEditor}
        alignDetailText={alignDetailText}
      />
    </li>
  )
}
