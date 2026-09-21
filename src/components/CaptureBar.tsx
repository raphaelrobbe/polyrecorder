import {
  discard,
  nextTrack,
  startSession,
  stopSession,
} from '../lib/sessionActions'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useSessionStore } from '../store/sessionStore'
import { MixTransport } from './MixTransport'

export function CaptureBar() {
  const state = useSessionStore((s) => s.state)
  const tracks = useSessionStore((s) => s.tracks)
  const meterLevel = useSessionStore((s) => s.meterLevel)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)

  const recording = state === 'recording'
  const recordOnly = !recording && tracks.length === 0

  return (
    <div
      className={`capture-bar${recordOnly ? ' is-record-only' : ''}`}
      data-capture-bar
    >
      <div
        className="meter"
        data-meter-wrap
        hidden={!recording}
        aria-hidden={!recording}
      >
        <span
          data-meter
          style={{
            width: `${Math.max(0, Math.min(100, meterLevel))}%`,
          }}
        />
      </div>
      <MixTransport />
      <div
        className={`capture-actions${recording ? ' recording' : ''}`}
        data-controls
      >
        <button
          type="button"
          className="btn btn-transport btn-next"
          data-next
          hidden={!recording}
          disabled={!recording}
          aria-label="Piste suivante"
          title={withShortcut(
            'Piste suivante : rejoue cette prise et enregistre la suivante en même temps.',
            'S / N',
            keyboardHintsEnabled,
          )}
          data-title-base="Piste suivante : rejoue cette prise et enregistre la suivante en même temps."
          onClick={() => void nextTrack()}
        >
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M5.5 5.5v13l9.5-6.5-9.5-6.5zm11 0h2.5v13H16.5V5.5z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="btn btn-transport btn-discard"
          data-discard
          hidden={!recording}
          disabled={!recording}
          aria-label="Annuler la prise et recommencer"
          title={withShortcut(
            'Annuler la prise et recommencer',
            'Suppr',
            keyboardHintsEnabled,
          )}
          data-title-base="Annuler la prise et recommencer"
          onClick={() => void discard()}
        >
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h2v9H6V9zm1 12c-.6 0-1-.4-1-1l1-11h10l1 11c0 .6-.4 1-1 1H7z"
            />
          </svg>
        </button>
        <button
          type="button"
          className="btn btn-transport btn-record"
          data-record
          hidden={recording}
          disabled={recording}
          aria-label="Enregistrer"
          title={withShortcut('Enregistrer', 'E / R', keyboardHintsEnabled)}
          data-title-base="Enregistrer"
          onClick={() => void startSession()}
        >
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="6.5" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className={`btn btn-transport btn-stop${recording ? ' is-recording' : ''}`}
          data-stop
          hidden={!recording}
          disabled={!recording}
          aria-label="Stop"
          title={withShortcut('Stop', 'Entrée', keyboardHintsEnabled)}
          data-title-base="Stop"
          onClick={() => void stopSession()}
        >
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  )
}
