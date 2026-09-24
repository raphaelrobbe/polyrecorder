import type { ReactNode } from 'react'
import { AuthBar } from './AuthBar'
import { Brand } from './Brand'
import { Deck } from './Deck'
import { Hint } from './StatusMessage'
import { LegalFooter } from './LegalFooter'
import { MarkingHelp } from './MarkingHelp'
import { ModeRow } from './ModeRow'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'

type AppShellProps = {
  children: ReactNode
  showMarkingHelp?: boolean
  /** Wider column (e.g. library tree). */
  wide?: boolean
  /** Allow dropping audio files onto the recorder deck. */
  enableAudioDrop?: boolean
  className?: string
}

/**
 * SSR-safe chrome: auth stuck top-left, brand/deck centered, legal footer at bottom.
 * Audio bootstrap stays in RecorderApp (client-only home).
 */
export function AppShell({
  children,
  showMarkingHelp = false,
  wide = false,
  enableAudioDrop = false,
  className,
}: AppShellProps) {
  const hint = useSessionStore((s) => s.hint)

  return (
    <div
      className={cn(
        'flex min-h-[calc(100dvh-5rem)] w-[min(440px,100%)] flex-col max-sm:min-h-[calc(100dvh-2.5rem)]',
        wide && 'w-[min(560px,100%)]',
        className,
      )}
    >
      <AuthBar className="mb-3 shrink-0" />
      <main className="flex flex-1 flex-col justify-center gap-7 animate-rise">
        <Brand />
        <Deck enableAudioDrop={enableAudioDrop}>{children}</Deck>
        {showMarkingHelp ? <MarkingHelp /> : null}
        <ModeRow />
        <Hint>{hint}</Hint>
      </main>
      <LegalFooter />
    </div>
  )
}
