import { Link, useRouteLoaderData } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { libraryUserPath } from '../lib/libraryPaths'
import { t } from '../lib/i18n'
import type { loader as rootLoader } from '../root'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpSection } from './HelpSection'

type SitemapPanelProps = {
  className?: string
}

const linkClass =
  'text-ink no-underline hover:underline hover:underline-offset-2'

function SitemapLink({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link to={to} className={linkClass}>
        {label}
      </Link>
    </li>
  )
}

export function SitemapPanel({ className }: SitemapPanelProps) {
  useLocale()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const libraryTo = user ? libraryUserPath(user.pseudo) : '/bibliotheque'

  return (
    <DeckOverlayPanel
      title={t('sitemap.title')}
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel={t('sitemap.close')}
    >
      <HelpSection title={t('sitemap.app.title')}>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[0.84rem] leading-[1.45] text-ink-soft">
          <SitemapLink to="/" label={t('sitemap.app.home')} />
          <SitemapLink to={libraryTo} label={t('nav.library')} />
          <SitemapLink to="/aide" label={t('nav.help')} />
          <SitemapLink to="/parametres" label={t('nav.settings')} />
        </ul>
      </HelpSection>

      <HelpSection title={t('sitemap.account.title')}>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[0.84rem] leading-[1.45] text-ink-soft">
          <SitemapLink to="/connexion" label={t('nav.signIn')} />
          <SitemapLink to="/compte" label={t('nav.accountSettings')} />
        </ul>
      </HelpSection>

      <HelpSection title={t('sitemap.legal.title')}>
        <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[0.84rem] leading-[1.45] text-ink-soft">
          <SitemapLink to="/legal" label={t('nav.legal')} />
          <SitemapLink to="/privacy" label={t('nav.privacy')} />
          <SitemapLink to="/terms" label={t('nav.terms')} />
          <SitemapLink to="/contact" label={t('nav.contact')} />
          <SitemapLink to="/sitemap" label={t('nav.sitemap')} />
        </ul>
      </HelpSection>
    </DeckOverlayPanel>
  )
}
