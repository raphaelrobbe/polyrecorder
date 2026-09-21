import {
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
} from 'react'
import { cn } from '../../lib/utils'

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
      <span
        className={cn(
          'relative block size-full rounded border-2 border-[rgba(15,61,62,0.35)] bg-white shadow-[inset_0_1px_2px_rgba(15,61,62,0.06)] transition-[background,border-color,box-shadow] duration-140 ease-in-out',
          'peer-focus-visible:shadow-[0_0_0_3px_rgba(15,61,62,0.15)]',
          'peer-disabled:opacity-40',
          checked && !indeterminate && 'border-ink bg-ink',
          indeterminate && 'border-ink bg-[rgba(15,61,62,0.12)]',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'absolute top-[0.1rem] left-[0.32rem] h-[0.62rem] w-[0.32rem] rotate-45 border-solid border-transparent border-r-2 border-b-2 opacity-0 transition-opacity duration-140 ease-in-out',
            checked && !indeterminate && 'border-white opacity-100',
          )}
        />
        <span
          className={cn(
            'absolute top-[0.5rem] left-[0.25rem] h-0 w-[0.7rem] border-0 border-b-2 border-solid border-ink opacity-0 transition-opacity duration-140 ease-in-out',
            indeterminate && 'opacity-100',
          )}
        />
      </span>
    </label>
  )
}
