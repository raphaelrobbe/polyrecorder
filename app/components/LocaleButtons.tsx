import { useLocale } from '../hooks/useLocale'
import { LOCALES, t } from '../lib/i18n'
import { cn } from '../lib/utils'

type LocaleButtonsProps = {
  className?: string
}

/** Settings row: « Langue : » + horizontal buttons for each available locale. */
export function LocaleButtons({ className }: LocaleButtonsProps) {
  const { locale, setLocale } = useLocale()

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.4rem]',
        className,
      )}
      role="group"
      aria-label={t('settings.language.aria')}
    >
      <span className="shrink-0 text-[0.84rem] font-semibold text-ink-soft">
        {t('settings.language')}
      </span>
      <div className="flex flex-wrap items-center gap-[0.35rem]">
        {LOCALES.map((item) => {
          const selected = item.code === locale
          return (
            <button
              key={item.code}
              type="button"
              aria-pressed={selected}
              title={item.nativeName}
              onClick={() => setLocale(item.code)}
              className={cn(
                'inline-flex items-center gap-[0.35rem] rounded-full border px-[0.65rem] py-[0.32rem]',
                'font-[inherit] text-[0.8rem] font-semibold tracking-[0.01em] transition-[background,color,border-color,transform] duration-160',
                'cursor-pointer active:scale-[0.98]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
                selected
                  ? 'border-ink/30 bg-ink text-on-ink'
                  : 'border-line bg-transparent text-ink hover:border-ink/25 hover:bg-ink/6',
              )}
            >
              <span aria-hidden="true" className="text-[0.95rem] leading-none">
                {item.flag}
              </span>
              {item.nativeName}
            </button>
          )
        })}
      </div>
    </div>
  )
}
