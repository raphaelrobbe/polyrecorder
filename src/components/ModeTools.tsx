import { setCalageMode, setMixMode } from '../lib/sessionActions'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'
import { IconFaders } from './icons'

type ModeToolsProps = {
  className?: string
}

/**
 * In-deck mode toggles (active / inactive buttons, no checkboxes).
 * Mixage is the prominent control; calage is secondary.
 * Sits at the bottom of the deck, left-aligned: « Mode » + buttons.
 */
export function ModeTools({ className }: ModeToolsProps) {
  const tracks = useSessionStore((s) => s.tracks)
  const calageMode = useSessionStore((s) => s.calageMode)
  const mixMode = useSessionStore((s) => s.mixMode)

  if (tracks.length === 0) return null

  return (
    <div
      className={cn(
        'mt-4 flex flex-wrap items-center justify-start gap-[0.45rem] max-sm:mt-3 max-sm:gap-[0.35rem]',
        className,
      )}
      role="group"
      aria-label="Modes de travail"
    >
      <span className="shrink-0 text-[0.82rem] font-semibold tracking-[0.02em] text-ink-soft">
        Mode
      </span>
      <button
        type="button"
        aria-pressed={mixMode}
        title="Mode mixage : volumes par piste et maître"
        onClick={() => setMixMode(!mixMode)}
        style={
          {
            ['--fader-knob-fill' as string]: mixMode
              ? 'var(--control)'
              : 'var(--surface)',
          }
        }
        className={cn(
          'inline-flex items-center gap-[0.35rem] rounded-full border-[1.5px] px-[0.75rem] py-[0.4rem]',
          'font-[inherit] text-[0.84rem] font-bold tracking-[0.01em] transition-[background,color,border-color,box-shadow,transform] duration-160',
          'cursor-pointer active:scale-[0.98]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          mixMode
            ? 'border-control bg-control text-on-control shadow-[0_6px_18px_color-mix(in_srgb,var(--control)_35%,transparent)]'
            : 'border-line bg-surface text-ink hover:border-control/45 hover:bg-control/10',
        )}
      >
        <IconFaders className="size-[1rem]" />
        Mixage
      </button>
      <button
        type="button"
        aria-pressed={calageMode}
        title="Mode calage : synchronisation des pistes"
        onClick={() => setCalageMode(!calageMode)}
        className={cn(
          'inline-flex items-center rounded-full border px-[0.62rem] py-[0.34rem]',
          'font-[inherit] text-[0.78rem] font-semibold tracking-[0.01em] transition-[background,color,border-color,transform] duration-160',
          'cursor-pointer active:scale-[0.98]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          calageMode
            ? 'border-ink/35 bg-ink text-on-ink'
            : 'border-transparent bg-transparent text-ink-soft hover:bg-ink/6 hover:text-ink',
        )}
      >
        Calage
      </button>
    </div>
  )
}
