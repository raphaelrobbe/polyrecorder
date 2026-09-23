import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/utils'

export type ButtonVariant =
  | 'default'
  | 'transport'
  | 'utility'
  | 'trim'
  | 'nudge'
  | 'trash'
  | 'round'

const base =
  'appearance-none cursor-pointer font-[inherit] font-bold tracking-[0.01em] transition-[transform,background,color,box-shadow,opacity,border-color] duration-160 ease-in-out disabled:cursor-not-allowed disabled:opacity-[0.38] disabled:transform-none'

const variants: Record<ButtonVariant, string> = {
  default:
    'rounded-full border-0 px-[1.2rem] py-[0.95rem] hover:enabled:-translate-y-px active:enabled:translate-y-px active:enabled:scale-[0.98]',
  transport: cn(
    'm-0 inline-flex h-[4.1rem] w-[4.1rem] items-center justify-center rounded-full border-[2.5px] border-line bg-surface p-0 text-ink leading-none',
    'shadow-[0_8px_22px_var(--shadow),inset_0_1px_0_var(--highlight)]',
    'hover:enabled:-translate-y-0.5 hover:enabled:shadow-[0_12px_28px_var(--shadow),inset_0_1px_0_var(--highlight)]',
    'active:enabled:translate-y-px active:enabled:scale-[0.97]',
    '[&_svg]:block [&_svg]:size-[1.55rem] [&_svg]:shrink-0',
  ),
  utility: cn(
    'm-0 inline-flex items-center gap-[0.35rem] rounded-full border border-transparent bg-transparent px-[0.55rem] py-[0.35rem]',
    'text-[0.78rem] font-semibold leading-none text-ink/55',
    'hover:border-ink/8 hover:bg-ink/6 hover:text-ink-soft',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
    '[&_svg]:block [&_svg]:size-[0.95rem]',
  ),
  trim: cn(
    'rounded-full border-[1.5px] border-line bg-transparent px-[0.65rem] py-[0.4rem] text-[0.78rem] text-ink',
    'hover:enabled:-translate-y-px hover:enabled:bg-ink/6',
    'active:enabled:translate-y-px active:enabled:scale-[0.98]',
  ),
  nudge: cn(
    'h-[1.7rem] w-[1.7rem] rounded-lg border-[1.5px] border-line bg-transparent p-0 text-[0.95rem] font-bold leading-none text-ink',
    'max-sm:h-[1.4rem] max-sm:w-[1.4rem] max-sm:rounded-md max-sm:text-[0.82rem]',
    'hover:enabled:-translate-y-px hover:enabled:bg-ink/6',
    'active:enabled:translate-y-px active:enabled:scale-[0.98]',
  ),
  trash: cn(
    'grid h-8 w-8 place-items-center rounded-[10px] border-[1.5px] border-line bg-transparent p-0 text-[1.25rem] font-medium leading-none text-ink-soft',
    'max-sm:h-[1.65rem] max-sm:w-[1.65rem] max-sm:rounded-lg max-sm:text-[1.05rem]',
    'hover:enabled:-translate-y-px hover:enabled:border-record/35 hover:enabled:bg-record/10 hover:enabled:text-record',
    'active:enabled:translate-y-px active:enabled:scale-[0.98]',
  ),
  round: cn(
    'grid place-items-center rounded-full border-[1.5px] border-line bg-transparent p-0 text-ink leading-none',
    'hover:enabled:-translate-y-px hover:enabled:bg-ink/6',
    'active:enabled:translate-y-px active:enabled:scale-[0.98]',
    'disabled:opacity-35 [&_svg]:block [&_svg]:shrink-0',
  ),
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  /** Pictogram shown before the label (or alone for icon buttons). */
  icon?: ReactNode
  children?: ReactNode
}

export function Button({
  variant = 'default',
  icon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
