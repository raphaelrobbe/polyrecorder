import { Link } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { getLocale, t, type MessageKey } from '../lib/i18n'
import { LEGAL } from '../lib/legal'
import {
  PROCESSING_REGISTER,
  type ProcessingTreatmentId,
} from '../lib/processingRegister'
import { withContactLink } from './ContactLink'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpSection, HelpText } from './HelpSection'

type ProcessingRegisterPanelProps = {
  className?: string
}

const DATE_LOCALES = {
  fr: 'fr-FR',
  en: 'en-GB',
  de: 'de-DE',
  no: 'nb-NO',
  uk: 'uk-UA',
} as const

type TreatmentKeys = {
  ref: MessageKey
  name: MessageKey
  purpose: MessageKey
  subPurposes: MessageKey
  data: MessageKey
  retention: MessageKey
  subjects: MessageKey
  recipients: MessageKey
  security: MessageKey
  transfers: MessageKey
}

const TREATMENT_COPY: Record<ProcessingTreatmentId, TreatmentKeys> = {
  account: {
    ref: 'register.account.ref',
    name: 'register.account.name',
    purpose: 'register.account.purpose',
    subPurposes: 'register.account.subPurposes',
    data: 'register.account.data',
    retention: 'register.account.retention',
    subjects: 'register.account.subjects',
    recipients: 'register.account.recipients',
    security: 'register.account.security',
    transfers: 'register.account.transfers',
  },
  cloud: {
    ref: 'register.cloud.ref',
    name: 'register.cloud.name',
    purpose: 'register.cloud.purpose',
    subPurposes: 'register.cloud.subPurposes',
    data: 'register.cloud.data',
    retention: 'register.cloud.retention',
    subjects: 'register.cloud.subjects',
    recipients: 'register.cloud.recipients',
    security: 'register.cloud.security',
    transfers: 'register.cloud.transfers',
  },
  contact: {
    ref: 'register.contact.ref',
    name: 'register.contact.name',
    purpose: 'register.contact.purpose',
    subPurposes: 'register.contact.subPurposes',
    data: 'register.contact.data',
    retention: 'register.contact.retention',
    subjects: 'register.contact.subjects',
    recipients: 'register.contact.recipients',
    security: 'register.contact.security',
    transfers: 'register.contact.transfers',
  },
  logs: {
    ref: 'register.logs.ref',
    name: 'register.logs.name',
    purpose: 'register.logs.purpose',
    subPurposes: 'register.logs.subPurposes',
    data: 'register.logs.data',
    retention: 'register.logs.retention',
    subjects: 'register.logs.subjects',
    recipients: 'register.logs.recipients',
    security: 'register.logs.security',
    transfers: 'register.logs.transfers',
  },
}

function formatRegisterDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat(DATE_LOCALES[getLocale()], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function TreatmentFiche({ id }: { id: ProcessingTreatmentId }) {
  const copy = TREATMENT_COPY[id]
  return (
    <HelpSection title={`${t(copy.ref)} — ${t(copy.name)}`}>
      <HelpText>
        {t('register.fiche.created')}:{' '}
        {formatRegisterDate(PROCESSING_REGISTER.created)}
      </HelpText>
      <HelpText>
        {t('register.fiche.updated')}:{' '}
        {formatRegisterDate(PROCESSING_REGISTER.updated)}
      </HelpText>
      <HelpText>
        <strong className="font-semibold text-ink">
          {t('register.fiche.purpose')}
        </strong>
        {' — '}
        {t(copy.purpose)}
      </HelpText>
      <HelpText>{t(copy.subPurposes)}</HelpText>
      <HelpText>
        <strong className="font-semibold text-ink">
          {t('register.fiche.data')}
        </strong>
        {' — '}
        {t(copy.data)}
      </HelpText>
      <HelpText>
        <strong className="font-semibold text-ink">
          {t('register.fiche.retention')}
        </strong>
        {' — '}
        {t(copy.retention)}
      </HelpText>
      <HelpText>
        <strong className="font-semibold text-ink">
          {t('register.fiche.subjects')}
        </strong>
        {' — '}
        {t(copy.subjects)}
      </HelpText>
      <HelpText>
        <strong className="font-semibold text-ink">
          {t('register.fiche.recipients')}
        </strong>
        {' — '}
        {t(copy.recipients)}
      </HelpText>
      <HelpText>
        <strong className="font-semibold text-ink">
          {t('register.fiche.security')}
        </strong>
        {' — '}
        {t(copy.security)}
      </HelpText>
      <HelpText>
        <strong className="font-semibold text-ink">
          {t('register.fiche.transfers')}
        </strong>
        {' — '}
        {t(copy.transfers)}
      </HelpText>
      <HelpText>
        <strong className="font-semibold text-ink">
          {t('register.fiche.sensitive')}
        </strong>
        {' — '}
        {t('register.sensitive.no')}
      </HelpText>
    </HelpSection>
  )
}

export function ProcessingRegisterPanel({
  className,
}: ProcessingRegisterPanelProps) {
  useLocale()
  const created = formatRegisterDate(PROCESSING_REGISTER.created)
  const updated = formatRegisterDate(PROCESSING_REGISTER.updated)

  return (
    <DeckOverlayPanel
      title={t('register.title')}
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel={t('register.close')}
    >
      <HelpText>{t('register.intro')}</HelpText>
      <HelpText>{t('register.dates', { created, updated })}</HelpText>

      <HelpSection title={t('register.controller.title')}>
        <HelpText>
          {t('register.controller.body', {
            name: LEGAL.publisherName,
            address: LEGAL.address,
            site: LEGAL.siteName,
          })}
        </HelpText>
        <HelpText>{withContactLink(t('register.controller.contact'))}</HelpText>
        <HelpText>{t('register.controller.dpo')}</HelpText>
      </HelpSection>

      <HelpSection title={t('register.summary.title')}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-[0.78rem] leading-[1.4] text-ink-soft">
            <thead>
              <tr className="border-b border-ink/15 text-ink">
                <th className="py-2 pr-3 font-bold">
                  {t('register.summary.col.ref')}
                </th>
                <th className="py-2 pr-3 font-bold">
                  {t('register.summary.col.name')}
                </th>
                <th className="py-2 pr-3 font-bold">
                  {t('register.summary.col.purpose')}
                </th>
                <th className="py-2 font-bold">
                  {t('register.summary.col.sensitive')}
                </th>
              </tr>
            </thead>
            <tbody>
              {PROCESSING_REGISTER.treatmentIds.map((id) => {
                const copy = TREATMENT_COPY[id]
                return (
                  <tr key={id} className="border-b border-ink/8 align-top">
                    <td className="py-2.5 pr-3 tabular-nums text-ink">
                      {t(copy.ref)}
                    </td>
                    <td className="py-2.5 pr-3 text-ink">{t(copy.name)}</td>
                    <td className="py-2.5 pr-3">{t(copy.purpose)}</td>
                    <td className="py-2.5">{t('register.sensitive.no')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </HelpSection>

      {PROCESSING_REGISTER.treatmentIds.map((id) => (
        <TreatmentFiche key={id} id={id} />
      ))}

      <HelpText>
        {t('register.privacyLink')}{' '}
        <Link
          to="/privacy"
          className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
        >
          {t('nav.privacy')}
        </Link>{' '}
        {t('register.legalLink')}{' '}
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
