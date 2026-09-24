import {
  Form,
  useActionData,
  useFetcher,
  useNavigation,
} from '@remix-run/react'
import { useEffect, useState } from 'react'
import type { User } from '~/common/user'
import { useLocale } from '~/hooks/useLocale'
import { t } from '~/lib/i18n'
import { Button } from './Button'
import { DeckOverlayPanel } from './DeckOverlayPanel'

type AccountPanelProps = {
  user: User
  className?: string
}

type AccountActionData =
  | {
      ok: true
      intent: 'save'
      user: User
      emailChangePending?: boolean
      previewLink?: string
    }
  | { ok: false; intent: 'save' | 'delete'; reason: string }

type PseudoCheckData = {
  available: boolean
  pseudo: string
  reason:
    | 'empty'
    | 'too_short'
    | 'too_long'
    | 'invalid_chars'
    | 'taken'
    | 'ok'
    | 'unchanged'
    | 'unauthorized'
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

/** Account settings overlay: profile + discreet delete. */
export function AccountPanel({ user, className }: AccountPanelProps) {
  useLocale()
  const actionData = useActionData<AccountActionData>()
  const navigation = useNavigation()
  const pseudoFetcher = useFetcher<PseudoCheckData>()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [email, setEmail] = useState(user.email)
  const [pseudo, setPseudo] = useState(user.pseudo)
  const [emailFocused, setEmailFocused] = useState(false)
  const [pseudoFocused, setPseudoFocused] = useState(false)

  const intent =
    navigation.state === 'submitting'
      ? String(navigation.formData?.get('intent') ?? '')
      : null
  const saving = intent === 'save'
  const deleting = intent === 'delete'

  useEffect(() => {
    if (actionData?.ok === false && actionData.intent === 'delete') {
      setConfirmDelete(true)
    }
  }, [actionData])

  useEffect(() => {
    if (actionData?.ok === true && actionData.intent === 'save') {
      setPseudo(actionData.user.pseudo)
      if (!actionData.emailChangePending) {
        setEmail(actionData.user.email)
      }
    }
  }, [actionData])

  useEffect(() => {
    setPseudo(user.pseudo)
  }, [user.pseudo])

  useEffect(() => {
    const pending =
      actionData?.ok === true &&
      actionData.intent === 'save' &&
      actionData.emailChangePending
    if (!pending) setEmail(user.email)
  }, [user.email, actionData])

  // Live uniqueness check once the typed value has at least 3 characters.
  useEffect(() => {
    const trimmed = pseudo.trim().replace(/\s+/g, ' ')
    if (trimmed.length < 3) return

    const handle = window.setTimeout(() => {
      const params = new URLSearchParams({ pseudo: trimmed })
      pseudoFetcher.load(`/api/pseudo?${params}`)
    }, 280)

    return () => window.clearTimeout(handle)
  }, [pseudo])

  const trimmedLive = pseudo.trim().replace(/\s+/g, ' ')
  const storedPseudo = user.pseudo.trim().replace(/\s+/g, ' ')
  const emailLive = email.trim().toLowerCase()
  const emailUnchanged = emailLive === user.email
  const pseudoUnchanged = trimmedLive === storedPseudo
  const unchanged = emailUnchanged && pseudoUnchanged

  const emailInvalid = emailLive.length > 0 && !looksLikeEmail(emailLive)
  const liveEmpty = trimmedLive.length === 0
  const liveHasAt = trimmedLive.includes('@')
  const liveTooShort =
    trimmedLive.length > 0 && trimmedLive.length < 3 && !liveHasAt
  const liveTooLong = trimmedLive.length > 40
  const check = pseudoFetcher.data
  const checkMatches =
    check != null &&
    check.pseudo.toLowerCase() === trimmedLive.toLowerCase()
  const checking =
    trimmedLive.length >= 3 &&
    !liveTooLong &&
    !liveHasAt &&
    !pseudoUnchanged &&
    (pseudoFetcher.state === 'loading' || !checkMatches)

  const matchesCurrent =
    storedPseudo.length >= 3 &&
    trimmedLive.length >= 3 &&
    trimmedLive.toLowerCase() === storedPseudo.toLowerCase()

  const liveTaken =
    !matchesCurrent && checkMatches && check.reason === 'taken' && !checking

  const liveOk =
    !matchesCurrent &&
    checkMatches &&
    check.available &&
    check.reason === 'ok' &&
    !checking

  const liveCurrent = matchesCurrent

  const saveBlocked =
    unchanged ||
    emailInvalid ||
    emailLive.length === 0 ||
    liveEmpty ||
    liveHasAt ||
    liveTooShort ||
    liveTooLong ||
    liveTaken ||
    (!matchesCurrent && trimmedLive.length >= 3 && !liveHasAt && checking)

  const saveError =
    actionData && actionData.ok === false && actionData.intent === 'save'
      ? actionData.reason === 'too_short'
        ? t('account.error.pseudoTooShort')
        : actionData.reason === 'too_long'
          ? t('account.error.pseudoTooLong')
          : actionData.reason === 'invalid_chars'
            ? t('account.error.pseudoInvalidChars')
            : actionData.reason === 'taken'
              ? t('account.error.pseudoTaken')
              : actionData.reason === 'invalid_email'
                ? t('account.error.invalidEmail')
                : actionData.reason === 'email_taken'
                  ? t('account.error.emailTaken')
                  : actionData.reason === 'rate_limited'
                    ? t('account.error.emailRateLimited')
                    : actionData.reason === 'email_failed'
                      ? t('account.error.emailFailed')
                      : t('account.error.saveFailed')
      : null

  const deleteError =
    actionData && actionData.ok === false && actionData.intent === 'delete'
      ? t('account.delete.error')
      : null

  const saved =
    actionData?.ok === true &&
    actionData.intent === 'save' &&
    !actionData.emailChangePending
  const emailPending =
    actionData?.ok === true &&
    actionData.intent === 'save' &&
    actionData.emailChangePending
  const previewLink =
    actionData?.ok === true && actionData.intent === 'save'
      ? actionData.previewLink
      : undefined

  const sideStatus =
    liveTooShort || liveTooLong
      ? null
      : checking
        ? null
        : liveTaken
          ? ('unavailable' as const)
          : liveCurrent
            ? ('current' as const)
            : liveOk
              ? ('available' as const)
              : null

  return (
    <DeckOverlayPanel
      title={t('account.title')}
      className={className}
      bodyClassName="flex min-h-[16rem] max-w-[36rem] flex-col gap-[1.15rem]"
      closeAriaLabel={t('account.close')}
    >
      <Form method="post" className="flex flex-col gap-4">
        <input type="hidden" name="intent" value="save" />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="account-email"
            className="text-[0.84rem] font-semibold text-ink-soft"
          >
            {t('account.email')}
          </label>
          <input
            id="account-email"
            type="email"
            name="email"
            value={email}
            autoComplete="email"
            required
            aria-invalid={emailFocused && emailInvalid ? true : undefined}
            aria-describedby={emailFocused ? 'account-email-hint' : undefined}
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-[0.95rem] font-medium text-ink outline-none focus-visible:border-ink/35 focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ink)_12%,transparent)]"
            onChange={(event) => setEmail(event.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
          />
          {emailFocused ? (
            <span
              id="account-email-hint"
              className="text-[0.78rem] font-medium text-ink-soft"
            >
              {t('account.email.hint')}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="account-pseudo"
            className="text-[0.84rem] font-semibold text-ink-soft"
          >
            {t('account.pseudo')}
          </label>
          <div className="flex items-center gap-2.5">
            <div className="relative min-w-0 flex-1">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.95rem] font-medium text-ink-soft"
              >
                @
              </span>
              <input
                id="account-pseudo"
                type="text"
                name="pseudo"
                value={pseudo}
                maxLength={40}
                autoComplete="nickname"
                placeholder={t('account.pseudoPlaceholder')}
                aria-invalid={
                  pseudoFocused &&
                  (liveEmpty ||
                    liveHasAt ||
                    liveTooShort ||
                    liveTooLong ||
                    liveTaken)
                    ? true
                    : undefined
                }
                aria-describedby={
                  !user.pseudoCustomizedAt || pseudoFocused
                    ? 'account-pseudo-hint'
                    : undefined
                }
                className="w-full rounded-xl border border-line bg-surface py-2.5 pl-7 pr-3 text-[0.95rem] font-medium text-ink outline-none focus-visible:border-ink/35 focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ink)_12%,transparent)]"
                onChange={(event) => setPseudo(event.target.value)}
                onFocus={() => setPseudoFocused(true)}
                onBlur={() => setPseudoFocused(false)}
              />
            </div>
            {sideStatus === 'unavailable' ? (
              <span
                role="status"
                className="shrink-0 text-[0.78rem] font-semibold text-record/75"
              >
                {t('account.pseudo.unavailable')}
              </span>
            ) : sideStatus === 'current' ? (
              <span
                role="status"
                className="shrink-0 text-[0.78rem] font-semibold text-ink-soft"
              >
                {t('account.pseudo.current')}
              </span>
            ) : sideStatus === 'available' ? (
              <span
                role="status"
                className="shrink-0 text-[0.78rem] font-semibold text-volume"
              >
                {t('account.pseudo.available')}
              </span>
            ) : null}
          </div>
          {!user.pseudoCustomizedAt ? (
            <p
              id="account-pseudo-hint"
              className="m-0 text-[0.82rem] leading-[1.4] text-ink-soft"
            >
              {t('account.pseudo.customizeHint')}
            </p>
          ) : pseudoFocused ? (
            <span
              id="account-pseudo-hint"
              className="text-[0.78rem] font-medium text-ink-soft"
            >
              {t('account.pseudo.lengthHint')}
            </span>
          ) : null}
        </div>
        {saveError ? (
          <p className="m-0 text-[0.85rem] font-semibold text-record" role="alert">
            {saveError}
          </p>
        ) : null}
        {saved ? (
          <p className="m-0 text-[0.85rem] font-semibold text-ink-soft" role="status">
            {t('account.saved')}
          </p>
        ) : null}
        {emailPending ? (
          <div className="flex flex-col gap-2" role="status">
            <p className="m-0 text-[0.85rem] font-semibold text-ink-soft">
              {t('account.email.pending', { email: emailLive })}
            </p>
            {previewLink ? (
              <Button
                type="button"
                variant="trim"
                className="self-start"
                onClick={() => {
                  window.location.href = previewLink
                }}
              >
                {t('account.email.openConfirmLink')}
              </Button>
            ) : null}
          </div>
        ) : null}
        <Button
          type="submit"
          variant="default"
          disabled={saving || deleting || saveBlocked}
          className="self-start bg-ink text-on-ink"
        >
          {saving ? t('account.saving') : t('account.save')}
        </Button>
      </Form>

      <div className="mt-auto flex w-full flex-col items-end gap-2 pt-4">
        <button
          type="button"
          disabled={saving || deleting}
          aria-expanded={confirmDelete}
          className="m-0 cursor-pointer rounded-md border-0 bg-transparent px-1 py-0.5 font-[inherit] text-[0.8rem] font-semibold text-ink-soft underline-offset-2 transition-colors hover:enabled:text-ink hover:enabled:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => setConfirmDelete(true)}
        >
          {t('account.delete.button')}
        </button>
        {confirmDelete ? (
          <section
            className="w-full rounded-[16px] border border-record/30 bg-record/6 px-4 py-4 text-left"
            aria-label={t('account.delete.button')}
          >
            <p className="m-0 text-[0.85rem] leading-[1.45] text-record-deep">
              {t('account.delete.confirmBody')}
            </p>
            {deleteError ? (
              <p
                className="mt-2 mb-0 text-[0.85rem] font-semibold text-record"
                role="alert"
              >
                {deleteError}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Form method="post">
                <input type="hidden" name="intent" value="delete" />
                <Button
                  type="submit"
                  variant="trim"
                  disabled={saving || deleting}
                  className="border-record/50 bg-record/12 text-record-deep hover:enabled:border-record hover:enabled:bg-record/18"
                >
                  {deleting
                    ? t('account.delete.deleting')
                    : t('account.delete.confirm')}
                </Button>
              </Form>
              <Button
                type="button"
                variant="trim"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                {t('account.delete.cancel')}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </DeckOverlayPanel>
  )
}
