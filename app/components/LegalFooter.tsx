import { useNavigate } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'

type LegalFooterProps = {
  className?: string
}

const linkClass =
  'm-0 cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-inherit no-underline hover:underline hover:underline-offset-2'

/** Page-bottom centered legal links. */
export function LegalFooter({ className }: LegalFooterProps) {
  useLocale()
  const navigate = useNavigate()

  return (
    <nav
      aria-label={t('nav.legal')}
      className={cn(
        'mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.78rem] text-ink-soft',
        className,
      )}
    >
      <button
        type="button"
        className={linkClass}
        onClick={() => navigate('/legal')}
      >
        {t('nav.legal')}
      </button>
      <button
        type="button"
        className={linkClass}
        onClick={() => navigate('/privacy')}
      >
        {t('nav.privacy')}
      </button>
      <button
        type="button"
        className={linkClass}
        onClick={() => navigate('/terms')}
      >
        {t('nav.terms')}
      </button>
      <button
        type="button"
        className={linkClass}
        onClick={() => navigate('/sitemap')}
      >
        {t('nav.sitemap')}
      </button>
    </nav>
  )
}
