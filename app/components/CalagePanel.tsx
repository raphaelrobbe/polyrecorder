import { useEffect, useRef } from 'react'
import { formatSignedMs } from '../lib/format'
import { updateLatencyTrim } from '../lib/sessionActions.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { MsOffsetEditor } from './MsOffsetEditor'

type CalagePanelProps = {
  className?: string
}

export function CalagePanel({ className }: CalagePanelProps) {
  useLocale()
  const calageMode = useSessionStore((s) => s.calageMode)
  const calageTipOpen = useSessionStore((s) => s.calageTipOpen)
  const latencyTrimMs = useSessionStore((s) => s.latencyTrimMs)
  const lastReportedLatencyMs = useSessionStore((s) => s.lastReportedLatencyMs)
  const patch = useSessionStore((s) => s.patch)
  const panelRef = useRef<HTMLDivElement>(null)

  const total = Math.max(0, lastReportedLatencyMs + latencyTrimMs)
  const trimDelta =
    latencyTrimMs === 0 ? null : `(${formatSignedMs(latencyTrimMs)})`

  useEffect(() => {
    if (!calageTipOpen) return
    const onDocClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current && !panelRef.current.contains(target)) {
        patch({ calageTipOpen: false })
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [calageTipOpen, patch])

  if (!calageMode) return null

  return (
    <div ref={panelRef} className={cn('relative mt-[0.85rem] mb-0.5', className)}>
      <div className="flex flex-nowrap items-start gap-[0.4rem] max-sm:gap-[0.3rem]">
        <span className="shrink-0 pt-[0.28rem] text-[0.84rem] font-semibold text-ink-soft max-sm:text-[0.78rem]">
          {t('align.latency.label')}
        </span>
        <Button
          variant="round"
          className="mt-[0.22rem] h-[1.25rem] w-[1.25rem] shrink-0 border-ink/22 text-[0.72rem] font-bold text-ink-soft hover:enabled:border-ink/35 hover:enabled:bg-ink/6 hover:enabled:text-ink aria-expanded:border-ink/35 aria-expanded:bg-ink/6 aria-expanded:text-ink max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
          aria-expanded={calageTipOpen}
          aria-controls="calage-info-tip"
          title={t('align.latency.about')}
          onClick={(event) => {
            event.stopPropagation()
            patch({ calageTipOpen: !calageTipOpen })
          }}
        >
          ?
        </Button>
        <div className="ml-auto inline-flex flex-col items-center">
          <MsOffsetEditor
            title={t('align.latency.adjust')}
            value={total}
            onChange={(next) =>
              updateLatencyTrim(Math.max(0, next) - lastReportedLatencyMs)
            }
            minusAriaLabel={t('align.latency.minus')}
            plusAriaLabel={t('align.latency.plus')}
            inputAriaLabel={t('align.latency.input')}
            inputProps={{ 'data-latency-trim': true }}
          />
          <small
            className={cn(
              'mt-[0.08rem] min-h-[1.15em] text-center text-[0.62rem] font-semibold leading-[1.25] tabular-nums text-ink-soft',
              !trimDelta && 'invisible',
            )}
          >
            {trimDelta || '\u00a0'}
          </small>
        </div>
      </div>
      <p
        className="mt-[0.55rem] mb-0 text-[0.78rem] leading-[1.4] text-ink-soft max-sm:text-[0.72rem]"
        id="calage-info-tip"
        hidden={!calageTipOpen}
      >
        {t('align.latency.tip')}
      </p>
    </div>
  )
}
