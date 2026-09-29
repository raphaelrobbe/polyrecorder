import { Form, useNavigation, useRouteLoaderData } from '@remix-run/react'
import { useMemo, useState } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { useLocale } from '../hooks/useLocale'
import { isValidEmail } from '../lib/email'
import { t } from '../lib/i18n'
import type { loader as rootLoader } from '../root'
import { Button } from './Button'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { TurnstileWidget } from './TurnstileWidget.client'

export type ContactActionData =
  | { ok: true }
  | {
      ok: false
      reason:
        | 'invalid_email'
        | 'invalid_message'
        | 'captcha'
        | 'rate_limited'
        | 'send_failed'
    }

type ContactPanelProps = {
  className?: string
  turnstileSiteKey: string | null
  actionData?: ContactActionData
}

const fieldClass =
  'rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.95rem] font-medium text-ink outline-none focus-visible:border-ink/35 focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ink)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-70'

const MESSAGE_MAX = 4000

export function ContactPanel({
  className,
  turnstileSiteKey,
  actionData,
}: ContactPanelProps) {
  useLocale()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const navigation = useNavigation()
  const submitting = navigation.state === 'submitting'

  const [email, setEmail] = useState(user?.email ?? '')
  const [message, setMessage] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const emailLocked = Boolean(user?.email)
  const emailValue = emailLocked ? (user?.email ?? '') : email
  const emailOk = isValidEmail(emailValue)
  const messageOk = message.trim().length > 0 && message.trim().length <= MESSAGE_MAX
  const captchaOk = !turnstileSiteKey || Boolean(captchaToken)
  const canSubmit = emailOk && messageOk && captchaOk && !submitting

  const errorMessage = useMemo(() => {
    if (!actionData || actionData.ok) return null
    switch (actionData.reason) {
      case 'invalid_email':
        return t('contact.error.email')
      case 'invalid_message':
        return t('contact.error.message')
      case 'captcha':
        return t('contact.error.captcha')
      case 'rate_limited':
        return t('contact.error.rateLimited')
      default:
        return t('contact.error.send')
    }
  }, [actionData])

  const success = actionData?.ok === true

  return (
    <DeckOverlayPanel
      title={t('contact.title')}
      className={className}
      bodyClassName="flex flex-col gap-4"
      closeAriaLabel={t('contact.close')}
    >
      {success ? null : (
        <p className="m-0 -mt-2 mb-1 text-[0.92rem] leading-[1.45] text-ink-soft">
          {t('contact.lead')}
        </p>
      )}

      {success ? (
        <p
          className="m-0 rounded-xl border border-line bg-ink/4 px-3 py-3 text-[0.92rem] font-semibold text-ink"
          role="status"
        >
          {t('contact.success')}
        </p>
      ) : (
        <Form method="post" className="flex flex-col gap-4">
          {/* Honeypot — leave empty */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
          />

          <label className="flex flex-col gap-1.5 text-[0.84rem] font-semibold text-ink-soft">
            {t('contact.email')}
            <input
              type="email"
              name={emailLocked ? undefined : 'email'}
              required={!emailLocked}
              value={emailValue}
              disabled={emailLocked}
              readOnly={emailLocked}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              className={fieldClass}
              onChange={(event) => {
                if (emailLocked) return
                setEmail(event.target.value)
              }}
            />
            {emailLocked ? (
              <input type="hidden" name="email" value={emailValue} />
            ) : null}
          </label>

          <label className="flex flex-col gap-1.5 text-[0.84rem] font-semibold text-ink-soft">
            {t('contact.message')}
            <textarea
              name="message"
              required
              rows={6}
              maxLength={MESSAGE_MAX}
              value={message}
              className={`${fieldClass} min-h-[8rem] resize-y`}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          {turnstileSiteKey ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.84rem] font-semibold text-ink-soft">
                {t('contact.captcha')}
              </span>
              <ClientOnly fallback={<div className="min-h-[65px]" />}>
                {() => (
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    onToken={setCaptchaToken}
                  />
                )}
              </ClientOnly>
              <input
                type="hidden"
                name="cf-turnstile-response"
                value={captchaToken ?? ''}
              />
            </div>
          ) : null}

          {errorMessage ? (
            <p
              className="m-0 text-[0.85rem] font-semibold text-record"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="default"
            disabled={!canSubmit}
            className="bg-ink text-on-ink"
          >
            {submitting ? t('contact.sending') : t('contact.submit')}
          </Button>
        </Form>
      )}
    </DeckOverlayPanel>
  )
}
