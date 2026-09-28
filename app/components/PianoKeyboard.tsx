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
        'mt-[1rem] mb-[0.55rem] w-full select-none touch-none',
        'rounded-t-[8px] border-t border-black/[0.14]',
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
                'rounded-b-[8px] border-r border-black/[0.14] bg-white',
                'shadow-[inset_0_-2px_0_rgb(0_0_0_/0.08)]',
                isFirst && 'rounded-tl-[8px] border-l border-black/[0.14]',
                isLast && 'rounded-tr-[8px]',
                'transition-[background,transform] duration-75',
                'focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black/35 focus-visible:outline-offset-[-2px]',
                pressed
                  ? 'bg-neutral-200 translate-y-px'
                  : 'hover:bg-neutral-100 active:bg-neutral-200',
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
                'rounded-b-[6px] bg-neutral-950 text-white',
                'shadow-[0_3px_8px_rgb(0_0_0_/0.35)]',
                'transition-[background,transform] duration-75',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-1',
                pressed
                  ? 'bg-neutral-800 translate-y-px'
                  : 'hover:bg-neutral-900 active:bg-neutral-800',
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
