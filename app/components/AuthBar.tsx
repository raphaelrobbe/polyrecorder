import { useNavigate, useRouteLoaderData } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import type { loader as rootLoader } from '../root'
import { AccountMenu } from './AccountMenu'
import { Button } from './Button'

type AuthBarProps = {
  className?: string
}

/** Top-left sign-in / account menu, stuck to the top of the page column. */
export function AuthBar({ className }: AuthBarProps) {
  useLocale()
  const navigate = useNavigate()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null

  return (
    <div
      className={cn(
        'flex w-full items-center justify-start self-start',
        className,
      )}
    >
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
