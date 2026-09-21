import { cn } from '../lib/utils'

/** Centered check mark for custom checkbox faces. */
export function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-[58%]', className)}
      viewBox="0 0 12 12"
      aria-hidden="true"
    >
      <path
        d="M2.4 6.3 4.9 8.8 9.6 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type CheckFaceProps = {
  checked: boolean
  indeterminate?: boolean
  className?: string
}

/** Squared checkbox face with optically centered check / dash. */
export function CheckFace({
  checked,
  indeterminate = false,
  className,
}: CheckFaceProps) {
  return (
    <span
      className={cn(
        'relative grid size-full place-items-center rounded border-2 border-ink/35 bg-surface shadow-[inset_0_1px_2px_color-mix(in_srgb,var(--ink)_6%,transparent)] transition-[background,border-color,box-shadow] duration-140 ease-in-out',
        'peer-focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ink)_15%,transparent)]',
        'peer-disabled:opacity-40',
        checked && !indeterminate && 'border-control bg-control',
        indeterminate && 'border-control bg-control/12',
        className,
      )}
      aria-hidden="true"
    >
      <CheckGlyph
        className={cn(
          'text-on-control opacity-0 transition-opacity duration-140 ease-in-out',
          checked && !indeterminate && 'opacity-100',
        )}
      />
      <span
        className={cn(
          'absolute h-[2px] w-[0.65rem] rounded-full bg-control opacity-0 transition-opacity duration-140 ease-in-out',
          indeterminate && 'opacity-100',
        )}
      />
    </span>
  )
}
