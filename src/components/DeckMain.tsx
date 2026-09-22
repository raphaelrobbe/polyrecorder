import { useLayoutEffect, useRef } from 'react'
import { isDefaultSessionTitle } from '../lib/format'
import { normalizeAndSetSessionTitle } from '../lib/sessionActions'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useSessionStore } from '../store/sessionStore'
import { CaptureBar } from './CaptureBar'
import { CalagePanel } from './CalagePanel'
import { ModeTools } from './ModeTools'
import { ErrorBanner } from './StatusMessage'
import { TracksList } from './tracks/TracksList'

type DeckMainProps = {
  className?: string
}

export function DeckMain({ className }: DeckMainProps) {
  useLocale()
  const sessionTitle = useSessionStore((s) => s.sessionTitle)
  const setSessionTitle = useSessionStore((s) => s.setSessionTitle)
  const timerText = useSessionStore((s) => s.timerText)
  const recordingTimerVisible = useSessionStore((s) => s.recordingTimerVisible)
  const error = useSessionStore((s) => s.error)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  const defaultName = isDefaultSessionTitle(sessionTitle)
  const titleAria = t('session.title.aria')

  useLayoutEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [sessionTitle])

  return (
    <div className={cn(className)}>
      <div className="relative mb-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <textarea
          ref={titleRef}
          rows={1}
          className={cn(
            'col-start-2 justify-self-center w-[min(100%,22rem)] min-w-0 resize-none overflow-hidden border-0 bg-transparent font-[inherit] font-bold text-[1.35rem] leading-[1.25] text-center py-[0.2rem] px-[0.45rem] rounded-[10px] [font-synthesis:style] field-sizing-content',
            'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
            defaultName
              ? 'text-ink-soft italic font-semibold'
              : 'text-ink',
          )}
          data-session-title
          value={sessionTitle}
          maxLength={60}
          aria-label={titleAria}
          title={withShortcut(titleAria, 'F2', keyboardHintsEnabled)}
          data-title-base={titleAria}
          spellCheck={false}
          onChange={(event) =>
            setSessionTitle(event.target.value.replace(/\n/g, ' '))
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          onFocus={(event) => {
            if (!isDefaultSessionTitle(event.currentTarget.value)) return
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
          onBlur={(event) => {
            normalizeAndSetSessionTitle(event.currentTarget.value)
          }}
        />
        <div
          className="col-start-3 justify-self-end pt-[0.35rem] tabular-nums font-semibold tracking-[0.04em] text-ink-soft"
          data-timer
          hidden={!recordingTimerVisible}
        >
          {timerText}
        </div>
      </div>

      <CaptureBar />
      <TracksList />

      <ErrorBanner hidden={!error}>{error}</ErrorBanner>

      <CalagePanel />
      <ModeTools />
    </div>
  )
}
