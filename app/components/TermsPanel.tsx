import { Link } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { LEGAL, formatTermsEffectiveDate } from '../lib/legal'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpSection, HelpText } from './HelpSection'

type TermsPanelProps = {
  className?: string
}

export function TermsPanel({ className }: TermsPanelProps) {
  useLocale()

  return (
    <DeckOverlayPanel
      title={t('terms.title')}
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel={t('terms.close')}
    >
      <HelpText>
        {t('terms.effective', { date: formatTermsEffectiveDate() })}
      </HelpText>

      <HelpSection title={t('terms.object.title')}>
        <HelpText>
          {t('terms.object.body', {
            site: LEGAL.siteName,
            name: LEGAL.publisherName,
          })}
        </HelpText>
      </HelpSection>

      <HelpSection title={t('terms.acceptance.title')}>
        <HelpText>{t('terms.acceptance.body')}</HelpText>
      </HelpSection>

      <HelpSection title={t('terms.service.title')}>
        <HelpText>{t('terms.service.guest')}</HelpText>
        <HelpText>{t('terms.service.account')}</HelpText>
        <HelpText>{t('terms.service.free')}</HelpText>
        <HelpText>{t('terms.service.futurePaid')}</HelpText>
      </HelpSection>

      <HelpSection title={t('terms.account.title')}>
        <HelpText>{t('terms.account.body')}</HelpText>
      </HelpSection>

      <HelpSection title={t('terms.content.title')}>
        <HelpText>{t('terms.content.ownership')}</HelpText>
        <HelpText>{t('terms.content.license')}</HelpText>
        <HelpText>{t('terms.content.responsibility')}</HelpText>
      </HelpSection>

      <HelpSection title={t('terms.use.title')}>
        <HelpText>{t('terms.use.body')}</HelpText>
      </HelpSection>

      <HelpSection title={t('terms.availability.title')}>
        <HelpText>{t('terms.availability.body')}</HelpText>
      </HelpSection>

      <HelpSection title={t('terms.liability.title')}>
        <HelpText>{t('terms.liability.body')}</HelpText>
      </HelpSection>

      <HelpSection title={t('terms.privacy.title')}>
        <HelpText>
          {t('terms.privacy.body')}{' '}
          <Link
            to="/privacy"
            className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
          >
            {t('nav.privacy')}
          </Link>
          .
        </HelpText>
      </HelpSection>

      <HelpSection title={t('terms.changes.title')}>
        <HelpText>{t('terms.changes.body')}</HelpText>
      </HelpSection>

      <HelpSection title={t('terms.law.title')}>
        <HelpText>
          {t('terms.law.body', { email: LEGAL.contactEmail })}
        </HelpText>
      </HelpSection>

      <HelpText>
        {t('terms.legalLink')}{' '}
        <Link
          to="/legal"
          className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
        >
          {t('nav.legal')}
        </Link>
        .
      </HelpText>
    </DeckOverlayPanel>
  )
}
