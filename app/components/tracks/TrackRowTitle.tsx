import { useEffect, useLayoutEffect, useState } from 'react'
import type { Track } from '../../common/types'
import { defaultTrackName, isDefaultTrackName } from '../../lib/format'
import {
  beginContentSyncPick,
  consumeMetronomeBpmFocusRequest,
  createOrUpdateMetronome,
  renameTrack,
} from '../../lib/sessionActions.client'
import {
  clampMetronomeBpm,
  DEFAULT_METRONOME_BPM,
} from '../../lib/audio/metronome.client'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { Button } from '../Button'
import { IconTrash } from '../icons'
import { NudgeValueField } from '../NudgeValueField'
import { TrackNameInput } from './TrackNameInput'

type TrackRowTitleProps = {
  track: Track
  index: number
  calageMode: boolean
  cutEditing: boolean
  pickActive: boolean
  showUploader: boolean
  showTitleDelete: boolean
  showContentSyncButton: boolean
  isContentSyncSource: boolean
  isPickSource: boolean
  deleteDisabled: boolean
  deleteBusy: boolean
  deleteTitle: string
  metronomeBpm: number | null
  onDeleteTrack: () => void
}

export function TrackRowTitle({
  track,
  index,
  calageMode,
  cutEditing,
  pickActive,
  showUploader,
  showTitleDelete,
  showContentSyncButton,
  isContentSyncSource,
  isPickSource,
  deleteDisabled,
  deleteBusy,
  deleteTitle,
  metronomeBpm,
  onDeleteTrack,
}: TrackRowTitleProps) {
  const [nameDraft, setNameDraft] = useState(track.name)
  const [bpmDraft, setBpmDraft] = useState(
    String(metronomeBpm ?? DEFAULT_METRONOME_BPM),
  )

  useEffect(() => {
    setNameDraft(track.name)
  }, [track.name])

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

  if (track.isMetronome) {
    return (
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
    )
  }

  return (
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
            nameDraft.trim().slice(0, 40) || defaultTrackName(index + 1)
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
  )
}
