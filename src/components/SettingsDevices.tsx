import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

type SettingsDevicesProps = {
  title: string
  className?: string
  children: ReactNode
}

/** “Périphériques audio” block in Paramètres. */
export function SettingsDevices({
  title,
  className,
  children,
}: SettingsDevicesProps) {
  return (
    <div
      className={cn(
        'mt-[0.35rem] flex flex-col gap-4 border-t border-[rgba(15,61,62,0.12)] pt-[0.85rem]',
        className,
      )}
    >
      <h3 className="m-0 text-[0.92rem] font-bold text-ink">{title}</h3>
      {children}
    </div>
  )
}

type SettingsDeviceSectionProps = {
  title: string
  hint?: ReactNode
  className?: string
  children: ReactNode
}

export function SettingsDeviceSection({
  title,
  hint,
  className,
  children,
}: SettingsDeviceSectionProps) {
  return (
    <div className={cn('flex flex-col gap-[0.45rem] [&+&]:mt-[0.55rem]', className)}>
      <h4 className="m-0 text-[0.84rem] font-bold text-ink-soft">{title}</h4>
      {hint ? (
        <p className="m-0 text-[0.78rem] leading-[1.4] text-ink-soft">{hint}</p>
      ) : null}
      {children}
    </div>
  )
}

type SettingsDeviceColsProps = {
  columns?: 1 | 2
  className?: string
  hidden?: boolean
  children: ReactNode
}

export function SettingsDeviceCols({
  columns = 2,
  className,
  hidden,
  children,
}: SettingsDeviceColsProps) {
  return (
    <div
      className={cn(
        'grid gap-x-4 gap-y-3',
        columns === 1
          ? 'grid-cols-1'
          : 'grid-cols-1 min-[481px]:grid-cols-2',
        className,
      )}
      hidden={hidden}
    >
      {children}
    </div>
  )
}

type SettingsDeviceFieldProps = {
  label?: ReactNode
  className?: string
  children: ReactNode
}

export function SettingsDeviceField({
  label,
  className,
  children,
}: SettingsDeviceFieldProps) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-[0.3rem]', className)}>
      {label ? (
        <span className="text-[0.78rem] font-semibold text-ink-soft">
          {label}
        </span>
      ) : null}
      {children}
    </label>
  )
}

type SettingsSelectProps = SelectHTMLAttributes<HTMLSelectElement>

export function SettingsSelect({ className, ...props }: SettingsSelectProps) {
  return (
    <select
      className={cn(
        'm-0 w-full appearance-none rounded-[10px] border-[1.5px] border-line bg-white py-[0.55rem] pr-8 pl-[0.7rem]',
        'bg-[linear-gradient(45deg,transparent_50%,var(--color-ink-soft)_50%),linear-gradient(135deg,var(--color-ink-soft)_50%,transparent_50%)]',
        'bg-size-[5px_5px,5px_5px] bg-position-[calc(100%-14px)_50%,calc(100%-9px)_50%] bg-no-repeat',
        'font-[inherit] text-[0.88rem] font-semibold text-ink',
        'focus:border-[rgba(15,61,62,0.35)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(15,61,62,0.08)]',
        className,
      )}
      {...props}
    />
  )
}

type SettingsNoteProps = {
  className?: string
  hidden?: boolean
  children: ReactNode
}

export function SettingsNote({
  className,
  hidden,
  children,
}: SettingsNoteProps) {
  return (
    <p
      className={cn(
        'mt-[0.35rem] mb-0 rounded-xl border border-[rgba(15,61,62,0.1)] bg-[rgba(15,61,62,0.04)] px-[0.8rem] py-[0.7rem] text-[0.8rem] leading-[1.4] text-ink-soft',
        className,
      )}
      hidden={hidden}
    >
      {children}
    </p>
  )
}
