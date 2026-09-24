import { Link } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { LEGAL } from '../lib/legal'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpSection, HelpText } from './HelpSection'

type PrivacyPanelProps = {
  className?: string
}

export function PrivacyPanel({ className }: PrivacyPanelProps) {
  useLocale()

  return (
    <DeckOverlayPanel
      title={t('privacy.title')}
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel={t('privacy.close')}
    >
      <HelpSection title={t('privacy.controller.title')}>
        <HelpText>
          {t('privacy.controller.body', {
            name: LEGAL.publisherName,
            address: LEGAL.address,
            email: LEGAL.contactEmail,
            site: LEGAL.siteName,
          })}
        </HelpText>
      </HelpSection>

      <HelpSection title={t('privacy.data.title')}>
        <HelpText>{t('privacy.data.account')}</HelpText>
        <HelpText>{t('privacy.data.cloud')}</HelpText>
        <HelpText>{t('privacy.data.technical')}</HelpText>
      </HelpSection>

      <HelpSection title={t('privacy.purposes.title')}>
        <HelpText>{t('privacy.purposes.body')}</HelpText>
      </HelpSection>

      <HelpSection title={t('privacy.processors.title')}>
        <HelpText>
          {t('privacy.processors.body', {
            host: LEGAL.host.name,
          })}
        </HelpText>
      </HelpSection>

      <HelpSection title={t('privacy.retention.title')}>
        <HelpText>{t('privacy.retention.body')}</HelpText>
      </HelpSection>

      <HelpSection title={t('privacy.rights.title')}>
        <HelpText>
          {t('privacy.rights.body', { email: LEGAL.contactEmail })}
        </HelpText>
      </HelpSection>

      <HelpSection title={t('privacy.cookies.title')}>
        <HelpText>{t('privacy.cookies.guest')}</HelpText>
        <HelpText>
          {t('privacy.cookies.signedIn', {
            cookie: LEGAL.sessionCookieName,
          })}
        </HelpText>
        <HelpText>{t('privacy.cookies.localStorage')}</HelpText>
      </HelpSection>

      <HelpText>
        {t('privacy.legalLink')}{' '}
        <Link
          to="/legal"
          className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
        >
          {t('nav.legal')}
        </Link>{' '}
        {t('privacy.termsLink')}{' '}
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
