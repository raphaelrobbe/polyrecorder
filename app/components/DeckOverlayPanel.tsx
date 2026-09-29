import { useNavigate } from '@remix-run/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { withShortcut } from '../lib/withShortcut'
import { useLocale } from '../hooks/useLocale'
import { getDeckHomePath } from '../lib/sessionActions.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'

type DeckOverlayPanelProps = {
  title: string
  /** Optional control centered in the header (e.g. help search). */
  titleAside?: ReactNode
  closeAriaLabel: string
  className?: string
  bodyClassName?: string
  children: ReactNode
}

const closeBtnClass = cn(
  'grid h-[2.9rem] w-[2.9rem] shrink-0 place-items-center rounded-[14px] border-0 bg-transparent',
  'p-0 text-[2.15rem] font-normal leading-none text-ink-soft cursor-pointer',
  'transition-[background,color] duration-[160ms] ease-in-out',
  'hover:bg-ink/8 hover:text-ink',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
)

/** Shared shell for Paramètres / Aide / Compte / Connexion (close button, title, body). */
export function DeckOverlayPanel({
  title,
  titleAside,
  closeAriaLabel,
  className,
  bodyClassName,
  children,
}: DeckOverlayPanelProps) {
  useLocale()
  const navigate = useNavigate()
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closeLabel = t('common.close')

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  const closeButton = (
    <button
      ref={closeRef}
      type="button"
      className={closeBtnClass}
      aria-label={closeAriaLabel}
      title={withShortcut(closeLabel, 'Échap', keyboardHintsEnabled)}
      data-title-base={closeLabel}
      onClick={() => navigate(getDeckHomePath())}
    >
      ×
    </button>
  )

  return (
    <div
      className={cn(
        'relative min-h-[11rem] px-1 pb-2 pt-[0.35rem]',
        className,
      )}
    >
      {titleAside ? (
        <div className="mb-[1.15rem] grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-x-2">
          <h2 className="font-display m-0 justify-self-start text-[1.45rem] font-bold tracking-[-0.02em] text-ink">
            {title}
          </h2>
          <div className="w-[min(15rem,calc(100vw-8rem))] justify-self-center">
            {titleAside}
          </div>
          <div className="justify-self-end">{closeButton}</div>
        </div>
      ) : (
        <div className="mb-[1.15rem] flex items-start justify-between gap-2">
          <h2 className="font-display m-0 min-w-0 text-[1.45rem] font-bold tracking-[-0.02em] text-ink">
            {title}
          </h2>
          {closeButton}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
