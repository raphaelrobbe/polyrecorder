import { useEffect } from 'react'
import { Brand } from './Brand'
import { Deck } from './Deck'
import { DeckMain } from './DeckMain'
import { MarkingHelp } from './MarkingHelp'
import { ModeRow } from './ModeRow'
import { Hint } from './StatusMessage'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import {
  getMediaStream,
  releaseMic,
  stopMeterNodes,
} from '../lib/audio/runtime.client'
import {
  initLatencyProbe,
  refreshDeviceSnapshot,
  stopPlayback,
  syncLatencyDisplay,
} from '../lib/sessionActions.client'
import { useSessionStore } from '../store/sessionStore'

type RecorderAppProps = {
  /** Main deck content (recorder, settings, or help). */
  children?: React.ReactNode
  /** Show marking help accordion under the deck. */
  showMarkingHelp?: boolean
}

/**
 * Client-only recorder shell: brand, deck slot, footer utilities, hints.
 * Audio bootstrap lives here so SSR never touches Web Audio APIs.
 */
export function RecorderApp({
  children,
  showMarkingHelp = false,
}: RecorderAppProps) {
  const hint = useSessionStore((s) => s.hint)

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

  return (
    <main className="flex w-[min(440px,100%)] flex-col gap-7 animate-rise">
      <Brand />

      <Deck>{children ?? <DeckMain />}</Deck>

      {showMarkingHelp ? <MarkingHelp /> : null}
      <ModeRow />
      <Hint>{hint}</Hint>
    </main>
  )
}
