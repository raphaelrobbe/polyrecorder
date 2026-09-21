import { isDefaultSessionTitle } from '../lib/format'
import { normalizeAndSetSessionTitle } from '../lib/sessionActions'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useSessionStore } from '../store/sessionStore'
import { CaptureBar } from './CaptureBar'
import { CalagePanel } from './CalagePanel'
import { TracksList } from './TracksList'

export function DeckMain() {
  const sessionTitle = useSessionStore((s) => s.sessionTitle)
  const setSessionTitle = useSessionStore((s) => s.setSessionTitle)
  const timerText = useSessionStore((s) => s.timerText)
  const recordingTimerVisible = useSessionStore((s) => s.recordingTimerVisible)
  const error = useSessionStore((s) => s.error)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)

  return (
    <div className="deck-main" data-deck-main>
      <div className="status">
        <input
          type="text"
          className={`session-title${isDefaultSessionTitle(sessionTitle) ? ' is-default-name' : ''}`}
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
        <div className="timer" data-timer hidden={!recordingTimerVisible}>
          {timerText}
        </div>
      </div>

      <CaptureBar />
      <TracksList />

      <p className="error" data-error hidden={!error}>
        {error}
      </p>

      <CalagePanel />
    </div>
  )
}
