import { useEffect, useRef, type ReactNode } from 'react'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { cn } from '../lib/utils'
import { useDeckStore } from '../store/deckStore'
import { useSessionStore } from '../store/sessionStore'

type DeckOverlayPanelProps = {
  title: string
  closeAriaLabel: string
  className?: string
  bodyClassName?: string
  children: ReactNode
}

/** Shared shell for Paramètres / Aide (close button, title, body). */
export function DeckOverlayPanel({
  title,
  closeAriaLabel,
  className,
  bodyClassName,
  children,
}: DeckOverlayPanelProps) {
  const leaveDeckOverlay = useDeckStore((s) => s.leaveDeckOverlay)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div
      className={cn(
        'relative min-h-[11rem] px-1 pb-2 pt-[0.35rem]',
        className,
      )}
    >
      <button
        ref={closeRef}
        type="button"
        className="absolute top-[0.35rem] right-[0.35rem] z-[2] grid h-[2.9rem] w-[2.9rem] place-items-center rounded-[14px] border-0 bg-transparent p-0 text-[2.15rem] font-normal leading-none text-ink-soft cursor-pointer transition-[background,color] duration-[160ms] ease-in-out hover:bg-[rgba(15,61,62,0.08)] hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(15,61,62,0.35)] focus-visible:outline-offset-2"
        aria-label={closeAriaLabel}
        title={withShortcut('Fermer', 'Échap', keyboardHintsEnabled)}
        data-title-base="Fermer"
        onClick={() => leaveDeckOverlay()}
      >
        ×
      </button>
      <h2 className="font-display mr-[2.8rem] mb-[1.15rem] mt-0 text-[1.45rem] font-bold tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <div className={cn(bodyClassName)}>{children}</div>
    </div>
  )
}
