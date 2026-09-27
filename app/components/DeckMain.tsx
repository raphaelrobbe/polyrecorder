import { useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useRouteLoaderData } from '@remix-run/react'
import { isDefaultSessionTitle } from '../lib/format'
import {
  loadCloudSongIntoSession,
  normalizeAndSetSessionTitle,
  normalizeAndSetSongWorkName,
} from '../lib/sessionActions.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { withShortcut } from '../lib/withShortcut'
import type { loader as rootLoader } from '../root'
import { useSessionStore } from '../store/sessionStore'
import { CaptureBar } from './CaptureBar'
import { CalagePanel } from './CalagePanel'
import { IconChevron } from './icons'
import { ModeTools } from './ModeTools'
import { ErrorBanner } from './StatusMessage'
import { TracksList } from './tracks/TracksList'

type DeckMainProps = {
  className?: string
}

const sessionNavBtnClass = cn(
  'm-0 grid h-[1.6rem] w-[1.6rem] shrink-0 place-items-center rounded-lg border border-ink/15 bg-transparent p-0',
  'text-ink/55 transition-[background,color,border-color] duration-150',
  'cursor-pointer hover:border-ink/28 hover:bg-ink/6 hover:text-ink',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ink/15 disabled:hover:bg-transparent disabled:hover:text-ink/55',
  '[&_svg]:size-[0.95rem]',
)

/** Jump to the previous / next recording session of the same cloud song. */
function SessionNavButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  useLocale()
  const label = direction === 'prev' ? t('session.prev') : t('session.next')
  return (
    <button
      type="button"
      className={sessionNavBtnClass}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <IconChevron
        className={direction === 'prev' ? 'rotate-90' : '-rotate-90'}
      />
    </button>
  )
}

