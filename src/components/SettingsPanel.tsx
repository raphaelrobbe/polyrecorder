import { useEffect, useRef } from 'react'
import { prefersHeadphonesHint } from '../lib/audio/runtime'
import {
  applyInputMonitorSelection,
  applySinkMonitorSelection,
  applySinkPlaybackSelection,
  refreshDeviceSnapshot,
} from '../lib/sessionActions'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useDeckStore } from '../store/deckStore'
import { useSessionStore } from '../store/sessionStore'

export function SettingsPanel() {
  const leaveDeckOverlay = useDeckStore((s) => s.leaveDeckOverlay)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const autoplayAfterStop = useSessionStore((s) => s.autoplayAfterStop)
  const skipCountInPlayback = useSessionStore((s) => s.skipCountInPlayback)
  const skipCountInDownload = useSessionStore((s) => s.skipCountInDownload)
  const setAutoplayAfterStop = useSessionStore((s) => s.setAutoplayAfterStop)
  const setSkipCountInPlayback = useSessionStore((s) => s.setSkipCountInPlayback)
  const setSkipCountInDownload = useSessionStore((s) => s.setSkipCountInDownload)
  const sinkSelectable = useSessionStore((s) => s.sinkSelectable)
  const deviceSelectable = useSessionStore((s) => s.deviceSelectable)
  const outputOptions = useSessionStore((s) => s.outputOptions)
  const inputOptions = useSessionStore((s) => s.inputOptions)
  const sinkMonitorId = useSessionStore((s) => s.sinkMonitorId)
  const sinkPlaybackId = useSessionStore((s) => s.sinkPlaybackId)
  const inputMonitorId = useSessionStore((s) => s.inputMonitorId)
  const inputOverrideNote = useSessionStore((s) => s.inputOverrideNote)

  const closeRef = useRef<HTMLButtonElement>(null)
  const showMobileNote = prefersHeadphonesHint()
  const showDesktopDevices = !showMobileNote

  useEffect(() => {
    void refreshDeviceSnapshot()
    closeRef.current?.focus()

    const onDeviceChange = () => {
      void refreshDeviceSnapshot()
    }
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange)
    return () => {
      navigator.mediaDevices?.removeEventListener?.(
        'devicechange',
        onDeviceChange,
      )
    }
  }, [])

  return (
    <div className="deck-settings" data-deck-settings>
      <button
        ref={closeRef}
        type="button"
        className="btn-deck-icon btn-close-panel"
        data-close-settings
        aria-label="Fermer les paramètres"
        title={withShortcut('Fermer', 'Échap', keyboardHintsEnabled)}
        data-title-base="Fermer"
        onClick={() => leaveDeckOverlay()}
      >
        ×
      </button>
      <h2 className="settings-title">Paramètres</h2>
      <div className="settings-options">
        <label className="autoplay-option" data-autoplay-wrap>
          <input
            type="checkbox"
            data-autoplay-after-stop
            checked={autoplayAfterStop}
            onChange={(event) => setAutoplayAfterStop(event.target.checked)}
          />
          <span>Lire automatiquement après la fin de l'enregistrement</span>
        </label>
        <div className="settings-skip-count" data-skip-count-in-wrap>
          <span className="settings-skip-count-title">Supprimer le 1-2-3-4</span>
          <div className="settings-skip-count-options">
            <label
              className="autoplay-option"
              title="La lecture commence juste après le « 4 »"
            >
              <input
                type="checkbox"
                data-skip-count-in-playback
                checked={skipCountInPlayback}
                onChange={(event) =>
                  setSkipCountInPlayback(event.target.checked)
                }
              />
              <span>à la lecture</span>
            </label>
            <label
              className="autoplay-option"
              title="Le MP3 commence juste après le « 4 »"
            >
              <input
                type="checkbox"
                data-skip-count-in-download
                checked={skipCountInDownload}
                onChange={(event) =>
                  setSkipCountInDownload(event.target.checked)
                }
              />
              <span>au téléchargement du mp3</span>
            </label>
          </div>
        </div>

        <div className="settings-devices">
          <h3 className="settings-devices-title">Périphériques audio</h3>

          <p
            className="settings-note"
            data-devices-mobile-note
            hidden={!showMobileNote}
          >
            Sur téléphone ou tablette, choisir une entrée ou une sortie depuis le
            navigateur pose plus de problèmes que ça n’en résout (casque Bluetooth
            mal détecté, son coupé, micro imposé par le système…). Branche plutôt
            un casque : le téléphone gère la route audio.
          </p>

          <div data-devices-desktop hidden={!showDesktopDevices}>
            <div className="settings-devices-section" data-sink-settings>
              <h4 className="settings-devices-subtitle">Lecture</h4>
              <p className="settings-group-hint">
                Pour éviter que le micro reprenne le son lu : utilise un casque.
              </p>
              <div
                className="settings-devices-cols"
                data-sink-selects
                hidden={!sinkSelectable}
              >
                <label className="settings-device-col" data-sink-monitor-wrap>
                  <span className="settings-device-col-title">
                    pendant l'enregistrement
                  </span>
                  <select
                    className="settings-select"
                    data-sink-monitor
                    aria-label="Sortie pendant l'enregistrement"
                    value={sinkMonitorId}
                    onChange={(event) =>
                      applySinkMonitorSelection(event.target.value)
                    }
                  >
                    {outputOptions.map((option) => (
                      <option key={option.deviceId} value={option.deviceId}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="settings-device-col" data-sink-playback-wrap>
                  <span className="settings-device-col-title">en lecture</span>
                  <select
                    className="settings-select"
                    data-sink-playback
                    aria-label="Sortie en lecture"
                    value={sinkPlaybackId}
                    onChange={(event) =>
                      applySinkPlaybackSelection(event.target.value)
                    }
                  >
                    {outputOptions.map((option) => (
                      <option key={option.deviceId} value={option.deviceId}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p
                className="settings-note"
                data-sink-unsupported
                hidden={sinkSelectable}
              >
                Ce navigateur ne permet pas de choisir la sortie audio depuis la
                page. Branche un casque pour le monitoring, ou change la sortie
                dans les réglages du système.
              </p>
            </div>

            <div className="settings-devices-section">
              <h4 className="settings-devices-subtitle">Enregistrement</h4>
              <p className="settings-group-hint">
                Micro utilisé pour capturer les prises. Les libellés apparaissent
                après l’autorisation d’accès.
              </p>
              <div className="settings-devices-cols settings-devices-cols--single">
                <label className="settings-device-col" data-input-monitor-wrap>
                  <select
                    className="settings-select"
                    data-input-monitor
                    aria-label="Micro pendant l'enregistrement"
                    value={inputMonitorId}
                    disabled={!deviceSelectable && inputOptions.length === 0}
                    onChange={(event) =>
                      applyInputMonitorSelection(event.target.value)
                    }
                  >
                    {inputOptions.map((option) => (
                      <option key={option.deviceId} value={option.deviceId}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p
                className="settings-note"
                data-input-override-note
                hidden={!inputOverrideNote}
              >
                {inputOverrideNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
