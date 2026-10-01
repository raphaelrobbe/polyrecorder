import { useEffect, useRef, useState } from 'react'
import { Link } from '@remix-run/react'
import { setSessionAlignPref } from '../lib/sessionActions.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { CheckboxOption, OptionGroup } from './CheckboxOption'

type CalagePanelProps = {
  className?: string
}

export function CalagePanel({ className }: CalagePanelProps) {
  useLocale()
  const calageMode = useSessionStore((s) => s.calageMode)
  const showCalageWarnings = useSessionStore((s) => s.showCalageWarnings)
  const autoAlignEnabled = useSessionStore((s) => s.autoAlignEnabled)
  const skipCountInPlayback = useSessionStore((s) => s.skipCountInPlayback)
  const skipCountInDownload = useSessionStore((s) => s.skipCountInDownload)
  const [warningsTipOpen, setWarningsTipOpen] = useState(false)
  const [autoAlignTipOpen, setAutoAlignTipOpen] = useState(false)
  const warningsTipRef = useRef<HTMLDivElement>(null)
  const autoAlignTipRef = useRef<HTMLDivElement>(null)

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
      className={cn(
        'relative mt-[0.85rem] mb-0.5 flex flex-col gap-[0.85rem]',
        className,
      )}
    >
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
