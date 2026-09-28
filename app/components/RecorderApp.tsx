import { useEffect, useRef } from 'react'
import { useNavigate, useRouteLoaderData } from '@remix-run/react'
import { AppShell } from './AppShell'
import { DeckMain } from './DeckMain'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.client'
import {
  getMediaStream,
  releaseMic,
  stopMeterNodes,
} from '../lib/audio/runtime.client'
import { readActiveSongPartId, readAutoCloudSave } from '../lib/cloudPrefs'
import { readAlignPrefs } from '../lib/alignPrefs'
import { librarySessionPath } from '../lib/libraryPaths'
import {
  initLatencyProbe,
  hydrateActiveSongIfNeeded,
  refreshDeviceSnapshot,
  resetDeckOnSignOut,
  stopPlayback,
  syncLatencyDisplay,
} from '../lib/sessionActions.client'
import { setCloudSignedIn } from '../lib/cloudUpload.client'
import { hydrateFileSystemMemory } from '../lib/fileSystemMemory.client'
import type { loader as rootLoader } from '../root'
import { useSessionStore } from '../store/sessionStore'

type RecorderAppProps = {
  /** Main deck content (recorder, settings, or help). */
  children?: React.ReactNode
}

/**
 * Client-only recorder shell: AppShell + audio bootstrap / shortcuts.
 */
export function RecorderApp({ children }: RecorderAppProps) {
  useKeyboardShortcuts()
  const navigate = useNavigate()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const wasSignedIn = useRef(Boolean(user))
  const deckSongPartId = useSessionStore((s) => s.deckSongPartId)
  setCloudSignedIn(Boolean(user), user?.pseudo)

  useEffect(() => {
    const defaults = readAlignPrefs()
    useSessionStore.getState().patch({
      autoCloudSave: readAutoCloudSave(),
      autoAlignEnabled: defaults.autoAlignEnabled,
      showCalageWarnings: defaults.showCalageWarnings,
      skipCountInPlayback: defaults.skipCountInPlayback,
      skipCountInDownload: defaults.skipCountInDownload,
      activeSongPartId: readActiveSongPartId(),
    })
    void hydrateFileSystemMemory()
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
    if (!user) return
    if (
      typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/song/') ||
        window.location.pathname.startsWith('/session/'))
    ) {
      return
    }
    void hydrateActiveSongIfNeeded().then(() => {
      const id = useSessionStore.getState().deckSongPartId
      if (id && window.location.pathname === '/') {
        navigate(librarySessionPath(id), { replace: true })
      }
    })
  }, [user, navigate])

  /** Keep `/` in sync when a cloud session becomes the deck contents (e.g. first save). */
  useEffect(() => {
    if (!deckSongPartId) return
    if (typeof window === 'undefined') return
    if (window.location.pathname !== '/') return
    navigate(librarySessionPath(deckSongPartId), { replace: true })
  }, [deckSongPartId, navigate])

  return (
    <AppShell enableAudioDrop>{children ?? <DeckMain />}</AppShell>
  )
}
