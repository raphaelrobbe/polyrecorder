import { Link } from '@remix-run/react'
import type { ReactNode } from 'react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'

const contactLinkClass =
  'text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink'

/** Inline link to the contact form (replaces a plain email address in legal copy). */
export function ContactLink({ className }: { className?: string }) {
  useLocale()
  return (
    <Link to="/contact" className={cn(contactLinkClass, className)}>
      {t('contact.formLink')}
    </Link>
  )
}

/**
 * Split a translated string on `{email}` and insert {@link ContactLink}
 * (keeps legal wording while hiding the raw address).
 */
export function withContactLink(template: string): ReactNode[] {
  const parts = template.split('{email}')
  return parts.flatMap((part, index) =>
    index < parts.length - 1
      ? [part, <ContactLink key={`contact-${index}`} />]
      : [part],
  )
}
