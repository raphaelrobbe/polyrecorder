import { Link } from '@remix-run/react'
import { formatPseudoHandle } from '../../common/user'
import { useLocale } from '../../hooks/useLocale'
import { cn } from '../../lib/utils'

export type BreadcrumbItem = {
  label: string
  to?: string | null
  /** Show as @handle in the UI. */
  isPseudo?: boolean
  /** Compact pill (e.g. “Ma bibliothèque”) that stays light in the trail. */
  asButton?: boolean
}

type LibraryBreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function LibraryBreadcrumb({ items, className }: LibraryBreadcrumbProps) {
  useLocale()
  if (items.length === 0) return null

  return (
    <nav
      className={cn(
        'mb-3 flex flex-wrap items-center justify-center gap-x-[0.35rem] gap-y-[0.15rem] text-center text-[0.78rem] font-semibold tracking-[0.02em] text-ink-soft',
        className,
      )}
      aria-label="breadcrumb"
    >
      {items.map((item, index) => {
        const label = item.isPseudo
          ? (formatPseudoHandle(item.label) ?? item.label)
          : item.label
        const isLast = index === items.length - 1
        return (
          <span
            key={`${item.label}-${index}`}
            className="inline-flex items-center gap-[0.35rem]"
          >
            {index > 0 ? (
              <span className="text-ink/35" aria-hidden="true">
                /
              </span>
            ) : null}
            {item.to && item.asButton ? (
              <Link
                to={item.to}
                className={cn(
                  'inline-flex max-w-[11rem] items-center break-words rounded-full border border-line px-[0.42rem] py-[0.08rem] text-left',
                  'font-bold text-ink no-underline transition-[background,border-color,color] duration-150',
                  'hover:border-ink/35 hover:bg-ink/6',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
                )}
              >
                {label}
              </Link>
            ) : item.to ? (
              <Link
                to={item.to}
                className="max-w-[10rem] break-words text-left text-ink-soft underline-offset-2 hover:text-ink hover:underline"
              >
                {label}
              </Link>
            ) : (
              <span
                className={cn(
                  'max-w-[12rem] break-words text-left',
                  isLast ? 'text-ink' : 'text-ink-soft',
                )}
              >
                {label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
