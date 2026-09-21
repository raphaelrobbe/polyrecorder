import {
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'
import { CheckFace } from '../CheckFace'

type DataAttrs = {
  [key: `data-${string}`]: string | number | boolean | undefined
}

export type TrackAlignCheckProps = {
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  hidden?: boolean
  title?: string
  ariaLabel: string
  onCheckedChange: (checked: boolean) => void
  className?: string
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'checked' | 'onChange' | 'disabled' | 'aria-label' | 'className'
  > &
    DataAttrs
  labelProps?: Omit<
    LabelHTMLAttributes<HTMLLabelElement>,
    'className' | 'title' | 'hidden' | 'children'
  > &
    DataAttrs
}

/** Custom square checkbox for per-track / master auto-align. */
export function TrackAlignCheck({
  checked,
  indeterminate = false,
  disabled,
  hidden,
  title,
  ariaLabel,
  onCheckedChange,
  className,
  inputProps,
  labelProps,
}: TrackAlignCheckProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <label
      className={cn(
        'relative h-[1.35rem] w-[1.35rem] shrink-0 cursor-pointer',
        className,
      )}
      title={title}
      hidden={hidden}
      data-track-align
      {...labelProps}
    >
      <input
        ref={inputRef}
        type="checkbox"
        className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onCheckedChange(event.target.checked)}
        {...inputProps}
      />
      <CheckFace checked={checked} indeterminate={indeterminate} />
    </label>
  )
}
