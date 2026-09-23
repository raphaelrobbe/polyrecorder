import { useEffect, useRef } from 'react'
import { useRouteLoaderData } from '@remix-run/react'
import { AppShell } from './AppShell'
import { DeckMain } from './DeckMain'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.client'
import {
  getMediaStream,
  releaseMic,
  stopMeterNodes,
} from '../lib/audio/runtime.client'
import { readActiveSongId, readAutoCloudSave } from '../lib/cloudPrefs'
import {
  initLatencyProbe,
  hydrateActiveSongIfNeeded,
  refreshDeviceSnapshot,
  resetDeckOnSignOut,
  stopPlayback,
  syncLatencyDisplay,
} from '../lib/sessionActions.client'
import type { loader as rootLoader } from '../root'
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
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const wasSignedIn = useRef(Boolean(user))

  useEffect(() => {
    useSessionStore.getState().patch({
      autoCloudSave: readAutoCloudSave(),
      activeSongId: readActiveSongId(),
    })
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

  useEffect(() => {
    if (wasSignedIn.current && !user) {
      resetDeckOnSignOut()
    }
    wasSignedIn.current = Boolean(user)
    if (user) void hydrateActiveSongIfNeeded()
  }, [user])

  return (
    <AppShell showMarkingHelp={showMarkingHelp}>
      {children ?? <DeckMain />}
    </AppShell>
  )
}
