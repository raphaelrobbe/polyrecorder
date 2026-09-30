import {
  applyCutMute,
  cancelCutSelection,
  cutMergeBlockedReason,
  mergeSelectedCutSegments,
  selectedCutWorkSegments,
  splitCutSegmentsAtPlayhead,
} from '../lib/sessionActions.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { IconScissors } from './icons'

type CutModePanelProps = {
  className?: string
}

/** Toolbar for découpage: scissors, mute, merge, reset. */
export function CutModePanel({ className }: CutModePanelProps) {
  useLocale()
  const cutMode = useSessionStore((s) => s.cutMode)
  const cutWorkSegments = useSessionStore((s) => s.cutWorkSegments)
  const merging = useSessionStore((s) => s.cutMerging)

  // Re-subscribe when segment selection changes for merge button state.
  useSessionStore((s) => s.cutWorkSegments)

  if (!cutMode) return null

  const selectedSegCount = selectedCutWorkSegments().length
  const mergeBlock = cutMergeBlockedReason()
  const mergeDisabled = merging || mergeBlock !== 'none'
  const mergeTitle =
    mergeBlock === 'overlap'
      ? t('cut.merge.disabledOverlap')
      : mergeBlock === 'empty'
        ? t('cut.merge.disabledEmpty')
        : t('cut.merge.hint')

  const hasAnySegments = Object.values(cutWorkSegments).some(
    (segs) => segs.length > 0,
  )
  const hasSplit = Object.values(cutWorkSegments).some(
    (segs) => segs.length > 1,
  )
  const muteDisabled = merging || selectedSegCount === 0

  const onMerge = () => {
    if (mergeDisabled) return
    void mergeSelectedCutSegments()
  }

  return (
    <div
      className={cn(
        'mt-[0.85rem] mb-0.5 flex flex-col gap-[0.65rem]',
        className,
      )}
      aria-busy={merging || undefined}
    >
      <p className="m-0 text-[0.84rem] font-semibold text-ink-soft">
        {merging ? t('cut.merge.progress') : t('cut.edit.hint')}
      </p>
      <div className="flex flex-col items-start gap-[0.55rem]">
        <div className="flex flex-wrap items-center gap-[0.45rem]">
          <Button
            type="button"
            variant="trim"
            className="inline-flex items-center gap-[0.45rem] px-[0.95rem] py-[0.55rem] text-[0.88rem] [&_svg]:size-[1rem]"
            icon={<IconScissors />}
            disabled={merging || !hasAnySegments}
            title={t('cut.scissors.hint')}
            aria-label={t('cut.scissors.aria')}
            onClick={() => splitCutSegmentsAtPlayhead()}
          >
            {t('cut.scissors')}
          </Button>
          <Button
            type="button"
            variant="utility"
            disabled={merging || !hasSplit}
            title={t('cut.reset')}
            onClick={() => cancelCutSelection()}
          >
            {t('cut.reset')}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-[0.45rem]">
          <Button
            type="button"
            variant="trim"
            className="px-[0.95rem] py-[0.55rem] text-[0.88rem]"
            disabled={muteDisabled}
            title={t('cut.mute.hint')}
            onClick={() => applyCutMute()}
          >
            {t('cut.mute')}
          </Button>
          <Button
            type="button"
            variant="trim"
            className="px-[0.95rem] py-[0.55rem] text-[0.88rem]"
            disabled={mergeDisabled}
            title={mergeTitle}
            aria-busy={merging}
            onClick={onMerge}
          >
            {merging ? t('cut.merge.busy') : t('cut.merge')}
          </Button>
        </div>
      </div>
    </div>
  )
}
