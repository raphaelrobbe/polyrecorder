import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { parsePercentInput } from '../lib/format'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { NudgeValueField } from './NudgeValueField'

type VolumeRibbonProps = {
  value: number
  max: number
  onChange: (value: number) => void
  /** Fired after drag ends, keyboard adjust, or percent commit (for cloud persist). */
  onChangeEnd?: () => void
  onReset?: () => void
  label: string
  className?: string
  /** Slightly taller / stronger for the master bus. */
  emphasis?: boolean
}

/**
 * Horizontal volume ribbon: drag to set level, double-click / double-tap resets to 100%.
 * The percent label is click-to-edit (no ± buttons).
 */
export function VolumeRibbon({
  value,
  max,
  onChange,
  onChangeEnd,
  onReset,
  label,
  className,
  emphasis = false,
}: VolumeRibbonProps) {
  useLocale()
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const unityRatio = max > 0 ? Math.min(1, 1 / max) : 0
  const boosted = value > 1.001
  const percent = Math.round(value * 100)
  const maxPercent = Math.round(max * 100)
  const [draft, setDraft] = useState(String(percent))

  useEffect(() => {
    setDraft(String(percent))
  }, [percent])

  const commitDraft = () => {
    const parsed = parsePercentInput(draft)
    const nextPercent =
      parsed == null
        ? percent
        : Math.min(maxPercent, Math.max(0, parsed))
    setDraft(String(nextPercent))
    if (nextPercent !== percent) {
      onChange(nextPercent / 100)
      onChangeEnd?.()
    }
  }

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current
      if (!el) return value
      const rect = el.getBoundingClientRect()
      if (rect.width <= 0) return value
      const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      return frac * max
    },
    [max, value],
  )

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    onChange(valueFromClientX(event.clientX))
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    onChange(valueFromClientX(event.clientX))
  }

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    onChangeEnd?.()
  }

  const changeAndEnd = (next: number) => {
    onChange(next)
    onChangeEnd?.()
  }

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-[0.45rem] max-sm:gap-[0.3rem]',
        className,
      )}
    >
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={maxPercent}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        className={cn(
          'relative min-w-0 flex-auto cursor-pointer touch-none rounded-full bg-ink/10',
          emphasis ? 'h-[0.7rem]' : 'h-[0.55rem]',
          'outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ink)_15%,transparent)]',
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => {
          onReset?.()
          onChangeEnd?.()
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 0.1 : 0.05
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            event.preventDefault()
            changeAndEnd(Math.min(max, value + step))
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            event.preventDefault()
            changeAndEnd(Math.max(0, value - step))
          } else if (event.key === 'Home') {
            event.preventDefault()
            changeAndEnd(0)
          } else if (event.key === 'End') {
            event.preventDefault()
            changeAndEnd(max)
          } else if (event.key === '0' || event.key === 'Delete') {
            event.preventDefault()
            onReset?.()
            onChangeEnd?.()
          }
        }}
      >
        {max > 1 ? (
          <span
            className="pointer-events-none absolute inset-y-[0.08rem] w-px bg-ink/25"
            style={{ left: `${unityRatio * 100}%` }}
            aria-hidden="true"
          />
        ) : null}
        <span
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 rounded-full',
            boosted
              ? 'bg-gradient-to-r from-volume to-record/80'
              : 'bg-volume',
          )}
          style={{ width: `${ratio * 100}%` }}
        />
        <span
          className={cn(
            'pointer-events-none absolute top-1/2 size-[0.85rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-ink shadow-[0_1px_3px_color-mix(in_srgb,var(--ink)_25%,transparent)]',
            emphasis && 'size-[0.95rem]',
          )}
          style={{ left: `${ratio * 100}%` }}
          aria-hidden="true"
        />
      </div>
      <NudgeValueField
        unit="%"
        data-volume-percent
        value={draft}
        inputMode="numeric"
        aria-label={t('volume.percentAria', { label })}
        spellCheck={false}
        labelClassName="min-w-0 max-sm:min-w-0"
        className={cn(
          'w-[2.1rem] text-right max-sm:w-[1.9rem]',
          boosted && 'text-record',
          emphasis && 'text-[0.78rem] text-ink max-sm:text-[0.72rem]',
        )}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
        onFocus={(event) => {
          event.currentTarget.select()
          event.currentTarget.addEventListener(
            'mouseup',
            (mouseupEvent) => {
              mouseupEvent.preventDefault()
              event.currentTarget.select()
            },
            { once: true },
          )
        }}
        onBlur={commitDraft}
      />
    </div>
  )
}
