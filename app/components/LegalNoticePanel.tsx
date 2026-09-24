import { Link } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { LEGAL } from '../lib/legal'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpSection, HelpText } from './HelpSection'

type LegalNoticePanelProps = {
  className?: string
}

export function LegalNoticePanel({ className }: LegalNoticePanelProps) {
  useLocale()

  return (
    <DeckOverlayPanel
      title={t('legal.title')}
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel={t('legal.close')}
    >
      <HelpSection title={t('legal.publisher.title')}>
        <HelpText>
          {t('legal.publisher.intro', {
            name: LEGAL.publisherName,
            status: t('legal.publisher.status.ei'),
          })}
        </HelpText>
        <HelpText>{LEGAL.address}</HelpText>
        <HelpText>
          {t('legal.publisher.siret', { siret: LEGAL.siret })}
        </HelpText>
        <HelpText>
          {t('legal.publicationDirector', {
            name: LEGAL.publicationDirector,
          })}
        </HelpText>
        <HelpText>
          {t('legal.contact', { email: LEGAL.contactEmail })}
        </HelpText>
      </HelpSection>

      <HelpSection title={t('legal.host.title')}>
        <HelpText>
          {t('legal.host.intro', {
            name: LEGAL.host.name,
            address: LEGAL.host.address,
            siren: LEGAL.host.siren,
          })}
        </HelpText>
        <HelpText>{t('legal.host.location')}</HelpText>
      </HelpSection>

      <HelpSection title={t('legal.ip.title')}>
        <HelpText>
          {t('legal.ip.intro', { site: LEGAL.siteName })}
        </HelpText>
        <HelpText>{t('legal.ip.reproduction')}</HelpText>
      </HelpSection>

      <HelpText>
        {t('legal.privacyLink')}{' '}
        <Link
          to="/privacy"
          className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
        >
          {t('nav.privacy')}
        </Link>
        .
      </HelpText>
      <HelpText>
        {t('legal.termsLink')}{' '}
        <Link
          to="/terms"
          className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
        >
          {t('nav.terms')}
        </Link>
        .
      </HelpText>
    </DeckOverlayPanel>
  )
}
