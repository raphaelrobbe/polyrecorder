import { useEffect, useState } from 'react'
import type { Track } from '../../types'
import {
  formatAlignDetail,
  formatCentis,
  formatTime,
  isDefaultTrackName,
} from '../../lib/format'
import { TRACK_VOLUME_MAX } from '../../lib/audio/mix'
import {
  applyManualTrackOffset,
  autoAlignTracksFromCounts,
  deleteTrack,
  getTrackPositionMs,
  getTrackVolume,
  renameTrack,
  setError,
  setTrackAutoAlign,
  setTrackEnabled,
  setTrackVolume,
} from '../../lib/sessionActions'
import { cn } from '../../lib/utils'
import { useSessionStore } from '../../store/sessionStore'
import { Button } from '../Button'
import { IconClose } from '../icons'
import { MsOffsetEditor } from '../MsOffsetEditor'
import { VolumeRibbon } from '../VolumeRibbon'
import { TrackAlignCheck } from './TrackAlignCheck'
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
  const calageMode = useSessionStore((s) => s.calageMode)
  const mixMode = useSessionStore((s) => s.mixMode)
  const enabledTrackIds = useSessionStore((s) => s.enabledTrackIds)
  const autoAlignTrackIds = useSessionStore((s) => s.autoAlignTrackIds)
  const referenceTrackId = useSessionStore((s) => s.referenceTrackId)
  const trackAlignDetails = useSessionStore((s) => s.trackAlignDetails)
  const trackVolumes = useSessionStore((s) => s.trackVolumes)
  // Re-render on playhead ticks so per-track clocks stay live in calage mode.
  useSessionStore((s) => s.mixClockText)

  const isEnabled = enabledTrackIds.includes(track.id)
  const autoAlign = autoAlignTrackIds.includes(track.id)
  const isReference = track.id === referenceTrackId
  const alignDetail = trackAlignDetails[track.id]
  const alignDetailText =
    alignDetail && !isReference
      ? formatAlignDetail(track.offsetMs, alignDetail)
      : ''
  const clock = formatCentis(getTrackPositionMs(track.id))
  const volume = trackVolumes[track.id] ?? getTrackVolume(track.id)
  const hideDelete = calageMode || mixMode

  const [nameDraft, setNameDraft] = useState(track.name)

  useEffect(() => {
    setNameDraft(track.name)
  }, [track.name])

  return (
    <li
      className={cn(
        'relative grid grid-cols-[1.35rem_1.55rem_minmax(0,1fr)] grid-rows-[auto] items-center gap-x-[0.1rem] touch-manipulation animate-rise max-sm:grid-cols-[1.2rem_1.4rem_minmax(0,1fr)]',
        calageMode &&
          'grid-cols-[1.35rem_1.55rem_minmax(0,1fr)_2.2rem_7.1rem] grid-rows-[auto_auto] gap-y-[0.1rem] max-sm:grid-cols-[1.2rem_1.4rem_minmax(0,1fr)_1.9rem_6rem]',
        isDragging && 'opacity-45 touch-none',
        dragOver === 'before' &&
          'before:pointer-events-none before:absolute before:left-0 before:right-0 before:-top-[0.2rem] before:h-0.5 before:rounded-sm before:bg-ink before:content-[""]',
        dragOver === 'after' &&
          'after:pointer-events-none after:absolute after:bottom-[-0.2rem] after:left-0 after:right-0 after:h-0.5 after:rounded-sm after:bg-ink after:content-[""]',
        className,
      )}
      data-track-id={track.id}
    >
      <TrackDragHandle
        draggable
        data-drag-track={track.id}
        ariaLabel={`Réordonner ${track.name}`}
      />
      <TrackMute
        className="col-start-2 row-start-1"
        title={isEnabled ? 'Audible' : 'Muet'}
        ariaLabel={`Écouter ${track.name}`}
        checked={isEnabled}
        onCheckedChange={(on) => setTrackEnabled(track.id, on)}
        inputProps={{ 'data-toggle-track': track.id }}
      />
      <div
        className={cn(
          'col-start-3 row-start-1 flex w-full min-w-0 items-center gap-[0.4rem] rounded-[14px] border border-transparent bg-ink/4 box-border py-[0.45rem] pr-[0.45rem] pl-[0.55rem]',
          'max-sm:gap-[0.25rem] max-sm:rounded-[12px] max-sm:py-[0.35rem] max-sm:pr-[0.3rem] max-sm:pl-[0.35rem]',
          (calageMode || mixMode) && 'items-start',
          !isEnabled && 'opacity-55',
        )}
      >
        <div
          className={cn(
            'flex min-w-0 flex-auto items-center gap-[0.45rem]',
            (calageMode || mixMode) && 'flex-col items-stretch gap-[0.35rem]',
          )}
        >
          <div
            className={cn(
              'flex min-w-0 items-center gap-[0.45rem]',
              calageMode && 'w-full',
              mixMode && 'w-full',
            )}
          >
            <TrackNameInput
              isDefault={isDefaultTrackName(nameDraft)}
              data-rename-track={track.id}
              value={nameDraft}
              aria-label="Nom de la piste"
              maxLength={40}
              onChange={(event) => setNameDraft(event.target.value)}
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
                  nameDraft.trim().slice(0, 40) || `Piste ${index + 1}`
                setNameDraft(next)
                renameTrack(track.id, next)
              }}
            />
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
                label={`Volume ${track.name}`}
                value={volume}
                max={TRACK_VOLUME_MAX}
                onChange={(next) => setTrackVolume(track.id, next)}
                onReset={() => setTrackVolume(track.id, 1)}
              />
            </div>
          ) : null}
        </div>
        {isReference || hideDelete ? null : (
          <Button
            variant="trash"
            className="ml-[0.15rem] shrink-0 max-sm:ml-[0.08rem]"
            icon={<IconClose />}
            aria-label={`Supprimer ${track.name}`}
            title="Supprimer"
            onClick={() => {
              const ok = window.confirm(`Supprimer « ${track.name} » ?`)
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
              title="Piste de référence (marquages 1–2–3–4)"
              aria-label="Référence"
            >
              réf.
            </span>
          ) : (
            <TrackAlignCheck
              className="col-start-4 row-start-1 justify-self-center"
              title="Calage auto"
              ariaLabel={`Calage auto ${track.name}`}
              checked={autoAlign}
              onCheckedChange={(on) => {
                if (on) {
                  setTrackAutoAlign(track.id, true)
                  void (async () => {
                    try {
                      setError(null)
                      await autoAlignTracksFromCounts()
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : 'Calage auto impossible.',
                      )
                    }
                  })()
                  return
                }
                applyManualTrackOffset(track.id, 0)
              }}
              inputProps={{ 'data-auto-align-track': track.id }}
            />
          )}
          <MsOffsetEditor
            className="col-start-5 row-start-1 justify-self-center"
            title="Décaler cette piste à la lecture"
            value={Math.round(track.offsetMs)}
            onChange={(next) => applyManualTrackOffset(track.id, next)}
            minusAriaLabel={`Avancer ${track.name} de 5 ms`}
            plusAriaLabel={`Retarder ${track.name} de 5 ms`}
            inputAriaLabel={`Calage de ${track.name} en millisecondes`}
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
