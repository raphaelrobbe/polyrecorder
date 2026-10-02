import type { ReactNode, SVGProps } from 'react'
import { useId } from 'react'
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

/** Trash can with lid + vertical ribs (filled, evenodd slots). */
export function IconTrash(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M9 3h6l1 2h5v2H3V5h5l1-2zM6 9h12v10c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9zm2 2h1.5v8H8V11zm3.25 0h1.5v8h-1.5V11zm3.25 0H16v8h-1.5V11z"
      />
    </Icon>
  )
}

/** Two overlapping pages — duplicate / copy. */
export function IconDuplicate(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M8 3h9c.6 0 1 .4 1 1v11h-2V5H8V3zm-3 4h9c.6 0 1 .4 1 1v12c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1V8c0-.6.4-1 1-1zm1 2v10h7V9H6z"
      />
    </Icon>
  )
}

/** Folder with outbound arrow — move to another place. */
export function IconMove(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M10 4h4l1.5 2H20c.6 0 1 .4 1 1v3.5h-2V8h-5.2l-1.5-2H10v10h4.5v2H9c-.6 0-1-.4-1-1V5c0-.6.4-1 1-1zm5.3 9.3 3.2-3.2 1.4 1.4-1.3 1.3H22v2h-3.4l1.3 1.3-1.4 1.4-3.2-3.2c-.4-.4-.4-1 0-1.4z"
      />
    </Icon>
  )
}

export function IconRecord({
  className,
  ...props
}: Omit<IconProps, 'children'>) {
  const reactId = useId().replace(/:/g, '')
  const maskId = `icon-record-mask-${reactId}`

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn('block size-[1em] shrink-0', className)}
      {...props}
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="32"
          height="32"
        >
          <rect width="32" height="32" fill="#000000" />
          <rect
            x="11"
            y="2.75"
            width="10"
            height="16"
            rx="5"
            fill="#ffffff"
          />
          <path
            d="M8.125 13.75 A7.875 7.875 0 0 0 23.875 13.75"
            stroke="#ffffff"
            strokeWidth="2.75"
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1="16"
            y1="21.625"
            x2="16"
            y2="27.125"
            stroke="#ffffff"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <rect x="0" y="2.75" width="32" height="3.5" fill="#FDAC35" />
        <rect x="0" y="6" width="32" height="3.5" fill="#FEA43B" />
        <rect x="0" y="9.25" width="32" height="3.5" fill="#FD656B" />
        <rect x="0" y="12.5" width="32" height="3.5" fill="#EB46B0" />
        <rect x="0" y="15.75" width="32" height="3.5" fill="#D849D9" />
        <rect x="0" y="19" width="32" height="3.5" fill="#A346F3" />
        <rect x="0" y="22.25" width="32" height="3.5" fill="#5265FC" />
        <rect x="0" y="25.5" width="32" height="3.5" fill="#3694FF" />
      </g>
    </svg>
  )
}

/** Import from device — upload arrow into a tray (universally readable). */
export function IconImportAudio(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M11 16V7.85l-2.6 2.6L7 9l5-5 5 5-1.4 1.45-2.6-2.6V16h-2zM5 18h14v2H5v-2z"
      />
    </Icon>
  )
}

/** Classic metronome silhouette (pendulum + pyramid body). */
export function IconMetronome(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M12.7 3.2 14.8 9H16l-1.6 9.2c-.15.9-.9 1.55-1.8 1.55H8.4c-.9 0-1.65-.65-1.8-1.55L5 9h1.2L8.3 3.2c.2-.7.85-1.2 1.6-1.2h1.2c.75 0 1.4.5 1.6 1.2zM9.1 5l-1.5 4h5.8L12 5H9.1zm-.35 6-.9 5.2h5.3l-.9-5.2H8.75zM13.6 4.4l4.2 1.5-.55 1.55-4.2-1.5.55-1.55z"
      />
    </Icon>
  )
}

export function IconStop(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1.5" fill="currentColor" />
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

export function IconSun(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M12 7.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0-5.5h1.5v3H12V2zm0 16.5h1.5V22H12v-3.5zM4.22 4.22l1.06-1.06 2.12 2.12-1.06 1.06L4.22 4.22zm12.38 12.38 1.06-1.06 2.12 2.12-1.06 1.06-2.12-2.12zM2 11.25h3v1.5H2v-1.5zm17 0h3v1.5h-3v-1.5zM4.22 19.78l2.12-2.12 1.06 1.06-2.12 2.12-1.06-1.06zm12.38-12.38 2.12-2.12 1.06 1.06-2.12 2.12-1.06-1.06z"
      />
    </Icon>
  )
}

