import type { Track } from '../../common/types'
import { isAutoAlignOffsetExcluded } from '../../lib/audio/runtime.client'
import {
  applyManualTrackOffset,
  beginReferencePick,
  realignTrack,
  setError,
} from '../../lib/sessionActions.client'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { Button } from '../Button'
import { IconAutoAlign } from '../icons'
import { MsOffsetEditor } from '../MsOffsetEditor'

type TrackRowCalageControlsProps = {
  track: Track
  isReference: boolean
  showOffsetCol: boolean
  showRefAlignCol: boolean
  showOffsetEditor: boolean
  alignDetailText: string
}

export function TrackRowCalageControls({
  track,
  isReference,
  showOffsetCol,
  showRefAlignCol,
  showOffsetEditor,
  alignDetailText,
}: TrackRowCalageControlsProps) {
  if (!showOffsetCol) return null

  return (
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
  )
}
