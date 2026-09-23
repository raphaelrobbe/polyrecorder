import type { ButtonHTMLAttributes } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { IconDragDots } from '../icons'

export type TrackDragHandleProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ariaLabel: string
}

/** Grab handle for track drag-reorder. */
export function TrackDragHandle({
  ariaLabel,
  className,
  title,
  type = 'button',
  ...props
}: TrackDragHandleProps) {
  useLocale()
  return (
    <button
      type={type}
      className={cn(
        'col-start-1 row-start-1 grid h-[1.9rem] w-[1.35rem] place-items-center rounded-md border-0 bg-transparent p-0 text-ink-soft opacity-70 touch-none cursor-grab max-sm:h-[1.7rem] max-sm:w-[1.2rem]',
        'hover:bg-ink/6 hover:text-ink hover:opacity-100',
        'active:cursor-grabbing',
        className,
      )}
      aria-label={ariaLabel}
      title={title ?? t('tracks.drag')}
      {...props}
    >
      <IconDragDots className="size-[1.35rem] max-sm:size-[1.15rem]" />
    </button>
  )
}
