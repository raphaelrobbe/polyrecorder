import { useLayoutEffect, useRef } from 'react'
import { useNavigate, useRouteLoaderData } from '@remix-run/react'
import { isDefaultSessionTitle } from '../lib/format'
import { normalizeAndSetSessionTitle } from '../lib/sessionActions.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { withShortcut } from '../lib/withShortcut'
import type { loader as rootLoader } from '../root'
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
  const navigate = useNavigate()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const sessionTitle = useSessionStore((s) => s.sessionTitle)
  const setSessionTitle = useSessionStore((s) => s.setSessionTitle)
  const timerText = useSessionStore((s) => s.timerText)
  const recordingTimerVisible = useSessionStore((s) => s.recordingTimerVisible)
  const error = useSessionStore((s) => s.error)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const tracks = useSessionStore((s) => s.tracks)
  const readOnlySession = useSessionStore((s) => s.readOnlySession)
  const songLibraryPath = useSessionStore((s) => s.songLibraryPath)
  const sharedOwnerLabel = useSessionStore((s) => s.sharedOwnerLabel)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  const defaultName = isDefaultSessionTitle(sessionTitle)
  const titleAria = t('session.title.aria')
  const showModes = tracks.length > 0
  const consultationCredit = readOnlySession
    ? sharedOwnerLabel?.trim() || t('song.view.shared')
    : null

  useLayoutEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [sessionTitle])

  return (
    <div className={cn(className)}>
      <div className="relative mb-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <div className="col-start-2 flex w-[min(100%,22rem)] min-w-0 flex-col items-center justify-self-center">
          {songLibraryPath && !readOnlySession ? (
            <p className="m-0 mb-1 max-w-full truncate text-center text-[0.72rem] font-semibold tracking-[0.02em] text-ink-soft">
              {songLibraryPath}
            </p>
          ) : null}
          <textarea
          ref={titleRef}
          rows={1}
          readOnly={readOnlySession}
          className={cn(
            'w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent font-[inherit] font-bold text-[1.35rem] leading-[1.25] text-center py-[0.2rem] px-[0.45rem] rounded-[10px] [font-synthesis:style] field-sizing-content',
            readOnlySession
              ? 'text-ink cursor-default'
              : 'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
            !readOnlySession && defaultName
              ? 'text-ink-soft italic font-semibold'
              : !readOnlySession
                ? 'text-ink'
                : null,
          )}
          data-session-title
          value={sessionTitle}
          maxLength={60}
          aria-label={titleAria}
          title={
            readOnlySession
              ? titleAria
              : withShortcut(titleAria, 'F2', keyboardHintsEnabled)
          }
          data-title-base={titleAria}
          spellCheck={false}
          onChange={(event) => {
            if (readOnlySession) return
            setSessionTitle(event.target.value.replace(/\n/g, ' '))
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          onFocus={(event) => {
            if (readOnlySession) return
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
            if (readOnlySession) return
            normalizeAndSetSessionTitle(event.currentTarget.value)
          }}
        />
          {consultationCredit ? (
            <p className="m-0 mt-1 max-w-full truncate text-center text-[0.72rem] font-semibold tracking-[0.02em] text-ink-soft">
              {consultationCredit}
            </p>
          ) : null}
        </div>
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

      {user || showModes ? (
        <div
          className={cn(
            'mt-4 flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.45rem]',
            'max-sm:mt-3',
          )}
        >
          {user ? (
            <button
              type="button"
              className={cn(
                'm-0 inline-flex items-center gap-[0.35rem] rounded-full border-[1.5px] border-line bg-surface px-[0.75rem] py-[0.4rem]',
                'font-[inherit] text-[0.84rem] font-bold tracking-[0.01em] text-ink',
                'transition-[background,color,border-color,box-shadow,transform] duration-160',
                'cursor-pointer active:scale-[0.98]',
                'hover:border-ink/35 hover:bg-ink/6',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
              )}
              aria-label={t('nav.library')}
              title={t('nav.library')}
              onClick={() => navigate('/bibliotheque')}
            >
              <span>{t('nav.library')}</span>
              <span
                aria-hidden="true"
                className="translate-y-px text-[0.95rem] font-medium leading-none text-ink/45"
              >
                ›
              </span>
            </button>
          ) : null}
          <ModeTools className="mt-0 ml-auto justify-end max-sm:mt-0" />
        </div>
      ) : null}
    </div>
  )
}
