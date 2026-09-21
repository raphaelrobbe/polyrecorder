import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/utils'

type CheckboxOptionProps = {
  children: ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  className?: string
  title?: string
  hidden?: boolean
  /** Vertical alignment of the checkbox relative to the label text. */
  align?: 'start' | 'center'
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'checked' | 'onChange' | 'className'
  >
}

/** Labeled checkbox used in settings (and similar option lists). */
export function CheckboxOption({
  children,
  checked,
  onCheckedChange,
  className,
  title,
  hidden,
  align = 'start',
  inputProps,
}: CheckboxOptionProps) {
  return (
    <label
      className={cn(
        'm-0 flex cursor-pointer select-none gap-2 text-[0.92rem] font-semibold leading-[1.4] text-ink-soft',
        align === 'start' ? 'items-start' : 'items-center',
        className,
      )}
      title={title}
      hidden={hidden}
    >
      <input
        type="checkbox"
        className={cn(
          'h-4 w-4 shrink-0 accent-ink',
          align === 'start' && 'mt-[0.12rem]',
        )}
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        {...inputProps}
      />
      <span className="min-w-0">{children}</span>
    </label>
  )
}

type OptionGroupProps = {
  title: string
  className?: string
  children: ReactNode
}

/** Titled group of related options (e.g. skip count-in). */
export function OptionGroup({ title, className, children }: OptionGroupProps) {
  return (
    <div className={cn('flex flex-col gap-[0.45rem]', className)}>
      <span className="text-[0.92rem] font-bold text-ink">{title}</span>
      <div className="flex flex-wrap items-center gap-x-[1.15rem] gap-y-[0.85rem]">
        {children}
      </div>
    </div>
  )
}
