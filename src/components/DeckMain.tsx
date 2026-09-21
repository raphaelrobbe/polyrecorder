import { isDefaultSessionTitle } from '../lib/format'
import { normalizeAndSetSessionTitle } from '../lib/sessionActions'
import { cn } from '../lib/utils'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useSessionStore } from '../store/sessionStore'
import { CaptureBar } from './CaptureBar'
import { CalagePanel } from './CalagePanel'
import { ErrorBanner } from './StatusMessage'
import { TracksList } from './tracks/TracksList'

type DeckMainProps = {
  className?: string
}

export function DeckMain({ className }: DeckMainProps) {
  const sessionTitle = useSessionStore((s) => s.sessionTitle)
  const setSessionTitle = useSessionStore((s) => s.setSessionTitle)
  const timerText = useSessionStore((s) => s.timerText)
  const recordingTimerVisible = useSessionStore((s) => s.recordingTimerVisible)
  const error = useSessionStore((s) => s.error)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)

  const defaultName = isDefaultSessionTitle(sessionTitle)

  return (
    <div className={cn(className)}>
      <div className="relative mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <input
          type="text"
          className={cn(
            'col-start-2 justify-self-center w-[min(100%,22rem)] min-w-0 border-0 bg-transparent font-[inherit] font-bold text-[1.35rem] leading-[1.25] text-center py-[0.2rem] px-[0.45rem] rounded-[10px] [font-synthesis:style]',
            'hover:bg-[rgba(15,61,62,0.06)] focus:bg-[rgba(15,61,62,0.06)] focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(15,61,62,0.18)]',
            defaultName
              ? 'text-ink-soft italic font-semibold'
              : 'text-ink',
          )}
          data-session-title
          value={sessionTitle}
          maxLength={60}
          aria-label="Titre de l'enregistrement"
          title={withShortcut(
            "Titre de l'enregistrement",
            'F2',
            keyboardHintsEnabled,
          )}
          data-title-base="Titre de l'enregistrement"
          spellCheck={false}
          onChange={(event) => setSessionTitle(event.target.value)}
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
          className="col-start-3 justify-self-end tabular-nums font-semibold tracking-[0.04em] text-ink-soft"
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
    </div>
  )
}
