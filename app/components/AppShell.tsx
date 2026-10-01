import type { ReactNode } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { AuthBar } from './AuthBar'
import { Brand } from './Brand'
import { Deck } from './Deck'
import { Hint } from './StatusMessage'
import { LegalFooter } from './LegalFooter'
import { ModeRow } from './ModeRow'
import { PwaInstallBanner } from './PwaInstallBanner'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'

type AppShellProps = {
  children: ReactNode
  /** Wider column (e.g. library tree). */
  wide?: boolean
  /** Allow dropping audio files onto the recorder deck. */
  enableAudioDrop?: boolean
  className?: string
}

/**
 * SSR-safe chrome: auth top-right, brand/deck centered, legal footer at bottom.
 * Audio bootstrap stays in RecorderApp (client-only home).
 */
export function AppShell({
  children,
  wide = false,
  enableAudioDrop = false,
  className,
}: AppShellProps) {
  const hint = useSessionStore((s) => s.hint)
  const trackCount = useSessionStore((s) => s.tracks.length)
  const recording = useSessionStore((s) => s.state === 'recording')
  const brandVariant = enableAudioDrop
    ? trackCount > 0
      ? 'compact'
      : 'hero'
    : 'default'
  const compact = brandVariant === 'compact'

  return (
    <div
      className={cn(
        'flex min-h-0 w-full flex-1 flex-col',
        wide ? 'max-w-[560px]' : 'max-w-[440px]',
        className,
      )}
    >
      <div
        className={cn(
          'mb-3 flex w-full min-w-0 shrink-0 items-center gap-3',
          compact ? 'justify-between' : 'justify-end',
          // More air between compact brand and mode pills / deck.
          compact && enableAudioDrop && 'mb-5',
        )}
      >
        {compact ? (
          <Brand
            variant="compact"
            className="mb-0 min-w-0 flex-1 overflow-hidden"
          />
        ) : null}
        <AuthBar className="mb-0" />
      </div>
      <main
        className={cn(
          'flex w-full min-h-0 flex-1 flex-col gap-7 animate-rise',
          compact ? 'justify-start gap-5' : 'justify-center',
          brandVariant === 'hero' && 'gap-8',
        )}
      >
        {!compact ? <Brand variant={brandVariant} /> : null}
        {enableAudioDrop ? (
          children
        ) : (
          <Deck>{children}</Deck>
        )}
        <ModeRow />
        <Hint>{hint}</Hint>
        <ClientOnly fallback={null}>
          {() => <PwaInstallBanner hidden={recording} />}
        </ClientOnly>
      </main>
      <LegalFooter className="mt-auto shrink-0 pt-5 max-sm:pt-3" />
    </div>
  )
}
