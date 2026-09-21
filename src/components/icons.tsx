import type { ReactNode, SVGProps } from 'react'
import { cn } from '../lib/utils'

type IconProps = SVGProps<SVGSVGElement> & {
  children: ReactNode
}

/** Base SVG shell for button pictograms. */
export function Icon({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('block size-[1em] shrink-0 overflow-visible', className)}
      {...props}
    >
      {children}
    </svg>
  )
}

export function IconNext(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M5.5 5.5v13l9.5-6.5-9.5-6.5zm11 0h2.5v13H16.5V5.5z"
      />
    </Icon>
  )
}

export function IconDiscard(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h2v9H6V9zm1 12c-.6 0-1-.4-1-1l1-11h10l1 11c0 .6-.4 1-1 1H7z"
      />
    </Icon>
  )
}

export function IconRecord(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="6.5" fill="currentColor" />
    </Icon>
  )
}

export function IconStop(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" />
    </Icon>
  )
}

export function IconPlay(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </Icon>
  )
}

export function IconPause(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor" />
    </Icon>
  )
}

export function IconRestart(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" fill="currentColor" />
    </Icon>
  )
}

export function IconDownload(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M11 4h2v8.2l2.6-2.6 1.4 1.4L12 16l-5-5 1.4-1.4L11 12.2V4zM5 18h14v2H5v-2z"
      />
    </Icon>
  )
}

export function IconSettings(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.62l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.49-.41h-3.84a.5.5 0 0 0-.49.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.74 8.86a.5.5 0 0 0 .12.62l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.62l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.5.5 0 0 0 .49.41h3.84a.5.5 0 0 0 .49-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96a.5.5 0 0 0 .6.22l1.92-3.32a.5.5 0 0 0-.12-.62l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
      />
    </Icon>
  )
}

export function IconHelp({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'grid size-[0.95rem] place-items-center text-[0.85rem] font-bold leading-none',
        className,
      )}
      aria-hidden="true"
    >
      ?
    </span>
  )
}

export function IconClose({ className }: { className?: string }) {
  return (
    <span className={cn('leading-none', className)} aria-hidden="true">
      ×
    </span>
  )
}

export function IconSpeakerOn(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"
      />
    </Icon>
  )
}

export function IconSpeakerOff(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M3.63 3.63 2.22 5.04 6.18 9H3v6h4l5 5v-6.96l4.57 4.57A7 7 0 0 1 14 18.7v2.06a9 9 0 0 0 3.33-1.68l2.63 2.63 1.41-1.41L3.63 3.63zM16.5 12c0-.77-.2-1.5-.54-2.14l1.5-1.5A6.9 6.9 0 0 1 18.5 12a6.9 6.9 0 0 1-.8 3.22l1.52 1.52A8.9 8.9 0 0 0 20.5 12c0-2.8-1.28-5.3-3.3-6.93l-1.47 1.47A6.95 6.95 0 0 1 16.5 12zM12 4 9.91 6.09 12 8.18V4z"
      />
    </Icon>
  )
}

export function IconDragDots(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M9 7h2v2H9V7zm4 0h2v2h-2V7zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"
      />
    </Icon>
  )
}
