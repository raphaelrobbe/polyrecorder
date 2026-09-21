import { create } from 'zustand'
import {
  isDeckView,
  type DeckHistoryState,
  type DeckView,
} from '../types'

function deckViewUrl(view: DeckView): string {
  const path = `${location.pathname}${location.search}`
  return view === 'main' ? path : `${path}#${view}`
}

function deckViewFromUrl(): DeckView {
  const raw = location.hash.replace(/^#/, '')
  return isDeckView(raw) ? raw : 'main'
}

function deckViewFromState(state: unknown): DeckView | null {
  if (!state || typeof state !== 'object') return null
  const deck = (state as DeckHistoryState).polyrecorderDeck
  return isDeckView(deck) ? deck : null
}

type DeckStore = {
  view: DeckView
  /** Navigate to a deck view and push a browser history entry. */
  navigateDeckView: (view: DeckView) => void
  openDeckPanel: (view: 'settings' | 'help') => void
  /** Escape / close: return to main, adding a history entry. */
  leaveDeckOverlay: () => void
  /** Apply view from `popstate` history state (or fall back to the URL hash). */
  syncFromHistory: (state: unknown) => void
  /** Seed view from the URL hash and `replaceState` the initial entry. */
  initFromUrl: () => void
}

export const useDeckStore = create<DeckStore>((set, get) => ({
  view: 'main',

  navigateDeckView: (view) => {
    if (get().view === view) return
    set({ view })
    history.pushState(
      { polyrecorderDeck: view } satisfies DeckHistoryState,
      '',
      deckViewUrl(view),
    )
  },

  openDeckPanel: (view) => {
    get().navigateDeckView(view)
  },

  leaveDeckOverlay: () => {
    get().navigateDeckView('main')
  },

  syncFromHistory: (state) => {
    set({ view: deckViewFromState(state) ?? deckViewFromUrl() })
  },

  initFromUrl: () => {
    const initialDeck = deckViewFromUrl()
    set({ view: initialDeck })
    history.replaceState(
      { polyrecorderDeck: initialDeck } satisfies DeckHistoryState,
      '',
      deckViewUrl(initialDeck),
    )
  },
}))
