import type { ReactNode } from 'react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
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
  useLocale()
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-line px-6 pb-6 pt-7',
        'max-sm:rounded-[22px] max-sm:px-3.5 max-sm:pb-4 max-sm:pt-5',
        'bg-[var(--deck-fill)] shadow-deck backdrop-blur-[10px]',
        "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
        'before:bg-[var(--deck-sheen)]',
        className,
      )}
      aria-label={t('deck.ariaLabel')}
    >
      {children}
    </section>
  )
}
