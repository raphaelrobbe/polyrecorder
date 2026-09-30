import type { ReactNode } from 'react'
import { withBrand } from './BrandInline'
import { cn } from '../lib/utils'

type HelpSectionProps = {
  title: ReactNode
  children?: ReactNode
  className?: string
  hidden?: boolean
  id?: string
  /** Optional data attribute name without `data-` prefix, e.g. `help-shortcuts`. */
  dataAttr?: string
}

/** One titled block inside the Aide panel. */
export function HelpSection({
  title,
  children,
  className,
  hidden = false,
  id,
  dataAttr,
}: HelpSectionProps) {
  return (
    <section
      id={id}
      className={cn(className)}
      hidden={hidden}
      {...(dataAttr ? { [`data-${dataAttr}`]: true } : {})}
    >
      <h3 className="mb-[0.55rem] mt-0 flex flex-wrap items-center gap-x-[0.45rem] gap-y-[0.35rem] text-[0.95rem] font-bold text-ink">
        {title}
      </h3>
      {children}
    </section>
  )
}

/** Subheading inside a HelpSection (e.g. sync subsections). */
export function HelpSubtitle({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <h4
      className={cn(
        'mb-[0.4rem] mt-[0.9rem] text-[0.88rem] font-bold text-ink first:mt-0',
        className,
      )}
    >
      {children}
    </h4>
  )
}

type HelpTextProps = {
  children: ReactNode
  className?: string
}

export function HelpText({ children, className }: HelpTextProps) {
  const content = typeof children === 'string' ? withBrand(children) : children
  return (
    <p
      className={cn(
        'm-0 text-[0.84rem] leading-[1.45] text-ink-soft [p+&]:mt-[0.65rem]',
        className,
      )}
    >
      {content}
    </p>
  )
}

type HelpActionRowProps = {
  icon: ReactNode
  children: ReactNode
  className?: string
  /** When set, the whole row is a link (e.g. mode shortcuts). */
  href?: string
  /** Wider leading slot for mode pills. */
  leadingWide?: boolean
  /** Extra classes on the leading slot (e.g. fixed width for alignment). */
  leadingClassName?: string
}

/** Icon + caption row (recording controls legend, etc.). */
export function HelpActionRow({
  icon,
  children,
  className,
  href,
  leadingWide = false,
  leadingClassName,
}: HelpActionRowProps) {
  const rowClass = cn(
    'flex items-start gap-[0.55rem] text-[0.84rem] leading-[1.45] text-ink-soft',
    href &&
      'rounded-lg no-underline transition-colors duration-150 hover:bg-ink/5 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
    href && 'px-[0.35rem] py-[0.28rem] -mx-[0.35rem]',
    className,
  )
  const leading = (
    <span
      className={cn(
        'mt-[0.05rem] inline-flex shrink-0 items-center justify-center',
        leadingWide
          ? 'min-h-[1.55rem]'
          : 'size-[1.55rem] [&_svg]:size-[1.2rem]',
        leadingClassName,
      )}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
  const label = <span className="min-w-0 flex-1 pt-[0.12rem]">{children}</span>

  if (href) {
    return (
      <li>
        <a href={href} className={rowClass}>
          {leading}
          {label}
        </a>
      </li>
    )
  }

  return (
    <li className={rowClass}>
      {leading}
      {label}
    </li>
  )
}

type HelpActionListProps = {
  children: ReactNode
  className?: string
}

export function HelpActionList({ children, className }: HelpActionListProps) {
  return (
    <ul className={cn('m-0 flex list-none flex-col gap-[0.45rem] p-0', className)}>
      {children}
    </ul>
  )
}
