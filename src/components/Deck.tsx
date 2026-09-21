import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

type DeckProps = {
  children: ReactNode
  className?: string
}

/**
 * Recorder card shell (border, glass, highlight).
 * View content is passed as children (main / settings / help).
 */
export function Deck({ children, className }: DeckProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-line px-6 pb-6 pt-7',
        'bg-[var(--deck-fill)] shadow-deck backdrop-blur-[10px]',
        "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
        'before:bg-[var(--deck-sheen)]',
        className,
      )}
      aria-label="Enregistreur"
    >
      {children}
    </section>
  )
}
