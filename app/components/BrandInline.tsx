import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

/** Canonical brand spelling in UI copy (never translated). */
export const BRAND_NAME = 'polyrecorder' as const

const BRAND_PATTERN = /PolyRecorder|polyrecorder/g

type BrandInlineProps = {
  className?: string
}

/** Inline brand: lowercase, Nunito extrabold (800). */
export function BrandInline({ className }: BrandInlineProps) {
  return (
    <span
      className={cn('font-brand font-extrabold lowercase', className)}
      style={{ fontWeight: 800 }}
    >
      {BRAND_NAME}
    </span>
  )
}

/** Replace brand mentions in a string with styled inline spans. */
export function withBrand(text: string): ReactNode {
  const parts = text.split(BRAND_PATTERN)
  if (parts.length === 1) return text
  const nodes: ReactNode[] = []
  let matchIndex = 0
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) nodes.push(parts[i])
    if (i < parts.length - 1) {
      nodes.push(<BrandInline key={`brand-${matchIndex++}`} />)
    }
  }
  return nodes
}
