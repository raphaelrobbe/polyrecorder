import type { ReactNode } from 'react'
import { cn } from '../lib/utils'
import { Button } from './Button'

export type NudgeControlsProps = {
  title?: string
  className?: string
  minusAriaLabel: string
  plusAriaLabel: string
  onMinus: () => void
  onPlus: () => void
  valueSlot: ReactNode
}

/** − / value / + chrome for fine numeric adjustments. */
export function NudgeControls({
  title,
  className,
  minusAriaLabel,
  plusAriaLabel,
  onMinus,
  onPlus,
  valueSlot,
}: NudgeControlsProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-[0.15rem] max-sm:gap-[0.08rem]',
        className,
      )}
      title={title}
      data-ms-nudge
    >
      <Button variant="nudge" aria-label={minusAriaLabel} onClick={onMinus}>
        −
      </Button>
      {valueSlot}
      <Button variant="nudge" aria-label={plusAriaLabel} onClick={onPlus}>
        +
      </Button>
    </div>
  )
}
