import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { playPianoNote } from '../lib/audio/piano.client'
import {
  pianoKeyLabel,
  pianoKeys,
  type PianoKey,
} from '../lib/audio/piano'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { useSessionStore } from '../store/sessionStore'

const KEYS = pianoKeys()
const WHITE_KEYS = KEYS.filter((key) => !key.isBlack)
const BLACK_KEYS = KEYS.filter((key) => key.isBlack)

/** Index of the white key this black key sits between (left white). */
function blackLeftWhiteIndex(midi: number): number {
  const whiteBelow = WHITE_KEYS.findIndex((key) => key.midi > midi) - 1
  return Math.max(0, whiteBelow)
}

type PianoKeyboardProps = {
  className?: string
}

export function PianoKeyboard({ className }: PianoKeyboardProps) {
  useLocale()
  const masterVolume = useSessionStore((s) => s.masterVolume)
  const [activeMidis, setActiveMidis] = useState<ReadonlySet<number>>(
    () => new Set(),
  )
  const activePointers = useRef(new Map<number, number>())

  const strike = useCallback(
    (midi: number) => {
      void playPianoNote(midi, masterVolume)
    },
    [masterVolume],
  )

  const onPointerDown = (key: PianoKey, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointers.current.set(event.pointerId, key.midi)
    setActiveMidis(new Set(activePointers.current.values()))
    strike(key.midi)
  }

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    activePointers.current.delete(event.pointerId)
    setActiveMidis(new Set(activePointers.current.values()))
  }

  const whiteCount = WHITE_KEYS.length

  return (
    <div
      className={cn(
        'w-full select-none touch-none',
        className,
      )}
      role="group"
      aria-label={t('piano.keyboardAria')}
    >
      <div className="relative flex h-[7.2rem] w-full max-sm:h-[5.6rem]">
        {WHITE_KEYS.map((key, index) => {
          const pressed = activeMidis.has(key.midi)
          const isFirst = index === 0
          const isLast = index === WHITE_KEYS.length - 1
          return (
            <button
              key={key.midi}
              type="button"
              data-midi={key.midi}
              aria-label={t('piano.keyAria', { note: pianoKeyLabel(key) })}
              className={cn(
                'relative z-0 m-0 h-full min-w-0 flex-1 cursor-pointer appearance-none border-0',
                'rounded-b-[8px] border-r border-ink/12 bg-surface',
                'shadow-[inset_0_-2px_0_color-mix(in_srgb,var(--ink)_8%,transparent)]',
                isFirst && 'rounded-tl-[8px]',
                isLast && 'rounded-tr-[8px] border-r-0',
                'transition-[background,transform] duration-75',
                'focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-[-2px]',
                pressed
                  ? 'bg-ink/10 translate-y-px'
                  : 'hover:bg-ink/[0.04] active:bg-ink/10',
              )}
              onPointerDown={(event) => onPointerDown(key, event)}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          )
        })}

        {BLACK_KEYS.map((key) => {
          const leftIdx = blackLeftWhiteIndex(key.midi)
          // Center the black key on the boundary between white keys.
          const leftPct = ((leftIdx + 1) / whiteCount) * 100
          const widthPct = (0.62 / whiteCount) * 100
          const pressed = activeMidis.has(key.midi)
          return (
            <button
              key={key.midi}
              type="button"
              data-midi={key.midi}
              aria-label={t('piano.keyAria', { note: pianoKeyLabel(key) })}
              style={{
                left: `calc(${leftPct}% - ${widthPct / 2}%)`,
                width: `${widthPct}%`,
              }}
              className={cn(
                'absolute top-0 z-10 m-0 h-[58%] cursor-pointer appearance-none border-0 p-0',
                'rounded-b-[6px] bg-ink text-on-ink',
                'shadow-[0_3px_8px_color-mix(in_srgb,var(--ink)_35%,transparent)]',
                'transition-[background,transform] duration-75',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent/50 focus-visible:outline-offset-1',
                pressed
                  ? 'bg-ink/80 translate-y-px'
                  : 'hover:bg-ink/90 active:bg-ink/80',
              )}
              onPointerDown={(event) => onPointerDown(key, event)}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          )
        })}
      </div>
    </div>
  )
}
