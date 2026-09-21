import { useEffect } from 'react'
import { Brand } from './components/Brand'
import { Deck } from './components/Deck'
import { DeckMain } from './components/DeckMain'
import { HelpPanel } from './components/HelpPanel'
import { MarkingHelp } from './components/MarkingHelp'
import { ModeRow } from './components/ModeRow'
import { SettingsPanel } from './components/SettingsPanel'
import { Hint } from './components/StatusMessage'
import { useDeckHistory } from './hooks/useDeckHistory'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { releaseMic, stopMeterNodes, getMediaStream } from './lib/audio/runtime'
import {
  initLatencyProbe,
  refreshDeviceSnapshot,
  stopPlayback,
  syncLatencyDisplay,
} from './lib/sessionActions'
import { useDeckStore } from './store/deckStore'
import { useSessionStore } from './store/sessionStore'

export function App() {
  const view = useDeckStore((s) => s.view)
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

  const onMainView = view === 'main'

  return (
    <main className="flex w-[min(440px,100%)] flex-col gap-7 animate-rise">
      <Brand />

      <Deck>
        {onMainView ? <DeckMain /> : null}
        {view === 'settings' ? <SettingsPanel /> : null}
        {view === 'help' ? <HelpPanel /> : null}
      </Deck>

      {onMainView ? <MarkingHelp /> : null}
      <ModeRow />
      <Hint>{hint}</Hint>
    </main>
  )
}
