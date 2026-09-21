import { setCalageMode } from '../lib/sessionActions'
import { useDeckStore } from '../store/deckStore'
import { useSessionStore } from '../store/sessionStore'

export function ModeRow() {
  const tracks = useSessionStore((s) => s.tracks)
  const calageMode = useSessionStore((s) => s.calageMode)
  const openDeckPanel = useDeckStore((s) => s.openDeckPanel)

  return (
    <div className="mode-row">
      <label
        className="mode-toggle"
        hidden={tracks.length === 0}
        data-calage-mode-wrap
      >
        <input
          type="checkbox"
          data-calage-mode
          checked={calageMode}
          onChange={(event) => {
            const on = event.target.checked
            setCalageMode(on)
            if (!on) {
              useSessionStore.getState().patch({ calageTipOpen: false })
            }
          }}
        />
        <span>Mode calage</span>
      </label>
      <div className="utility-actions">
        <button
          type="button"
          className="btn-utility"
          data-open-help
          aria-label="Aide"
          title="Aide"
          onClick={() => openDeckPanel('help')}
        >
          <span className="btn-utility-glyph" aria-hidden="true">
            ?
          </span>
          <span>Aide</span>
        </button>
        <button
          type="button"
          className="btn-utility"
          data-open-settings
          aria-label="Paramètres"
          title="Paramètres"
          onClick={() => openDeckPanel('settings')}
        >
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.62l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.49-.41h-3.84a.5.5 0 0 0-.49.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.74 8.86a.5.5 0 0 0 .12.62l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.62l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.5.5 0 0 0 .49.41h3.84a.5.5 0 0 0 .49-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.62l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
            />
          </svg>
          <span>Paramètres</span>
        </button>
      </div>
    </div>
  )
}
