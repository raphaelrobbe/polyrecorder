import { Link } from '@remix-run/react'
import { formatPseudoHandle } from '../../common/user'
import { useLocale } from '../../hooks/useLocale'
import { cn } from '../../lib/utils'

export type BreadcrumbItem = {
  label: string
  to?: string | null
  /** Show as @handle in the UI. */
  isPseudo?: boolean
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
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-[0.35rem]">
            {index > 0 ? (
              <span className="text-ink/35" aria-hidden="true">
                /
              </span>
            ) : null}
            {item.to ? (
              <Link
                to={item.to}
                className="max-w-[10rem] truncate text-ink-soft underline-offset-2 hover:text-ink hover:underline"
              >
                {label}
              </Link>
            ) : (
              <span
                className={cn(
                  'max-w-[12rem] truncate',
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
