import { useEffect, useRef, useState } from 'react'
import { Link } from '@remix-run/react'
import { formatSignedMs } from '../lib/format'
import {
  setSessionAlignPref,
  updateLatencyTrim,
} from '../lib/sessionActions.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { useSessionStore } from '../store/sessionStore'
import { withBrand } from './BrandInline'
import { Button } from './Button'
import { CheckboxOption, OptionGroup } from './CheckboxOption'
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
  const showCalageWarnings = useSessionStore((s) => s.showCalageWarnings)
  const autoAlignEnabled = useSessionStore((s) => s.autoAlignEnabled)
  const skipCountInPlayback = useSessionStore((s) => s.skipCountInPlayback)
  const skipCountInDownload = useSessionStore((s) => s.skipCountInDownload)
  const patch = useSessionStore((s) => s.patch)
  const panelRef = useRef<HTMLDivElement>(null)
  const [warningsTipOpen, setWarningsTipOpen] = useState(false)
  const [autoAlignTipOpen, setAutoAlignTipOpen] = useState(false)
  const warningsTipRef = useRef<HTMLDivElement>(null)
  const autoAlignTipRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!warningsTipOpen) return
    const onDocClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        warningsTipRef.current &&
        !warningsTipRef.current.contains(target)
      ) {
        setWarningsTipOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [warningsTipOpen])

  useEffect(() => {
    if (!autoAlignTipOpen) return
    const onDocClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        autoAlignTipRef.current &&
        !autoAlignTipRef.current.contains(target)
      ) {
        setAutoAlignTipOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [autoAlignTipOpen])

  if (!calageMode) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative mt-[0.85rem] mb-0.5 flex flex-col gap-[0.85rem]',
        className,
      )}
    >
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
        className="m-0 text-[0.78rem] leading-[1.4] text-ink-soft max-sm:text-[0.72rem]"
        id="calage-info-tip"
        hidden={!calageTipOpen}
      >
        {withBrand(t('align.latency.tip'))}
      </p>

      <div ref={autoAlignTipRef}>
        <div className="flex items-start gap-[0.4rem]">
          <CheckboxOption
            className="min-w-0 flex-1"
            checked={autoAlignEnabled}
            onCheckedChange={(on) =>
              setSessionAlignPref('autoAlignEnabled', on)
            }
          >
            {t('settings.autoAlign')}
          </CheckboxOption>
          <Button
            variant="round"
            className="mt-[0.12rem] h-[1.25rem] w-[1.25rem] shrink-0 border-ink/22 text-[0.72rem] font-bold text-ink-soft hover:enabled:border-ink/35 hover:enabled:bg-ink/6 hover:enabled:text-ink aria-expanded:border-ink/35 aria-expanded:bg-ink/6 aria-expanded:text-ink max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
            aria-expanded={autoAlignTipOpen}
            aria-controls="calage-auto-align-tip"
            title={t('settings.autoAlign.about')}
            onClick={(event) => {
              event.stopPropagation()
              setAutoAlignTipOpen((open) => !open)
            }}
          >
            ?
          </Button>
        </div>
        <p
          className="mt-[0.55rem] mb-0 text-[0.78rem] leading-[1.4] text-ink-soft max-sm:text-[0.72rem]"
          id="calage-auto-align-tip"
          hidden={!autoAlignTipOpen}
        >
          {t('settings.autoAlign.tip')}
        </p>
        <Link
          to="/aide#mode-emploi-calage"
          className="mt-[0.45rem] inline-block text-[0.78rem] font-semibold text-ink-soft underline-offset-2 hover:text-ink hover:underline"
        >
          {t('deck.howtoLink')}
        </Link>
      </div>

      {autoAlignEnabled ? (
        <div ref={warningsTipRef}>
          <div className="flex items-start gap-[0.4rem]">
            <CheckboxOption
              className="min-w-0 flex-1"
              checked={showCalageWarnings}
              onCheckedChange={(on) =>
                setSessionAlignPref('showCalageWarnings', on)
              }
            >
              {t('settings.showCalageWarnings')}
            </CheckboxOption>
            <Button
              variant="round"
              className="mt-[0.12rem] h-[1.25rem] w-[1.25rem] shrink-0 border-ink/22 text-[0.72rem] font-bold text-ink-soft hover:enabled:border-ink/35 hover:enabled:bg-ink/6 hover:enabled:text-ink aria-expanded:border-ink/35 aria-expanded:bg-ink/6 aria-expanded:text-ink max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
              aria-expanded={warningsTipOpen}
              aria-controls="calage-warnings-tip"
              title={t('settings.showCalageWarnings.about')}
              onClick={(event) => {
                event.stopPropagation()
                setWarningsTipOpen((open) => !open)
              }}
            >
              ?
            </Button>
          </div>
          <p
            className="mt-[0.55rem] mb-0 text-[0.78rem] leading-[1.4] text-ink-soft max-sm:text-[0.72rem]"
            id="calage-warnings-tip"
            hidden={!warningsTipOpen}
          >
            {t('settings.showCalageWarnings.tip')}
          </p>
        </div>
      ) : null}

      <OptionGroup title={t('settings.skipCountIn')}>
        <CheckboxOption
          title={t('settings.skipCountIn.play.hint')}
          checked={skipCountInPlayback}
          onCheckedChange={(on) =>
            setSessionAlignPref('skipCountInPlayback', on)
          }
        >
          {t('settings.skipCountIn.play')}
        </CheckboxOption>
        <CheckboxOption
          title={t('settings.skipCountIn.download.hint')}
          checked={skipCountInDownload}
          onCheckedChange={(on) =>
            setSessionAlignPref('skipCountInDownload', on)
          }
        >
          {t('settings.skipCountIn.download')}
        </CheckboxOption>
      </OptionGroup>
    </div>
  )
}
