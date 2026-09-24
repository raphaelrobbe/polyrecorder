import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { importAudioFiles } from '../lib/sessionActions.client'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'

type DeckProps = {
  children: ReactNode
  className?: string
  /** Accept audio file drops onto the recorder card (home deck). */
  enableAudioDrop?: boolean
}

/**
 * Recorder card shell (border, glass, highlight).
 * View content is passed as children (main / settings / help).
 */
export function Deck({ children, className, enableAudioDrop = false }: DeckProps) {
  useLocale()
  const state = useSessionStore((s) => s.state)
  const [dropActive, setDropActive] = useState(false)
  const dragDepth = useRef(0)

  const dropEnabled = enableAudioDrop && state !== 'recording'

  const onDragEnter = (event: DragEvent<HTMLElement>) => {
    if (!dropEnabled) return
    if (![...event.dataTransfer.types].includes('Files')) return
    event.preventDefault()
    dragDepth.current += 1
    setDropActive(true)
  }

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    if (!dropEnabled) return
    if (![...event.dataTransfer.types].includes('Files')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!dropEnabled) return
    event.preventDefault()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDropActive(false)
  }

  const onDrop = (event: DragEvent<HTMLElement>) => {
    if (!dropEnabled) return
    event.preventDefault()
    dragDepth.current = 0
    setDropActive(false)
    const files = event.dataTransfer.files
    if (!files || files.length === 0) return
    void importAudioFiles(files)
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-line px-6 pb-6 pt-7',
        'max-sm:rounded-[22px] max-sm:px-3.5 max-sm:pb-4 max-sm:pt-5',
        'bg-[var(--deck-fill)] shadow-deck backdrop-blur-[10px]',
        "before:pointer-events-none before:absolute before:inset-0 before:content-['']",
        'before:bg-[var(--deck-sheen)]',
        dropActive &&
          'border-record/55 shadow-[0_0_0_2px_color-mix(in_srgb,var(--record)_28%,transparent),0_16px_36px_var(--shadow)]',
        className,
      )}
      aria-label={t('deck.ariaLabel')}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
      {dropActive ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[color-mix(in_srgb,var(--deck-fill)_72%,transparent)] px-6 text-center"
          aria-hidden="true"
        >
          <p className="m-0 text-[0.95rem] font-semibold text-ink">
            {t('capture.dropHint')}
          </p>
        </div>
      ) : null}
    </section>
  )
}
