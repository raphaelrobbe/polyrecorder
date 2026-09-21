import { useEffect, useRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { IconSpeakerOff, IconSpeakerOn } from '../icons'

type DataAttrs = {
  [key: `data-${string}`]: string | number | boolean | undefined
}

export type TrackMuteProps = {
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  title?: string
  ariaLabel: string
  onCheckedChange: (checked: boolean) => void
  className?: string
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'checked' | 'onChange' | 'disabled' | 'aria-label' | 'className'
  > &
    DataAttrs
}

/** Speaker mute toggle — icons driven by checked / indeterminate props. */
export function TrackMute({
  checked,
  indeterminate = false,
  disabled,
  title,
  ariaLabel,
  onCheckedChange,
  className,
  inputProps,
}: TrackMuteProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  const showOn = checked || indeterminate
  const showOff = !checked && !indeterminate

  return (
    <label
      className={cn(
        'relative h-[1.55rem] w-[1.55rem] shrink-0 cursor-pointer text-ink max-sm:h-[1.4rem] max-sm:w-[1.4rem]',
        className,
      )}
      title={title}
      data-track-mute
    >
      <input
        ref={inputRef}
        type="checkbox"
        className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onCheckedChange(event.target.checked)}
        {...inputProps}
      />
      <span
        className={cn(
          'grid size-full place-items-center rounded-md',
          'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink/25',
          'peer-disabled:opacity-35',
        )}
        aria-hidden="true"
      >
        <IconSpeakerOn
          className={cn(
            'size-[1.2rem]',
            !showOn && 'hidden',
            indeterminate && 'opacity-45',
          )}
        />
        <IconSpeakerOff
          className={cn('size-[1.2rem] text-ink-soft', !showOff && 'hidden')}
        />
      </span>
    </label>
  )
}
