import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../Button'
import { TrackOffsetField } from './TrackOffsetField'

export type TrackNudgeControlsProps = {
  title?: string
  className?: string
  minusAriaLabel: string
  plusAriaLabel: string
  onMinus: () => void
  onPlus: () => void
  offset: ReactNode
}

/** − / offset / + controls for manual track timing. */
export function TrackNudgeControls({
  title = 'Décaler cette piste à la lecture',
  className,
  minusAriaLabel,
  plusAriaLabel,
  onMinus,
  onPlus,
  offset,
}: TrackNudgeControlsProps) {
  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-[0.15rem]',
        className,
      )}
      title={title}
      data-track-nudge
    >
      <Button variant="nudge" aria-label={minusAriaLabel} onClick={onMinus}>
        −
      </Button>
      {offset}
      <Button variant="nudge" aria-label={plusAriaLabel} onClick={onPlus}>
        +
      </Button>
    </div>
  )
}

export { TrackOffsetField }
