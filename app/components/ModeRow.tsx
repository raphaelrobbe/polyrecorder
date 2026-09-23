import { useNavigate, useRouteLoaderData } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import type { loader as rootLoader } from '../root'
import { AccountMenu } from './AccountMenu'
import { Button } from './Button'
import { IconHelp, IconSettings } from './icons'
import { LocaleSelect } from './LocaleSelect'
import { ThemeToggle } from './ThemeToggle'

type ModeRowProps = {
  className?: string
}

/** Footer utilities (locale, theme, aide, paramètres) + account row below. */
export function ModeRow({ className }: ModeRowProps) {
  useLocale()
  const navigate = useNavigate()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null

  return (
    <div
      className={cn(
        'mt-[0.35rem] flex flex-col items-end gap-[0.35rem]',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-end gap-[0.35rem]">
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
      {user ? (
        <AccountMenu user={user} />
      ) : (
        <Button
          variant="utility"
          aria-label={t('nav.signIn')}
          title={t('nav.signIn')}
          onClick={() => navigate('/connexion')}
        >
          {t('nav.signIn')}
        </Button>
      )}
    </div>
  )
}
