import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

type ErrorBannerProps = {
  children: ReactNode
  className?: string
  hidden?: boolean
}

export function ErrorBanner({ children, className, hidden }: ErrorBannerProps) {
  return (
    <p
      className={cn(
        'relative mt-4 rounded-[14px] bg-[rgba(226,61,61,0.1)] px-[0.95rem] py-[0.8rem] text-[0.9rem] font-medium text-[#9b1f1f]',
        className,
      )}
      hidden={hidden}
    >
      {children}
    </p>
  )
}

type HintProps = {
  children: ReactNode
  className?: string
}

/** Footer hint under the deck; hides when empty. */
export function Hint({ children, className }: HintProps) {
  const empty =
    children == null ||
    (typeof children === 'string' && children.trim() === '')

  if (empty) return null

  return (
    <p
      className={cn(
        'text-center text-[0.88rem] leading-[1.4] text-ink-soft',
        className,
      )}
    >
      {children}
    </p>
  )
}
