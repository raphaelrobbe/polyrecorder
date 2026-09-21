import type { ReactNode } from 'react'

type HelpSectionProps = {
  title: string
  children: ReactNode
  hidden?: boolean
  /** Optional data attribute name without `data-` prefix, e.g. `help-shortcuts`. */
  dataAttr?: string
}

/** One titled block inside the Aide panel. */
export function HelpSection({
  title,
  children,
  hidden = false,
  dataAttr,
}: HelpSectionProps) {
  return (
    <section
      className="help-section"
      hidden={hidden}
      {...(dataAttr ? { [`data-${dataAttr}`]: true } : {})}
    >
      <h3 className="help-section-title">{title}</h3>
      {children}
    </section>
  )
}

type HelpTextProps = {
  children: ReactNode
}

export function HelpText({ children }: HelpTextProps) {
  return <p className="help-text">{children}</p>
}
