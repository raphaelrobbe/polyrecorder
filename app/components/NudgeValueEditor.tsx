import {
  useEffect,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react'
import { NudgeControls } from './NudgeControls'
import { NudgeValueField } from './NudgeValueField'

type NudgeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'onChange' | 'onBlur' | 'onFocus' | 'onKeyDown' | 'aria-label'
> &
  Record<`data-${string}`, string | number | boolean | undefined>

export type NudgeValueEditorProps = {
  value: number
  onChange: (next: number) => void
  step?: number
  min?: number
  max?: number
  unit?: ReactNode
  parseInput: (raw: string) => number | null
  title?: string
  className?: string
  fieldClassName?: string
  minusAriaLabel: string
  plusAriaLabel: string
  inputAriaLabel: string
  inputProps?: NudgeInputProps
}

/**
 * Shared − / editable value / + control (ms offsets, volume %, …).
 */
export function NudgeValueEditor({
  value,
  onChange,
  step = 5,
  min,
  max,
  unit,
  parseInput,
  title,
  className,
  fieldClassName,
  minusAriaLabel,
  plusAriaLabel,
  inputAriaLabel,
  inputProps,
}: NudgeValueEditorProps) {
  const rounded = Math.round(value)
  const [draft, setDraft] = useState(String(rounded))

  useEffect(() => {
    setDraft(String(rounded))
  }, [rounded])

  const clamp = (n: number) => {
    let next = Math.round(n)
    if (min != null) next = Math.max(min, next)
    if (max != null) next = Math.min(max, next)
    return next
  }

  const commit = (next: number) => {
    const clamped = clamp(next)
    setDraft(String(clamped))
    if (clamped !== rounded) onChange(clamped)
  }

  const commitDraft = () => {
    const parsed = parseInput(draft)
    commit(parsed ?? rounded)
  }

  return (
    <NudgeControls
      className={className}
      title={title}
      minusAriaLabel={minusAriaLabel}
      plusAriaLabel={plusAriaLabel}
      onMinus={() => commit(rounded - step)}
      onPlus={() => commit(rounded + step)}
      valueSlot={
        <NudgeValueField
          {...inputProps}
          unit={unit}
          className={fieldClassName}
          value={draft}
          inputMode="numeric"
          aria-label={inputAriaLabel}
          spellCheck={false}
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
      }
    />
  )
}
