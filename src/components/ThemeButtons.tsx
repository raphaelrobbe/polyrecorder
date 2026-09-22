import { useLocale } from '../hooks/useLocale'
import { useTheme } from '../hooks/useTheme'
import { t } from '../lib/i18n'
import type { ThemePreference } from '../lib/theme'
import { cn } from '../lib/utils'
import { IconMoon, IconSun } from './icons'

type ThemeButtonsProps = {
  className?: string
}

const THEME_OPTIONS: {
  value: ThemePreference
  labelKey: 'settings.theme.system' | 'settings.theme.light' | 'settings.theme.dark'
  icon?: 'sun' | 'moon'
}[] = [
  { value: 'system', labelKey: 'settings.theme.system' },
  { value: 'light', labelKey: 'settings.theme.light', icon: 'sun' },
  { value: 'dark', labelKey: 'settings.theme.dark', icon: 'moon' },
]

/** Settings row: « Apparence : » + horizontal Auto / Light / Dark buttons. */
export function ThemeButtons({ className }: ThemeButtonsProps) {
  useLocale()
  const { preference, setPreference } = useTheme()

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-[0.55rem] gap-y-[0.4rem]',
        className,
      )}
      role="group"
      aria-label={t('settings.theme.aria')}
    >
      <span className="shrink-0 text-[0.84rem] font-semibold text-ink-soft">
        {t('settings.appearance')}
      </span>
      <div className="flex flex-wrap items-center gap-[0.35rem]">
        {THEME_OPTIONS.map((option) => {
          const selected = preference === option.value
          const label = t(option.labelKey)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              title={label}
              onClick={() => setPreference(option.value)}
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
              {option.icon === 'sun' ? (
                <IconSun className="size-[0.85rem]" />
              ) : option.icon === 'moon' ? (
                <IconMoon className="size-[0.85rem]" />
              ) : null}
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
