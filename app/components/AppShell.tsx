import type { ReactNode } from 'react'
import { Brand } from './Brand'
import { Deck } from './Deck'
import { MarkingHelp } from './MarkingHelp'
import { ModeRow } from './ModeRow'
import { Hint } from './StatusMessage'
import { useSessionStore } from '../store/sessionStore'

type AppShellProps = {
  children: ReactNode
  showMarkingHelp?: boolean
}

/**
 * SSR-safe chrome: brand, deck slot, footer utilities, hints.
 * Audio bootstrap stays in RecorderApp (client-only home).
 */
export function AppShell({ children, showMarkingHelp = false }: AppShellProps) {
  const hint = useSessionStore((s) => s.hint)

  return (
    <main className="flex w-[min(440px,100%)] flex-col gap-7 animate-rise">
      <Brand />
      <Deck>{children}</Deck>
      {showMarkingHelp ? <MarkingHelp /> : null}
      <ModeRow />
      <Hint>{hint}</Hint>
    </main>
  )
}
