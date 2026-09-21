import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type TrackOffsetFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  unit?: ReactNode
  labelClassName?: string
}

/** Millisecond offset input with optional unit label. */
export function TrackOffsetField({
  unit = 'ms',
  className,
  labelClassName,
  ...props
}: TrackOffsetFieldProps) {
  return (
    <label
      className={cn(
        'inline-flex min-w-[3.6rem] items-baseline justify-center gap-[0.12rem]',
        labelClassName,
      )}
    >
      <input
        type="text"
        className={cn(
          'm-0 w-[2.6rem] min-w-0 rounded-[5px] border-0 bg-transparent px-[0.1rem] py-[0.12rem] text-center text-[0.72rem] font-bold tabular-nums text-ink-soft',
          'hover:bg-[rgba(15,61,62,0.06)] hover:text-ink',
          'focus:bg-[rgba(15,61,62,0.06)] focus:text-ink focus:shadow-[inset_0_0_0_1px_rgba(15,61,62,0.18)] focus:outline-none',
          className,
        )}
        {...props}
      />
      {unit != null ? (
        <span
          className="text-[0.62rem] font-semibold text-ink-soft"
          aria-hidden="true"
        >
          {unit}
        </span>
      ) : null}
    </label>
  )
}
