/**
 * Publisher / hosting identity for Mentions légales, privacy & terms pages.
 * Edit this file only when address, SIRET, contact, host, or terms date change.
 * When adding Stripe subscriptions: update CGU (/terms), privacy, and legal copy.
 */

import { getLocale, type Locale } from './i18n'

export const LEGAL = {
  siteName: 'PolyRecorder',
  siteUrl: 'https://polyrecorder.app',

  publisherName: 'Raphaël Robbe',
  publisherStatus: 'entrepreneur-individuel',
  address: '11 Grande Rue, 25160 Labergement-Sainte-Marie, France',
  siret: '10825818700013',
  publicationDirector: 'Raphaël Robbe',

  /** Privacy / RGPD contact — change if you use another mailbox. */
  contactEmail: 'contact@polyrecorder.app',

  host: {
    name: 'Scaleway S.A.S.',
    address: '8 rue de la Ville l’Évêque, 75008 Paris, France',
    /** Public company registry id (SIREN). */
    siren: '433115904',
  },

  sessionCookieName: '__polyrecorder_session',

  /** Bump when Terms of Use change (shown on /terms). ISO date YYYY-MM-DD. */
  termsEffectiveDate: '2026-09-24',
} as const

const DATE_LOCALES: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  de: 'de-DE',
  no: 'nb-NO',
}

/** Format LEGAL.termsEffectiveDate for the current (or given) UI locale. */
export function formatTermsEffectiveDate(
  locale: Locale = getLocale(),
): string {
  const [year, month, day] = LEGAL.termsEffectiveDate.split('-').map(Number)
  if (!year || !month || !day) return LEGAL.termsEffectiveDate
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat(DATE_LOCALES[locale], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
