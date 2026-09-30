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
import {
  readActiveSongPartId,
  readAutoCloudSave,
  writeActiveSongPartId,
} from '../lib/cloudPrefs'
import { readAlignPrefs } from '../lib/alignPrefs'
import { readAutoClipCorrect } from '../lib/mixClipPrefs'
import { librarySessionPath } from '../lib/libraryPaths'
import {
  claimGuestDraftAfterSignIn,
  flushGuestDraftSave,
  hydrateGuestDraftIfNeeded,
  initLatencyProbe,
  hydrateActiveSongIfNeeded,
  isGuestClaimInFlight,
  refreshDeviceSnapshot,
  resetDeckOnSignOut,
  stopPlayback,
  syncLatencyDisplay,
} from '../lib/sessionActions.client'
import { setCloudSignedIn, ensurePendingDeckLibraryPath } from '../lib/cloudUpload.client'
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
    // Guests must not keep a previous signed-in upload target in localStorage.
    if (!user) writeActiveSongPartId(null)
    useSessionStore.getState().patch({
      autoCloudSave: readAutoCloudSave(),
      autoAlignEnabled: defaults.autoAlignEnabled,
      showCalageWarnings: defaults.showCalageWarnings,
      skipCountInPlayback: defaults.skipCountInPlayback,
      skipCountInDownload: defaults.skipCountInDownload,
      autoClipCorrect: readAutoClipCorrect(),
      activeSongPartId: user ? readActiveSongPartId() : null,
    })
    void hydrateFileSystemMemory()
    void initLatencyProbe()
    void refreshDeviceSnapshot()
    syncLatencyDisplay()
    if (!user) {
      void hydrateGuestDraftIfNeeded()
    }

    const onBeforeUnload = () => {
      flushGuestDraftSave()
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

    useSessionStore.getState().patch({ guestSignInPrompt: false })

    let cancelled = false
    void (async () => {
      await claimGuestDraftAfterSignIn()
      if (cancelled) return

      if (
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/song/') ||
          window.location.pathname.startsWith('/session/'))
      ) {
        return
      }

      if (useSessionStore.getState().tracks.length === 0) {
        await hydrateActiveSongIfNeeded()
      }
      if (cancelled) return

      const id = useSessionStore.getState().deckSongPartId
      if (id && window.location.pathname === '/') {
        navigate(librarySessionPath(id), { replace: true })
      } else if (!id) {
        await ensurePendingDeckLibraryPath()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, navigate])

  /** Keep `/` in sync when a cloud session becomes the deck (e.g. first signed-in save).
   * Skip while guest-claim uploads run — navigating mid-batch remounts and would race. */
  useEffect(() => {
    if (!deckSongPartId) return
    if (typeof window === 'undefined') return
    if (window.location.pathname !== '/') return
    if (isGuestClaimInFlight()) return
    navigate(librarySessionPath(deckSongPartId), { replace: true })
  }, [deckSongPartId, navigate])

  return (
    <AppShell enableAudioDrop>{children ?? <DeckMain />}</AppShell>
  )
}
