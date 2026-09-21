import { useEffect } from 'react'
import { useDeckStore } from '../store/deckStore'

/** Wire browser history + Escape to deck overlay navigation. */
export function useDeckHistory() {
  const initFromUrl = useDeckStore((s) => s.initFromUrl)
  const syncFromHistory = useDeckStore((s) => s.syncFromHistory)
  const leaveDeckOverlay = useDeckStore((s) => s.leaveDeckOverlay)
  const view = useDeckStore((s) => s.view)

  useEffect(() => {
    initFromUrl()

    const onPopState = (event: PopStateEvent) => {
      syncFromHistory(event.state)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [initFromUrl, syncFromHistory])

  useEffect(() => {
    if (view === 'main') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      event.preventDefault()
      leaveDeckOverlay()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [view, leaveDeckOverlay])
}