export function IconMoon(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M12.7 2.1a9.5 9.5 0 1 0 9.2 12.7A8 8 0 0 1 12.7 2.1z"
      />
    </Icon>
  )
}

/** Three vertical mixer faders (outline knobs hide the track behind). */
export function IconFaders(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M6.45 3h1.1v18H6.45V3zm5 0h1.1v18h-1.1V3zm5 0h1.1v18h-1.1V3z"
      />
      <circle
        cx="7"
        cy="14"
        r="1.9"
        fill="var(--fader-knob-fill, var(--surface))"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="9"
        r="1.9"
        fill="var(--fader-knob-fill, var(--surface))"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        cx="17"
        cy="16.5"
        r="1.9"
        fill="var(--fader-knob-fill, var(--surface))"
        stroke="currentColor"
        strokeWidth="1.5"
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

export function IconCheck(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.5 12.5 10 17l8.5-9"
      />
    </Icon>
  )
}

export function IconPlus(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        d="M12 5.5v13M5.5 12h13"
      />
    </Icon>
  )
}

/** Chevron pointing down; rotate −90° when collapsed. */
export function IconChevron(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.5 9.25 12 14.75l5.5-5.5"
      />
    </Icon>
  )
}

export function IconCloudSave(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"
      />
    </Icon>
  )
}

export function IconLibrary(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="currentColor"
        d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"
      />
    </Icon>
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

/** Sparkle — feature-this track in mix mode (outline; fill via CSS when pressed). */
export function IconHighlight({
  filled = false,
  ...props
}: Omit<IconProps, 'children'> & { filled?: boolean }) {
  return (
    <Icon {...props}>
      {filled ? (
        <path
          fill="currentColor"
          d="M12 2.2 13.55 9.1 20.5 10.7 13.55 12.3 12 19.2 10.45 12.3 3.5 10.7 10.45 9.1 12 2.2zm5.6 11.05 1.05 4.55 4.55 1.05-4.55 1.05-1.05 4.55-1.05-4.55-4.55-1.05 4.55-1.05 1.05-4.55z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
          d="M12 3.4 13.2 9.1 18.9 10.4 13.2 11.7 12 17.4 10.8 11.7 5.1 10.4 10.8 9.1 12 3.4zm5.35 10.35.7 3.05 3.05.7-3.05.7-.7 3.05-.7-3.05-3.05-.7 3.05-.7.7-3.05z"
        />
      )}
    </Icon>
  )
}

export function IconGlobe(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zm0 0c2.2 2.4 3.4 5.3 3.4 8.5S14.2 18.1 12 20.5M12 3.5C9.8 5.9 8.6 8.8 8.6 12s1.2 6.1 3.4 8.5M4.2 12h15.6"
      />
    </Icon>
  )
}

export function IconLock(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 11V8.2a4 4 0 0 1 8 0V11M7 11h10v9.5H7V11z"
      />
    </Icon>
  )
}

export function IconShare(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 3.158V7.51c-5.428.223-8.27 3.75-8.875 11.199-.04.487-.07.975-.09 1.464l-.014.395c-.014.473.578.684.88.32.302-.368.61-.73.925-1.086l.244-.273c1.79-1.967 3-2.677 4.93-2.917a18.011 18.011 0 012-.112v4.346a1 1 0 001.646.763l9.805-8.297 1.55-1.31-1.55-1.31-9.805-8.297A1 1 0 0010 3.158Z"
      />
    </Icon>
  )
}

/** Two people — collaboration / multi-user recording. */
export function IconCollaborate(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.2 10.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2zM16.2 10.8a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4zM4.5 19.2v-.6c0-2.4 2-4.3 4.5-4.3h.8c2.5 0 4.5 1.9 4.5 4.3v.6M14.2 14.5c1.9.2 3.5 1.7 3.5 3.7v1"
      />
    </Icon>
  )
}

/** Recalculate count-in auto-align (timeline + dual cursors, slightly offset). */
export function IconAutoAlign(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M3.5 12h17"
      />
      <path
        fill="currentColor"
        d="M10 9.6 6.7 4.4h6.6L10 9.6zm4 4.8 3.3 5.2H10.7L14 14.4z"
      />
    </Icon>
  )
}

/** Scissors for cut / découpage mode. */
export function IconScissors(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle
        cx="6.2"
        cy="6.2"
        r="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <circle
        cx="6.2"
        cy="17.8"
        r="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        d="M8.2 7.6 20 18.2M8.2 16.4 20 5.8"
      />
    </Icon>
  )
}
