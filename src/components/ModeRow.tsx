import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useDeckStore } from '../store/deckStore'
import { Button } from './Button'
import { IconHelp, IconSettings } from './icons'
import { LocaleSelect } from './LocaleSelect'
import { ThemeToggle } from './ThemeToggle'

type ModeRowProps = {
  className?: string
}

/** Footer utilities (locale, theme, aide, paramètres). Mode toggles live in the deck. */
export function ModeRow({ className }: ModeRowProps) {
  useLocale()
  const openDeckPanel = useDeckStore((s) => s.openDeckPanel)

  return (
    <div
      className={cn(
        'mt-[0.35rem] flex items-center justify-end gap-[0.35rem]',
        className,
      )}
    >
      <LocaleSelect />
      <ThemeToggle />
      <Button
        variant="utility"
        icon={<IconHelp />}
        aria-label={t('nav.help')}
        title={t('nav.help')}
        onClick={() => openDeckPanel('help')}
      >
        {t('nav.help')}
      </Button>
      <Button
        variant="utility"
        icon={<IconSettings />}
        aria-label={t('nav.settings')}
        title={t('nav.settings')}
        onClick={() => openDeckPanel('settings')}
      >
        {t('nav.settings')}
      </Button>
    </div>
  )
}
