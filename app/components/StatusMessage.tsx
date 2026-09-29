import type { ReactNode } from 'react'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import type { NoticeTone } from '../store/sessionStore'
import { IconClose } from './icons'

const TONE_CLASS: Record<
  NoticeTone,
  { panel: string; close: string; action: string }
> = {
  simple: {
    panel:
      'border-ink/28 bg-ink/8 text-ink [&_strong]:font-extrabold',
    close: 'text-ink hover:bg-ink/12',
    action:
      'border-ink/28 bg-transparent text-ink hover:enabled:bg-ink/12',
  },
  mix: {
    panel:
      'border-mode-mix-border bg-mode-mix-bg text-mode-mix [&_strong]:font-extrabold',
    close: 'text-mode-mix hover:bg-mode-mix-hover',
    action:
      'border-mode-mix-border bg-transparent text-mode-mix hover:enabled:bg-mode-mix-hover',
  },
  align: {
    panel:
      'border-mode-align-border bg-mode-align-bg text-mode-align [&_strong]:font-extrabold',
    close: 'text-mode-align hover:bg-mode-align-hover',
    action:
      'border-mode-align-border bg-transparent text-mode-align hover:enabled:bg-mode-align-hover',
  },
  warn: {
    panel:
      'border-warn-border bg-warn-bg text-warn [&_strong]:font-extrabold',
    close: 'text-warn hover:bg-warn-hover',
    action:
      'border-warn-border bg-transparent text-warn hover:enabled:bg-warn-hover',
  },
}

type NoticeBannerProps = {
  tone: NoticeTone
  children: ReactNode
  className?: string
  hidden?: boolean
  /** Compact variant (e.g. under master volume). */
  compact?: boolean
  onDismiss: () => void
  actionLabel?: string
  onAction?: () => void
  title?: string
}

/** Dismissible session / chip warning with mode-matched colors. */
export function NoticeBanner({
  tone,
  children,
  className,
  hidden,
  compact,
  onDismiss,
  actionLabel,
  onAction,
  title,
}: NoticeBannerProps) {
  const toneClass = TONE_CLASS[tone]
  return (
    <div
      className={cn(
        'relative flex flex-wrap items-center gap-x-3 gap-y-[0.45rem] rounded-[14px] border-[1.5px] font-semibold leading-[1.35]',
        compact
          ? 'px-[0.7rem] py-[0.45rem] pr-[2rem] text-[0.78rem]'
          : 'mt-4 px-[0.95rem] py-[0.85rem] pr-[2.1rem] text-[0.88rem]',
        toneClass.panel,
        className,
      )}
      hidden={hidden}
      role="status"
      title={title}
      data-notice={tone}
    >
      <button
        type="button"
        className={cn(
          'absolute top-[0.35rem] right-[0.4rem] m-0 inline-flex h-[1.6rem] w-[1.6rem] cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[1.15rem] leading-none',
          toneClass.close,
        )}
        aria-label={t('common.close')}
        title={t('common.close')}
        data-notice-dismiss
        onClick={onDismiss}
      >
        <IconClose />
      </button>
      <span className="min-w-0 flex-auto">{children}</span>
      {actionLabel && onAction ? (
        <button
          type="button"
          className={cn(
            'ml-auto cursor-pointer rounded-lg border-[1.5px] px-3 py-[0.4rem] font-[inherit] text-[0.8rem] font-bold',
            toneClass.action,
          )}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}

type ErrorBannerProps = {
  children: ReactNode
  className?: string
  hidden?: boolean
  onDismiss?: () => void
}

/** Generic error / library banner (warn tone). Prefer NoticeBanner for deck chips. */
export function ErrorBanner({
  children,
  className,
  hidden,
  onDismiss,
}: ErrorBannerProps) {
  if (onDismiss) {
    return (
      <NoticeBanner
        tone="warn"
        className={cn('mt-0', className)}
        hidden={hidden}
        onDismiss={onDismiss}
      >
        {children}
      </NoticeBanner>
    )
  }
  return (
    <p
      className={cn(
        'relative mt-4 rounded-[14px] bg-record/10 px-[0.95rem] py-[0.8rem] text-[0.9rem] font-medium text-record-deep',
        className,
      )}
      hidden={hidden}
      role="status"
    >
      {children}
    </p>
  )
}

type HintProps = {
  children: ReactNode
  className?: string
}

/** Footer hint under the deck; hides when empty. */
export function Hint({ children, className }: HintProps) {
  const empty =
    children == null ||
    (typeof children === 'string' && children.trim() === '')

  if (empty) return null

  return (
    <p
      className={cn(
        'text-center text-[0.88rem] leading-[1.4] text-ink-soft',
        className,
      )}
    >
      {children}
    </p>
  )
}
