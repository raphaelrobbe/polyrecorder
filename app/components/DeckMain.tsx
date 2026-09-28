import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useRouteLoaderData, Link } from '@remix-run/react'
import { isDefaultSessionTitle } from '../lib/format'
import {
  createOrUpdateMetronome,
  discard,
  dismissGuestSignInPrompt,
  loadCloudSongIntoSession,
  normalizeAndSetSessionTitle,
  setSessionAlignPref,
} from '../lib/sessionActions.client'
import { DEFAULT_METRONOME_BPM } from '../lib/audio/metronome.client'
import { ensureAudioContext } from '../lib/audio/runtime.client'
import { t } from '../lib/i18n'
import {
  libraryGroupPath,
  libraryRepertoirePath,
  librarySessionPath,
  librarySongPath,
  libraryUserPath,
} from '../lib/libraryPaths'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { withShortcut } from '../lib/withShortcut'
import type { loader as rootLoader } from '../root'
import { useSessionStore } from '../store/sessionStore'
import { CaptureBar } from './CaptureBar'
import { CalagePanel } from './CalagePanel'
import { Button } from './Button'
import { CheckboxOption } from './CheckboxOption'
import { Deck } from './Deck'
import { IconChevron, IconClose, IconDiscard } from './icons'
import { LibraryBreadcrumb } from './library/LibraryBreadcrumb'
import { ModeTools } from './ModeTools'
import { PianoKeyboard } from './PianoKeyboard'
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
  const timerText = useSessionStore((s) => s.timerText)
  const recordingTimerVisible = useSessionStore((s) => s.recordingTimerVisible)
  const forgottenStopHint = useSessionStore((s) => s.forgottenStopHint)
  const guestSignInPrompt = useSessionStore((s) => s.guestSignInPrompt)
  const autoAlignEnabled = useSessionStore((s) => s.autoAlignEnabled)
  const metronomeBpm = useSessionStore((s) => s.metronomeBpm)
  const calageMode = useSessionStore((s) => s.calageMode)
  const mixMode = useSessionStore((s) => s.mixMode)
  const error = useSessionStore((s) => s.error)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const tracks = useSessionStore((s) => s.tracks)
  const readOnlySession = useSessionStore((s) => s.readOnlySession)
  const canCloudContribute = useSessionStore((s) => s.canCloudContribute)
  const deckLibraryPath = useSessionStore((s) => s.deckLibraryPath)
  const sharedOwnerLabel = useSessionStore((s) => s.sharedOwnerLabel)
  const state = useSessionStore((s) => s.state)
  const deckSongPartId = useSessionStore((s) => s.deckSongPartId)
  const deckSongPartSiblings = useSessionStore((s) => s.deckSongPartSiblings)
  const sessionTitleRef = useRef<HTMLTextAreaElement>(null)
  const [sessionNavBusy, setSessionNavBusy] = useState(false)
  const [pianoOpen, setPianoOpen] = useState(false)

  /** Cloud song loaded: highlight the œuvre; session is secondary. */
  const cloudSongLoaded = songWorkName != null
  const defaultName = !cloudSongLoaded && isDefaultSessionTitle(sessionTitle)
  const songTitleAria = t('song.title.aria')
  const sessionTitleAria = t('session.title.aria')
  const showModes = tracks.length > 0
  const hasMetronome =
    metronomeBpm != null || tracks.some((track) => track.isMetronome)
  const showMetronomeAdd =
    !calageMode && !mixMode && !hasMetronome && state !== 'recording'
  /** Auto-align prefs only; hide in mix/calage or when there is nothing to show. */
  const showToolsDeck =
    !calageMode && !mixMode && (Boolean(user) || showModes)
  const ownLibrary =
    Boolean(user) &&
    deckLibraryPath != null &&
    user!.pseudo === deckLibraryPath.ownerPseudo
  const consultationCredit = readOnlySession
    ? [
        sharedOwnerLabel?.trim() || t('song.view.shared'),
        canCloudContribute ? t('song.view.collaborate') : null,
      ]
        .filter(Boolean)
        .join(' · ')
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
    navigate(librarySessionPath(songPartId))
    void loadCloudSongIntoSession(songPartId).finally(() => {
      setSessionNavBusy(false)
    })
  }

  useLayoutEffect(() => {
    const el = sessionTitleRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [sessionTitle, songWorkName])

  useEffect(() => {
    if (!showModes) setPianoOpen(false)
  }, [showModes])

  return (
    <div className={cn('flex flex-col gap-[0.85rem]', className)}>
      <Deck enableAudioDrop>
      {deckLibraryPath ? (
        <LibraryBreadcrumb
          items={[
            ownLibrary
              ? {
                  label: t('nav.myLibrary'),
                  to: libraryUserPath(deckLibraryPath.ownerPseudo),
                  asButton: true,
                }
              : {
                  label: deckLibraryPath.ownerPseudo,
                  to: libraryUserPath(deckLibraryPath.ownerPseudo),
                  isPseudo: true,
                },
            {
              label: deckLibraryPath.groupName,
              to: libraryGroupPath(deckLibraryPath.groupId),
            },
            {
              label: deckLibraryPath.repertoireName,
              to: libraryRepertoirePath(deckLibraryPath.repertoireId),
            },
          ]}
        />
      ) : null}
      <div className="relative mb-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <div className="col-start-2 flex w-[min(100%,22rem)] min-w-0 flex-col items-center justify-self-center">
          {cloudSongLoaded ? (
            <>
              {deckLibraryPath ? (
                <Link
                  to={librarySongPath(deckLibraryPath.songId)}
                  className={cn(
                    'block w-full min-w-0 truncate rounded-[10px] px-[0.45rem] py-[0.2rem] text-center font-bold text-[1.35rem] leading-[1.25] text-ink no-underline',
                    'transition-[color] duration-150',
                    'hover:underline hover:decoration-ink/25 hover:underline-offset-2',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
                  )}
                  aria-label={songTitleAria}
                  title={t('song.title.openLibrary')}
                >
                  {songWorkName}
                </Link>
              ) : (
                <p className="m-0 w-full min-w-0 truncate px-[0.45rem] py-[0.2rem] text-center font-bold text-[1.35rem] leading-[1.25] text-ink">
                  {songWorkName}
                </p>
              )}
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
      {showModes && pianoOpen ? <PianoKeyboard /> : null}
      <div
        className="relative mb-[0.55rem] rounded-[14px] border border-accent/25 bg-accent-soft px-[0.95rem] py-[0.85rem] text-center animate-rise"
        hidden={!guestSignInPrompt || Boolean(user) || state === 'recording'}
        role="status"
      >
        <button
          type="button"
          className="absolute top-[0.35rem] right-[0.4rem] m-0 inline-flex h-[1.6rem] w-[1.6rem] cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[1.15rem] leading-none text-ink-soft hover:bg-ink/8 hover:text-ink"
          aria-label={t('guest.prompt.dismiss')}
          title={t('guest.prompt.dismiss')}
          onClick={() => dismissGuestSignInPrompt()}
        >
          <IconClose />
        </button>
        <p className="m-0 text-[0.92rem] font-medium leading-[1.4] text-ink">
          {t('guest.prompt.body')}
        </p>
        <p className="mt-[0.45rem] mb-0 text-[0.92rem] font-medium leading-[1.4] text-ink">
          {t('guest.prompt.bodyAccount')}
        </p>
        <Button
          variant="default"
          className="mt-[0.75rem] bg-ink px-[1.1rem] py-[0.7rem] text-[0.88rem] text-on-ink"
          onClick={() => navigate('/connexion')}
        >
          {t('guest.prompt.cta')}
        </Button>
      </div>
      <div
        className="mb-[0.55rem] rounded-[14px] border-[1.5px] border-warn-border bg-warn-bg px-[0.95rem] py-[0.7rem] text-center text-[0.88rem] font-semibold leading-[1.35] text-warn"
        hidden={!forgottenStopHint}
        role="status"
      >
        <p className="m-0">{t('capture.forgottenStop')}</p>
        <p className="mt-[0.45rem] mb-0 font-medium">
          {t('capture.forgottenStop.discard')
            .split('{discard}')
            .flatMap((part, index, parts) =>
              index < parts.length - 1
                ? [
                    part,
                    <Button
                      key={`discard-${index}`}
                      variant="transport"
                      className="mx-[0.25rem] inline-flex h-[1.7rem] w-[1.7rem] align-[-0.35em] border-[1.5px] border-warn-border bg-transparent text-warn shadow-none hover:enabled:translate-y-0 hover:enabled:border-warn-border hover:enabled:bg-warn-hover hover:enabled:text-warn hover:enabled:shadow-none active:enabled:scale-[0.96] [&_svg]:size-[0.95rem]"
                      icon={<IconDiscard />}
                      aria-label={t('capture.discard')}
                      title={t('capture.discard')}
                      onClick={() => void discard()}
                    />,
                  ]
                : [part],
            )}
        </p>
      </div>
      <TracksList />

      <ErrorBanner hidden={!error}>{error}</ErrorBanner>

      <CalagePanel />
      </Deck>

      {showModes ? (
        <ModeTools
          className="w-full self-stretch"
          pianoOpen={pianoOpen}
          onPianoOpenChange={setPianoOpen}
        />
      ) : null}

      {showToolsDeck || showMetronomeAdd ? (
        <div
          className="px-1 max-sm:px-0.5"
          aria-label={t('deck.toolsAria')}
        >
          <div className="flex flex-col items-start gap-[0.45rem]">
            {showMetronomeAdd ? (
              <button
                type="button"
                className="m-0 border-0 bg-transparent p-0 text-[0.84rem] font-semibold leading-none text-ink-soft underline decoration-ink/25 underline-offset-2 hover:text-ink hover:decoration-ink/55 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2"
                onClick={() => {
                  void ensureAudioContext().catch(() => {})
                  void createOrUpdateMetronome(DEFAULT_METRONOME_BPM)
                }}
              >
                {t('deck.metronome.add')}
              </button>
            ) : null}
            {showToolsDeck ? (
              <div className="flex flex-wrap items-center gap-x-[0.45rem] gap-y-[0.35rem]">
                <CheckboxOption
                  align="center"
                  className="text-[0.84rem] leading-none"
                  checked={autoAlignEnabled}
                  onCheckedChange={(on) =>
                    setSessionAlignPref('autoAlignEnabled', on)
                  }
                >
                  {t('deck.autoAlign.label')}
                </CheckboxOption>
                <Link
                  to="/aide#mode-emploi-calage"
                  className="text-[0.84rem] font-semibold leading-none text-ink-soft underline decoration-ink/25 underline-offset-2 hover:text-ink hover:decoration-ink/55"
                >
                  {t('deck.howtoLink')}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
