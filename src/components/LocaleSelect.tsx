import { useEffect, useId, useRef, useState } from 'react'
import { useLocale } from '../hooks/useLocale'
import { LOCALES, getLocaleInfo, t, type Locale } from '../lib/i18n'
import { cn } from '../lib/utils'

type LocaleSelectProps = {
  className?: string
}

/**
 * Compact flag select for the footer — opens a list of available languages
 * (ready for more than two locales).
 */
export function LocaleSelect({ className }: LocaleSelectProps) {
  const { locale, setLocale } = useLocale()
  const current = getLocaleInfo(locale)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDocPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (next: Locale) => {
    setLocale(next)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'inline-flex h-[1.85rem] min-w-[2.35rem] items-center justify-center gap-[0.2rem] rounded-full border border-transparent bg-transparent px-[0.4rem]',
          'text-[1.05rem] leading-none text-ink/55',
          'hover:border-ink/8 hover:bg-ink/6 hover:text-ink-soft',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          open && 'border-ink/8 bg-ink/6 text-ink',
        )}
        aria-label={t('locale.select.aria')}
        title={t('locale.select.aria')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">{current.flag}</span>
        <span
          aria-hidden="true"
          className={cn(
            'text-[0.55rem] text-ink-soft transition-transform duration-150',
            open && 'rotate-180',
          )}
        >
          ▾
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('locale.select.aria')}
          className={cn(
            'absolute bottom-[calc(100%+0.3rem)] left-0 z-20 m-0 min-w-[9.5rem] list-none overflow-hidden rounded-[12px] border border-line bg-surface p-[0.25rem]',
            'shadow-[0_10px_28px_var(--shadow)]',
          )}
        >
          {LOCALES.map((item) => {
            const selected = item.code === locale
            return (
              <li key={item.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-[0.45rem] rounded-[8px] border-0 bg-transparent px-[0.55rem] py-[0.4rem] text-left font-[inherit] text-[0.82rem] font-semibold text-ink',
                    'hover:bg-ink/6',
                    selected && 'bg-ink/8',
                  )}
                  onClick={() => choose(item.code)}
                >
                  <span aria-hidden="true" className="text-[1.05rem] leading-none">
                    {item.flag}
                  </span>
                  <span>{item.nativeName}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
