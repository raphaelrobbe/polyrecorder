import { useNavigate } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { IconHelp, IconSettings } from './icons'
import { LocaleSelect } from './LocaleSelect'
import { ThemeToggle } from './ThemeToggle'

type ModeRowProps = {
  className?: string
}

/** Footer utilities (locale, theme, aide, paramètres). */
export function ModeRow({ className }: ModeRowProps) {
  useLocale()
  const navigate = useNavigate()

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
        onClick={() => navigate('/aide')}
      >
        {t('nav.help')}
      </Button>
      <Button
        variant="utility"
        icon={<IconSettings />}
        aria-label={t('nav.settings')}
        title={t('nav.settings')}
        onClick={() => navigate('/parametres')}
      >
        {t('nav.settings')}
      </Button>
    </div>
  )
}