export function DeckMain({ className }: DeckMainProps) {
  useLocale()
  const navigate = useNavigate()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const sessionTitle = useSessionStore((s) => s.sessionTitle)
  const setSessionTitle = useSessionStore((s) => s.setSessionTitle)
  const songWorkName = useSessionStore((s) => s.songWorkName)
  const setSongWorkName = useSessionStore((s) => s.setSongWorkName)
  const timerText = useSessionStore((s) => s.timerText)
  const recordingTimerVisible = useSessionStore((s) => s.recordingTimerVisible)
  const error = useSessionStore((s) => s.error)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const tracks = useSessionStore((s) => s.tracks)
  const readOnlySession = useSessionStore((s) => s.readOnlySession)
  const songLibraryPath = useSessionStore((s) => s.songLibraryPath)
  const sharedOwnerLabel = useSessionStore((s) => s.sharedOwnerLabel)
  const state = useSessionStore((s) => s.state)
  const deckSongPartId = useSessionStore((s) => s.deckSongPartId)
  const deckSongPartSiblings = useSessionStore((s) => s.deckSongPartSiblings)
  const songTitleRef = useRef<HTMLTextAreaElement>(null)
  const sessionTitleRef = useRef<HTMLTextAreaElement>(null)
  const [sessionNavBusy, setSessionNavBusy] = useState(false)

  /** Cloud song loaded: highlight the œuvre; session is secondary. */
  const cloudSongLoaded = songWorkName != null
  const defaultName = !cloudSongLoaded && isDefaultSessionTitle(sessionTitle)
  const songTitleAria = t('song.title.aria')
  const sessionTitleAria = t('session.title.aria')
  const showModes = tracks.length > 0
  const consultationCredit = readOnlySession
    ? sharedOwnerLabel?.trim() || t('song.view.shared')
    : null

  const siblingIndex = deckSongPartId
    ? deckSongPartSiblings.findIndex(
        (sibling) => sibling.id === deckSongPartId,
      )
    : -1
  const showSessionNav =
    cloudSongLoaded && deckSongPartSiblings.length > 1 && siblingIndex >= 0
  /** Single unnamed cloud session: hide the secondary title row. */
  const hideSessionTitle =
    cloudSongLoaded &&
    deckSongPartSiblings.length <= 1 &&
    !sessionTitle.trim()
  const sessionUnnamedPlaceholder = cloudSongLoaded
    ? t('library.songPart.unnamed')
    : undefined
  const prevSibling =
    siblingIndex > 0 ? deckSongPartSiblings[siblingIndex - 1]! : null
  const nextSibling =
    siblingIndex >= 0
      ? (deckSongPartSiblings[siblingIndex + 1] ?? null)
      : null

  const goToSibling = (songPartId: string) => {
    setSessionNavBusy(true)
    void loadCloudSongIntoSession(songPartId).finally(() => {
      setSessionNavBusy(false)
    })
  }

  useLayoutEffect(() => {
    for (const el of [songTitleRef.current, sessionTitleRef.current]) {
      if (!el) continue
      el.style.height = '0px'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [sessionTitle, songWorkName])

  return (
    <div className={cn(className)}>
      <div className="relative mb-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <div className="col-start-2 flex w-[min(100%,22rem)] min-w-0 flex-col items-center justify-self-center">
          {songLibraryPath && !readOnlySession ? (
            <p className="m-0 mb-1 max-w-full truncate text-center text-[0.72rem] font-semibold tracking-[0.02em] text-ink-soft">
              {songLibraryPath}
            </p>
          ) : null}

          {cloudSongLoaded ? (
            <>
              <textarea
                ref={songTitleRef}
                rows={1}
                readOnly={readOnlySession}
                className={cn(
                  'w-full min-w-0 resize-none overflow-hidden border-0 bg-transparent font-[inherit] font-bold text-[1.35rem] leading-[1.25] text-center py-[0.2rem] px-[0.45rem] rounded-[10px] [font-synthesis:style] field-sizing-content text-ink',
                  readOnlySession
                    ? 'cursor-default'
                    : 'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
                )}
                data-song-title
                value={songWorkName}
                maxLength={60}
                aria-label={songTitleAria}
                title={
                  readOnlySession
                    ? songTitleAria
                    : withShortcut(songTitleAria, 'F2', keyboardHintsEnabled)
                }
                spellCheck={false}
                onChange={(event) => {
                  if (readOnlySession) return
                  setSongWorkName(event.target.value.replace(/\n/g, ' '))
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    event.currentTarget.blur()
                  }
                }}
                onBlur={(event) => {
                  if (readOnlySession) return
                  normalizeAndSetSongWorkName(event.currentTarget.value)
                }}
              />
              <div
                className="mt-0.5 flex w-full min-w-0 items-center gap-[0.25rem]"
                style={hideSessionTitle ? { display: 'none' } : undefined}
              >
                {showSessionNav ? (
                  <SessionNavButton
                    direction="prev"
                    disabled={
                      !prevSibling ||
                      sessionNavBusy ||
                      state === 'recording'
                    }
                    onClick={() => {
                      if (prevSibling) goToSibling(prevSibling.id)
                    }}
                  />
                ) : null}
                <textarea
                  ref={sessionTitleRef}
                  rows={1}
                  readOnly={readOnlySession}
                  className={cn(
                    'min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent font-[inherit] text-[0.88rem] font-semibold leading-[1.3] text-center py-[0.15rem] px-[0.45rem] rounded-[8px] [font-synthesis:style] field-sizing-content text-ink-soft',
                    !sessionTitle.trim() && sessionUnnamedPlaceholder && 'italic',
                    readOnlySession
                      ? 'cursor-default'
                      : 'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
                  )}
                  data-session-title
                  value={sessionTitle}
                  placeholder={sessionUnnamedPlaceholder}
                  maxLength={60}
                  aria-label={sessionTitleAria}
                  title={sessionTitleAria}
                  data-title-base={sessionTitleAria}
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
                  onBlur={(event) => {
                    if (readOnlySession) return
                    normalizeAndSetSessionTitle(event.currentTarget.value)
                  }}
                />
                {showSessionNav ? (
                  <SessionNavButton
                    direction="next"
                    disabled={
                      !nextSibling ||
                      sessionNavBusy ||
                      state === 'recording'
                    }
                    onClick={() => {
                      if (nextSibling) goToSibling(nextSibling.id)
                    }}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <textarea
              ref={sessionTitleRef}
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
              aria-label={sessionTitleAria}
              title={
                readOnlySession
                  ? sessionTitleAria
                  : withShortcut(sessionTitleAria, 'F2', keyboardHintsEnabled)
              }
              data-title-base={sessionTitleAria}
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
          )}

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
