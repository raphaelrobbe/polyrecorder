import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.client'

/** Escape-to-close (and hint enable) for SSR overlay routes. */
export default function OverlayShortcuts() {
  useKeyboardShortcuts()
  return null
}
