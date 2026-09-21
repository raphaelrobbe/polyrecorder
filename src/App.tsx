import { useEffect } from 'react'
import { Brand } from './components/Brand'
import { DeckMain } from './components/DeckMain'
import { HelpPanel } from './components/HelpPanel'
import { MarkingHelp } from './components/MarkingHelp'
import { ModeRow } from './components/ModeRow'
import { SettingsPanel } from './components/SettingsPanel'
import { useDeckHistory } from './hooks/useDeckHistory'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import {
  initLatencyProbe,
  refreshDeviceSnapshot,
  stopPlayback,
  syncLatencyDisplay,
} from './lib/sessionActions'
import { releaseMic, stopMeterNodes, getMediaStream } from './lib/audio/runtime'
import { useDeckStore } from './store/deckStore'
import { useSessionStore } from './store/sessionStore'

export function App() {
  const view = useDeckStore((s) => s.view)
  const calageMode = useSessionStore((s) => s.calageMode)
  const hint = useSessionStore((s) => s.hint)

  useDeckHistory()
  useKeyboardShortcuts()

  useEffect(() => {
    void initLatencyProbe()
    void refreshDeviceSnapshot()
    syncLatencyDisplay()

    const onBeforeUnload = () => {
      stopPlayback()
      stopMeterNodes()
      const stream = getMediaStream()
      if (stream) {
        for (const track of stream.getTracks()) track.stop()
      }
      releaseMic()
      for (const track of useSessionStore.getState().tracks) {
        URL.revokeObjectURL(track.url)
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const deckClass = [
    'deck',
    view === 'settings' ? 'is-settings' : '',
    view === 'help' ? 'is-help' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={`stage${calageMode ? ' is-advanced' : ''}`}>
      <Brand />

      <section className={deckClass} aria-label="Enregistreur" data-deck>
        {view === 'main' ? <DeckMain /> : null}
        {view === 'settings' ? <SettingsPanel /> : null}
        {view === 'help' ? <HelpPanel /> : null}
      </section>

      <MarkingHelp />
      <ModeRow />
      <p className="hint" data-hint>
        {hint}
      </p>
    </main>
  )
}
