import type { ReactNode } from 'react'
import { Brand } from './Brand'
import { Deck } from './Deck'
import { MarkingHelp } from './MarkingHelp'
import { ModeRow } from './ModeRow'
import { Hint } from './StatusMessage'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'

type AppShellProps = {
  children: ReactNode
  showMarkingHelp?: boolean
  /** Wider column (e.g. library tree). */
  wide?: boolean
  className?: string
}

/**
 * SSR-safe chrome: brand, deck slot, footer utilities, hints.
 * Audio bootstrap stays in RecorderApp (client-only home).
 */
export function AppShell({
  children,
  showMarkingHelp = false,
  wide = false,
  className,
}: AppShellProps) {
  const hint = useSessionStore((s) => s.hint)

  return (
    <main
      className={cn(
        'flex flex-col gap-7 animate-rise',
        wide ? 'w-[min(560px,100%)]' : 'w-[min(440px,100%)]',
        className,
      )}
    >
      <Brand />
      <Deck>{children}</Deck>
      {showMarkingHelp ? <MarkingHelp /> : null}
      <ModeRow />
      <Hint>{hint}</Hint>
    </main>
  )
}
