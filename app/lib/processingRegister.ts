/**
 * GDPR processing-activities register metadata (Art. 30).
 * Narrative copy lives in i18n (`register.*`).
 */

export const PROCESSING_REGISTER = {
  /** ISO date YYYY-MM-DD — first publication of this register. */
  created: '2026-09-30',
  /** ISO date YYYY-MM-DD — last update of this register. */
  updated: '2026-09-30',
  treatmentIds: ['account', 'cloud', 'contact', 'logs'] as const,
} as const

export type ProcessingTreatmentId =
  (typeof PROCESSING_REGISTER.treatmentIds)[number]
