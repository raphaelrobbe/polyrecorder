import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

type HelpShortcutsTableProps = {
  className?: string
  children: ReactNode
}

export function HelpShortcutsTable({
  className,
  children,
}: HelpShortcutsTableProps) {
  return (
    <table
      className={cn(
        'w-full border-collapse text-[0.84rem] leading-[1.35]',
        '[&_td]:border-b [&_td]:border-ink/10 [&_td]:px-[0.55rem] [&_td]:py-[0.4rem] [&_td]:align-top [&_td]:text-left',
        '[&_td:first-child]:w-[38%] [&_td:first-child]:whitespace-nowrap [&_td:first-child]:font-bold [&_td:first-child]:text-ink',
        '[&_tbody_tr:last-child_td]:border-b-0',
        className,
      )}
    >
      <tbody>{children}</tbody>
    </table>
  )
}

type HelpShortcutsCategoryProps = {
  children: ReactNode
}

export function HelpShortcutsCategory({ children }: HelpShortcutsCategoryProps) {
  return (
    <tr>
      <td
        colSpan={2}
        className="border-b border-ink/8 bg-ink/6 px-[0.55rem] py-[0.45rem] text-[0.72rem] font-bold tracking-[0.06em] whitespace-normal text-ink-soft uppercase"
      >
        {children}
      </td>
    </tr>
  )
}

type HelpShortcutRowProps = {
  keys: string
  action: string
}

export function HelpShortcutRow({ keys, action }: HelpShortcutRowProps) {
  return (
    <tr>
      <td>{keys}</td>
      <td>{action}</td>
    </tr>
  )
}
