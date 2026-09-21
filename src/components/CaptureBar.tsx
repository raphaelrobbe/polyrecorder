import {
  discard,
  nextTrack,
  startSession,
  stopSession,
} from '../lib/sessionActions'
import { cn } from '../lib/utils'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import {
  IconDiscard,
  IconNext,
  IconRecord,
  IconStop,
} from './icons'
import { MixTransport } from './MixTransport'

type CaptureBarProps = {
  className?: string
}

export function CaptureBar({ className }: CaptureBarProps) {
  const state = useSessionStore((s) => s.state)
  const tracks = useSessionStore((s) => s.tracks)
  const meterLevel = useSessionStore((s) => s.meterLevel)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)

  const recording = state === 'recording'
  const recordOnly = !recording && tracks.length === 0

  return (
    <div
      className={cn(
        'relative my-[0.35rem] mb-2 grid min-h-[4.5rem] grid-cols-[1fr_auto_1fr] items-center gap-3',
        className,
      )}
    >
      <div
        className="relative col-[1/3] min-w-0 h-[0.7rem] overflow-hidden rounded-full bg-[rgba(15,61,62,0.1)]"
        hidden={!recording}
        aria-hidden={!recording}
      >
        <span
          className="block h-full w-0 rounded-[inherit] bg-gradient-to-r from-[#2f8f7b] to-record transition-[width] duration-[80ms] ease-linear"
          style={{
            width: `${Math.max(0, Math.min(100, meterLevel))}%`,
          }}
        />
      </div>
      <MixTransport />
      <div
        className={cn(
          'inline-flex shrink-0 items-center justify-end gap-[0.65rem]',
          recordOnly
            ? 'col-start-2 justify-self-center'
            : 'col-start-3 justify-self-end',
        )}
      >
        <Button
          variant="transport"
          className="h-[3.45rem] w-[3.45rem] border-[rgba(15,61,62,0.28)] bg-white text-ink hover:enabled:border-[rgba(15,61,62,0.45)] hover:enabled:bg-[rgba(15,61,62,0.06)] [&_svg]:size-[1.35rem] [&_svg]:translate-x-px"
          icon={<IconNext />}
          hidden={!recording}
          disabled={!recording}
          aria-label="Piste suivante"
          title={withShortcut(
            'Piste suivante : rejoue cette prise et enregistre la suivante en même temps.',
            'S / N',
            keyboardHintsEnabled,
          )}
          onClick={() => void nextTrack()}
        />
        <Button
          variant="transport"
          className="h-[2.75rem] w-[2.75rem] border-transparent bg-transparent text-ink-soft shadow-none hover:enabled:translate-y-0 hover:enabled:border-transparent hover:enabled:bg-[rgba(15,61,62,0.06)] hover:enabled:text-ink hover:enabled:shadow-none active:enabled:scale-[0.96] [&_svg]:size-[1.2rem]"
          icon={<IconDiscard />}
          hidden={!recording}
          disabled={!recording}
          aria-label="Annuler la prise et recommencer"
          title={withShortcut(
            'Annuler la prise et recommencer',
            'Suppr',
            keyboardHintsEnabled,
          )}
          onClick={() => void discard()}
        />
        <Button
          variant="transport"
          className="border-[rgba(226,61,61,0.55)] bg-white text-record shadow-[0_10px_28px_var(--record-glow),inset_0_1px_0_rgba(255,255,255,0.8)] hover:enabled:border-record hover:enabled:bg-[#fff5f5] hover:enabled:text-[#d32f2f] [&_svg]:size-[1.7rem]"
          icon={<IconRecord />}
          hidden={recording}
          disabled={recording}
          aria-label="Enregistrer"
          title={withShortcut('Enregistrer', 'E / R', keyboardHintsEnabled)}
          onClick={() => void startSession()}
        />
        <Button
          variant="transport"
          className={cn(
            '[&_svg]:size-[1.7rem]',
            recording
              ? 'animate-throb border-[rgba(226,61,61,0.55)] bg-white text-record hover:enabled:border-record hover:enabled:bg-[#fff5f5] hover:enabled:text-[#d32f2f]'
              : 'border-[rgba(15,61,62,0.35)] bg-white text-ink hover:enabled:border-[rgba(15,61,62,0.5)] hover:enabled:bg-[rgba(15,61,62,0.06)]',
          )}
          icon={<IconStop />}
          hidden={!recording}
          disabled={!recording}
          aria-label="Stop"
          title={withShortcut('Stop', 'Entrée', keyboardHintsEnabled)}
          onClick={() => void stopSession()}
        />
      </div>
    </div>
  )
}
