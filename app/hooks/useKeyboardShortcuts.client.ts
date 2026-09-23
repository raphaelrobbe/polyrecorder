import { useLocation, useNavigate } from '@remix-run/react'
import { useEffect } from 'react'
import {
  discard,
  downloadSelectedMix,
  nextTrack,
  startSession,
  stopSession,
  toggleMixPlayPause,
} from '../lib/sessionActions.client'
import { isDefaultSessionTitle } from '../lib/format'
import { useSessionStore } from '../store/sessionStore'

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target instanceof HTMLElement && target.isContentEditable) return true
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  )
}

function focusSessionTitle() {
  const input = document.querySelector<HTMLTextAreaElement | HTMLInputElement>(
    '[data-session-title]',
  )
  if (!input) return
  input.focus()
  if (isDefaultSessionTitle(input.value)) input.select()
}

function isOverlayPath(pathname: string): boolean {
  return (
    pathname === '/aide' ||
    pathname === '/parametres' ||
    pathname.endsWith('/aide') ||
    pathname.endsWith('/parametres')
  )
}

/** Global transport / recording shortcuts (client-only). */
export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const {
        keyboardHintsEnabled,
        setKeyboardHintsEnabled,
        state,
        tracks,
      } = useSessionStore.getState()

      if (
        !keyboardHintsEnabled &&
        (event.key.length === 1 ||
          event.key === 'Escape' ||
          event.key === 'Enter' ||
          event.key === ' ' ||
          event.key === 'F2' ||
          event.key === 'Delete' ||
          event.key === 'Backspace')
      ) {
        setKeyboardHintsEnabled(true)
      }

      if (isOverlayPath(location.pathname)) {
        if (event.key === 'Escape') {
          event.preventDefault()
          navigate('/')
        }
        return
      }

      if (event.key === 'F2') {
        event.preventDefault()
        focusSessionTitle()
        return
      }

      if (event.key === 'Escape') return

      if (isEditableKeyboardTarget(event.target)) return

      if (event.key === ' ' || event.code === 'Space') {
        if (tracks.length > 0 && state !== 'recording') {
          event.preventDefault()
          void toggleMixPlayPause()
        }
        return
      }

      if (state === 'recording') {
        if (event.key === 'Enter') {
          event.preventDefault()
          void stopSession()
          return
        }
        if (event.key === 'Delete' || event.key === 'Backspace') {
          event.preventDefault()
          void discard()
          return
        }
        const key = event.key.toLowerCase()
        if (key === 's' || key === 'n') {
          event.preventDefault()
          void nextTrack()
        }
        return
      }

      const key = event.key.toLowerCase()
      if (key === 'e' || key === 'r') {
        if (state === 'idle') {
          event.preventDefault()
          void startSession()
        }
        return
      }
      if (key === 'd' || key === 't') {
        if (state === 'idle' && tracks.length > 0) {
          event.preventDefault()
          void downloadSelectedMix()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [location.pathname, navigate])
}
