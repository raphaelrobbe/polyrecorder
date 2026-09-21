import { useEffect, useRef, type ReactNode } from 'react'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useDeckStore } from '../store/deckStore'
import { useSessionStore } from '../store/sessionStore'

type DeckOverlayPanelProps = {
  title: string
  /** Wrapper class: `deck-settings` or `deck-help`. */
  className: string
  /** Body wrapper class: `settings-options` or `help-sections`. */
  bodyClassName: string
  closeAriaLabel: string
  /** e.g. `data-deck-settings` / `data-deck-help` for parity with legacy selectors. */
  panelDataAttr: 'data-deck-settings' | 'data-deck-help'
  closeDataAttr: 'data-close-settings' | 'data-close-help'
  children: ReactNode
}

/** Shared shell for Paramètres / Aide (close button, title, scrollable body). */
export function DeckOverlayPanel({
  title,
  className,
  bodyClassName,
  closeAriaLabel,
  panelDataAttr,
  closeDataAttr,
  children,
}: DeckOverlayPanelProps) {
  const leaveDeckOverlay = useDeckStore((s) => s.leaveDeckOverlay)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className={className} {...{ [panelDataAttr]: true }}>
      <button
        ref={closeRef}
        type="button"
        className="btn-deck-icon btn-close-panel"
        {...{ [closeDataAttr]: true }}
        aria-label={closeAriaLabel}
        title={withShortcut('Fermer', 'Échap', keyboardHintsEnabled)}
        data-title-base="Fermer"
        onClick={() => leaveDeckOverlay()}
      >
        ×
      </button>
      <h2 className="settings-title">{title}</h2>
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
