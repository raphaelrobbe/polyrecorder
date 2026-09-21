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
        'inline-flex min-w-[3.6rem] items-baseline justify-center gap-[0.12rem] max-sm:min-w-[3.05rem] max-sm:gap-[0.08rem]',
        labelClassName,
      )}
    >
      <input
        type="text"
        className={cn(
          'm-0 w-[2.6rem] min-w-0 rounded-[5px] border-0 bg-transparent px-[0.1rem] py-[0.12rem] text-center text-[0.72rem] font-bold tabular-nums text-ink-soft',
          'max-sm:w-[2.15rem] max-sm:px-0 max-sm:text-[0.68rem]',
          'hover:bg-ink/6 hover:text-ink',
          'focus:bg-ink/6 focus:text-ink focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)] focus:outline-none',
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
