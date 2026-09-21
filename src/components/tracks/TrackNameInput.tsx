import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type TrackNameInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  isDefault?: boolean
}

/** Editable track name; italic soft styling when still on the default label. */
export function TrackNameInput({
  isDefault = false,
  className,
  ...props
}: TrackNameInputProps) {
  return (
    <input
      type="text"
      className={cn(
        'min-w-0 w-full flex-auto rounded-md border-0 bg-transparent px-[0.15rem] py-[0.1rem] text-[0.92rem] font-semibold text-inherit',
        'hover:bg-ink/6 focus:bg-ink/6 focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)] focus:outline-none',
        isDefault &&
          'font-medium italic text-ink-soft [font-synthesis:style]',
        className,
      )}
      {...props}
    />
  )
}
