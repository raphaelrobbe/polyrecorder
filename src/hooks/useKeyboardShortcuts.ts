import { useEffect } from 'react'
import {
  discard,
  downloadSelectedMix,
  nextTrack,
  startSession,
  stopSession,
  toggleMixPlayPause,
} from '../lib/sessionActions'
import { isDefaultSessionTitle } from '../lib/format'
import { useDeckStore } from '../store/deckStore'
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

/** Port of main.ts keyboard shortcuts (~3651+). */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return

      const {
        keyboardHintsEnabled,
        setKeyboardHintsEnabled,
        state,
        tracks,
      } = useSessionStore.getState()
      const { view, leaveDeckOverlay } = useDeckStore.getState()

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

      if (view !== 'main') {
        if (event.key === 'Escape') {
          event.preventDefault()
          leaveDeckOverlay()
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
  }, [])
}

/** Append shortcut hint to a title when keyboard hints are enabled. */
export function withShortcut(
  label: string,
  shortcut: string,
  enabled: boolean,
): string {
  return enabled ? `${label} (${shortcut})` : label
}
