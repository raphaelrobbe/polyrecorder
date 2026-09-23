import { useEffect } from 'react'
import { AppShell } from './AppShell'
import { DeckMain } from './DeckMain'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.client'
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
 * Client-only recorder shell: AppShell + audio bootstrap / shortcuts.
 */
export function RecorderApp({
  children,
  showMarkingHelp = false,
}: RecorderAppProps) {
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
    <AppShell showMarkingHelp={showMarkingHelp}>
      {children ?? <DeckMain />}
    </AppShell>
  )
}
