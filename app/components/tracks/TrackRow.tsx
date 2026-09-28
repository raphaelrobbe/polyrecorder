import { useEffect, useState } from 'react'
import { formatPseudoHandle } from '../../common/user'
import type { Track } from '../../common/types'
import {
  defaultTrackName,
  formatAlignDetail,
  formatCentis,
  formatTime,
  isDefaultTrackName,
} from '../../lib/format'
import { TRACK_VOLUME_MAX } from '../../lib/audio/mix.client'
import { OFFSET_WARN_MS } from '../../lib/audio/runtime.client'
import {
  applyManualTrackOffset,
  deleteTrack,
  getTrackPositionMs,
  getTrackVolume,
  realignTrack,
  renameTrack,
  setError,
  setTrackEnabled,
  setTrackVolume,
  setCalageMode,
  flushVolumeCloudPersist,
  toggleTrackHighlight,
} from '../../lib/sessionActions.client'
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
import { VolumeRibbon } from '../VolumeRibbon'
import { TrackDragHandle } from './TrackDragHandle'
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
  const showCalageWarnings = useSessionStore((s) => s.showCalageWarnings)
  const autoAlignEnabled = useSessionStore((s) => s.autoAlignEnabled)
  // Re-render on playhead ticks so per-track clocks stay live in calage mode.
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
  const hideDelete = calageMode || mixMode
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
      (t) =>
        t.id !== referenceTrackId && Math.abs(t.offsetMs) > OFFSET_WARN_MS,
    )
    .map((t) => `${t.id}:${Math.round(t.offsetMs)}`)
    .join('|')
  const skewActive =
    skewFingerprint.length > 0 &&
    skewFingerprint !== skewWarningDismissedKey
  const showSkewAttention =
    autoAlignEnabled &&
    showCalageWarnings &&
    skewActive &&
    !isReference &&
    !calageMode &&
    Math.abs(track.offsetMs) > OFFSET_WARN_MS
  const showCloudSave =
    (!readOnlySession || canCloudContribute) &&
    user != null &&
    (track.cloudStatus === 'local' ||
      track.cloudStatus === 'error' ||
      track.cloudStatus == null)
  const cloudUploading = track.cloudStatus === 'uploading'

  const [nameDraft, setNameDraft] = useState(track.name)

  useEffect(() => {
    setNameDraft(track.name)
  }, [track.name])

  return (
    <li
      className={cn(
        'relative grid grid-cols-[1.35rem_1.55rem_minmax(0,1fr)] grid-rows-[auto] items-center gap-x-[0.1rem] touch-manipulation animate-rise max-sm:grid-cols-[1.2rem_1.4rem_minmax(0,1fr)]',
        'pl-[0.35rem]',
        calageMode &&
          'grid-cols-[1.35rem_1.55rem_minmax(0,1fr)_2.6rem_7.1rem] grid-rows-[auto_auto] gap-y-[0.1rem] max-sm:grid-cols-[1.2rem_1.4rem_minmax(0,1fr)_2.3rem_6rem]',
        isDragging && 'opacity-45 touch-none',
        dragOver === 'before' &&
          'before:pointer-events-none before:absolute before:left-0 before:right-0 before:-top-[0.2rem] before:h-0.5 before:rounded-sm before:bg-ink before:content-[""]',
        dragOver === 'after' &&
          'after:pointer-events-none after:absolute after:bottom-[-0.2rem] after:left-0 after:right-0 after:h-0.5 after:rounded-sm after:bg-ink after:content-[""]',
        className,
      )}
      data-track-id={track.id}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[0.15rem] left-0 top-[0.15rem] w-[0.18rem] rounded-full"
        style={{ background: `var(--brand-${(index % 8) + 1})` }}
      />
      <TrackDragHandle
        draggable
        data-drag-track={track.id}
        ariaLabel={t('tracks.reorder', { name: track.name })}
      />
      <div
        className={cn(
          'col-start-2 row-start-1 flex flex-col items-center gap-[0.3rem]',
          mixMode && 'self-start pt-[0.2rem]',
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
          'col-start-3 row-start-1 flex w-full min-w-0 items-center gap-[0.35rem] rounded-[14px] border border-transparent bg-ink/4 box-border py-[0.28rem] pr-[0.4rem] pl-[0.5rem]',
          'max-sm:gap-[0.2rem] max-sm:rounded-[12px] max-sm:py-[0.22rem] max-sm:pr-[0.28rem] max-sm:pl-[0.32rem]',
          (calageMode || mixMode || showUploader) && 'items-start',
          !isEnabled && 'opacity-55',
        )}
      >
        <div
          className={cn(
            'flex min-w-0 flex-auto items-center gap-[0.4rem]',
            (calageMode || mixMode || showUploader) &&
              'flex-col items-stretch gap-[0.15rem]',
          )}
        >
          <div
            className={cn(
              'flex min-w-0 items-center gap-[0.4rem]',
              (calageMode || mixMode || showUploader) && 'w-full',
            )}
          >
            <div className="flex min-w-0 flex-auto flex-col gap-0">
              <TrackNameInput
                isDefault={isDefaultTrackName(nameDraft)}
                data-rename-track={track.id}
                value={nameDraft}
                aria-label={t('tracks.name.aria')}
                maxLength={40}
                className={cn(showUploader && 'py-0')}
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
                  const next =
                    nameDraft.trim().slice(0, 40) ||
                    defaultTrackName(index + 1)
                  setNameDraft(next)
                  renameTrack(track.id, next)
                }}
              />
              {showUploader ? (
                <span
                  className="truncate px-[0.15rem] text-[0.62rem] font-medium leading-[1.1] text-ink-soft/80"
                  title={t('tracks.uploadedBy', {
                    pseudo: uploaderHandle ?? uploaderLabel!,
                  })}
                >
                  {uploaderLabel}
                </span>
              ) : null}
            </div>
            <span
              className={cn(
                'ml-auto inline-flex shrink-0 flex-col items-end gap-[0.1rem] leading-[1.15]',
                calageMode &&
                  'ml-0 flex-row items-center justify-start gap-[0.55rem]',
              )}
              hidden={!calageMode}
            >
              {calageMode ? (
                <>
                  <small
                    className="text-[0.8rem] font-bold tracking-[0.02em] tabular-nums text-ink"
                    data-track-clock={track.id}
                  >
                    {clock}
                  </small>
                  <small className="text-[0.72rem] tabular-nums text-ink-soft">
                    {formatTime(track.durationMs)}
                  </small>
                </>
              ) : null}
            </span>
          </div>
          {mixMode ? (
            <div data-volume-ribbon>
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
        </div>
        {showCloudSave || cloudUploading ? (
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
        {showSkewAttention ? (
          <Button
            variant="trash"
            className="ml-[0.15rem] h-[1.65rem] w-[1.65rem] shrink-0 rounded-lg border-warn-border bg-warn-bg text-[0.88rem] font-extrabold leading-none text-warn hover:enabled:border-warn-border hover:enabled:bg-warn-hover hover:enabled:text-warn max-sm:ml-[0.08rem] max-sm:h-[1.45rem] max-sm:w-[1.45rem] max-sm:text-[0.8rem]"
            title={t('warn.skew.long', { names: track.name })}
            aria-label={t('warn.skew.chip.aria', { name: track.name })}
            onClick={() => {
              setError(null)
              setCalageMode(true)
            }}
          >
            !
          </Button>
        ) : null}
        {isReference || hideDelete ? null : (
          <Button
            variant="trash"
            className="ml-[0.15rem] h-[1.65rem] w-[1.65rem] shrink-0 rounded-lg border-ink/18 text-ink/55 [&_svg]:size-[0.82rem] max-sm:ml-[0.08rem] max-sm:h-[1.45rem] max-sm:w-[1.45rem] max-sm:[&_svg]:size-[0.72rem]"
            icon={<IconTrash />}
            aria-label={t('tracks.delete', { name: track.name })}
            title={t('common.delete')}
            onClick={() => {
              const ok = window.confirm(
                t('tracks.delete.confirm', { name: track.name }),
              )
              if (!ok) return
              deleteTrack(track.id)
            }}
          />
        )}
      </div>
      {calageMode ? (
        <>
          {isReference ? (
            <span
              className="col-start-4 row-start-1 inline-flex h-[1.35rem] w-full shrink-0 items-center justify-center justify-self-center text-[0.62rem] font-extrabold tracking-[0.04em] uppercase text-ink-soft select-none"
              title={t('tracks.ref.hint')}
              aria-label={t('tracks.ref.aria')}
            >
              {t('tracks.ref.badge')}
            </span>
          ) : (
            <Button
              variant="nudge"
              className="col-start-4 row-start-1 justify-self-center [&_svg]:size-[1.28rem]"
              icon={<IconAutoAlign />}
              title={t('tracks.autoAlign')}
              aria-label={t('tracks.autoAlign.named', { name: track.name })}
              data-auto-align-track={track.id}
              hidden={!autoAlignEnabled}
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
          )}
          <MsOffsetEditor
            className="col-start-5 row-start-1 justify-self-center"
            title={t('tracks.offset.hint')}
            value={Math.round(track.offsetMs)}
            onChange={(next) => applyManualTrackOffset(track.id, next)}
            minusAriaLabel={t('tracks.offset.minus', { name: track.name })}
            plusAriaLabel={t('tracks.offset.plus', { name: track.name })}
            inputAriaLabel={t('tracks.offset.input', { name: track.name })}
            inputProps={{ 'data-offset-track': track.id }}
          />
          <small
            className={cn(
              'col-start-5 row-start-2 block max-w-[8.5rem] min-h-[1.55em] justify-self-center text-center text-[0.62rem] font-semibold leading-[1.25] tabular-nums text-ink-soft',
              !alignDetailText && 'invisible',
            )}
          >
            {alignDetailText || '\u00a0'}
          </small>
        </>
      ) : null}
    </li>
  )
}
