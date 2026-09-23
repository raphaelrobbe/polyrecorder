import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

type HelpSectionProps = {
  title: string
  children: ReactNode
  className?: string
  hidden?: boolean
  /** Optional data attribute name without `data-` prefix, e.g. `help-shortcuts`. */
  dataAttr?: string
}

/** One titled block inside the Aide panel. */
export function HelpSection({
  title,
  children,
  className,
  hidden = false,
  dataAttr,
}: HelpSectionProps) {
  return (
    <section
      className={cn(className)}
      hidden={hidden}
      {...(dataAttr ? { [`data-${dataAttr}`]: true } : {})}
    >
      <h3 className="mb-[0.55rem] mt-0 text-[0.95rem] font-bold text-ink">
        {title}
      </h3>
      {children}
    </section>
  )
}

type HelpTextProps = {
  children: ReactNode
  className?: string
}

export function HelpText({ children, className }: HelpTextProps) {
  return (
    <p
      className={cn(
        'm-0 text-[0.84rem] leading-[1.45] text-ink-soft [p+&]:mt-[0.65rem]',
        className,
      )}
    >
      {children}
    </p>
  )
}
