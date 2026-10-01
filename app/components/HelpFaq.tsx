import { useState, type ReactNode } from 'react'
import { Link } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t, type MessageKey } from '../lib/i18n'
import { cn } from '../lib/utils'
import { HelpSection, HelpText } from './HelpSection'
import { DeckModePill } from './ModeTools'
import { IconCollaborate, IconChevron, IconGlobe, IconShare } from './icons'

export const HELP_FAQ_IDS = [
  'accountNeeded',
  'guestKeepTakes',
  'guestLost',
  'headphones',
  'modes',
  'clipping',
  'metronome',
  'piano',
  'skew',
  'storage',
  'libraryWhere',
  'share',
  'browsers',
  'sizeLimit',
  'deleteAccount',
  'pwa',
  'installable',
  'accountStats',
] as const

type FaqId = (typeof HELP_FAQ_IDS)[number]

function faqQuestionKey(id: FaqId): MessageKey {
  return `help.faq.${id}.q` as MessageKey
}

function faqSearchText(id: FaqId): string {
  const q = t(faqQuestionKey(id))
  if (id === 'skew') {
    return `${q}\n${t('help.faq.skew.a1')}\n${t('help.faq.skew.a2')}`
  }
  if (id === 'share') {
    return `${q}\n${t('help.faq.share.a1')}\n${t('help.faq.share.a2')}\n${t('help.faq.share.a3')}\n${t('help.faq.share.a4')}`
  }
  return `${q}\n${t(`help.faq.${id}.a` as MessageKey)}`
}

function FaqInlineIcon({ children }: { children: ReactNode }) {
  return (
    <span className="mx-[0.12rem] inline-flex translate-y-[0.18rem] items-center align-baseline text-ink [&_svg]:size-[1.05rem]">
      {children}
    </span>
  )
}

function FaqAnswer({ id }: { id: FaqId }) {
  if (id === 'skew') {
    return (
      <HelpText>
        {t('help.faq.skew.a1')}{' '}
        <DeckModePill mode="align" size="sm" className="mx-[0.15rem] align-middle" />{' '}
        {t('help.faq.skew.a2')}
      </HelpText>
    )
  }
  if (id === 'share') {
    return (
      <HelpText>
        {t('help.faq.share.a1')}
        <FaqInlineIcon>
          <IconGlobe />
        </FaqInlineIcon>
        {t('help.faq.share.a2')}
        <FaqInlineIcon>
          <IconShare />
        </FaqInlineIcon>
        {t('help.faq.share.a3')}
        <FaqInlineIcon>
          <IconCollaborate />
        </FaqInlineIcon>
        {t('help.faq.share.a4')}
      </HelpText>
    )
  }
  return <HelpText>{t(`help.faq.${id}.a` as MessageKey)}</HelpText>
}

/** Whether any FAQ entry matches the query (empty query → true). */
export function helpFaqMatchesQuery(query: string): boolean {
  const qNorm = query.trim().toLowerCase()
  if (!qNorm) return true
  return HELP_FAQ_IDS.some((id) => faqSearchText(id).toLowerCase().includes(qNorm))
}

/** FAQ accordions at the bottom of /aide (several may stay open). */
export function HelpFaq({
  className,
  filterQuery = '',
}: {
  className?: string
  /** Case-insensitive filter over question + answer text. */
  filterQuery?: string
}) {
  useLocale()
  const [openIds, setOpenIds] = useState<Set<FaqId>>(() => new Set())
  const qNorm = filterQuery.trim().toLowerCase()

  const toggle = (id: FaqId) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const visibleIds = HELP_FAQ_IDS.filter((id) => {
    if (!qNorm) return true
    return faqSearchText(id).toLowerCase().includes(qNorm)
  })

  if (visibleIds.length === 0) return null

  return (
    <HelpSection
      id="help-faq"
      title={t('help.faq.title')}
      className={className}
    >
      <ul className="m-0 flex list-none flex-col gap-[0.45rem] p-0">
        {visibleIds.map((id) => {
          const open = openIds.has(id) || Boolean(qNorm)
          const panelId = `help-faq-${id}`
          return (
            <li
              key={id}
              className="overflow-hidden rounded-[12px] border border-ink/12 bg-ink/[0.03]"
            >
              <button
                type="button"
                className={cn(
                  'flex w-full cursor-pointer items-start gap-[0.55rem] border-0 bg-transparent px-[0.85rem] py-[0.7rem] text-left font-[inherit]',
                  'text-[0.88rem] font-semibold leading-[1.35] text-ink',
                  'hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-[-2px]',
                )}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(id)}
              >
                <IconChevron
                  className={cn(
                    'mt-[0.15rem] size-[0.95rem] shrink-0 text-ink-soft transition-transform duration-150',
                    open ? 'rotate-0' : '-rotate-90',
                  )}
                />
                <span className="min-w-0 flex-1">{t(faqQuestionKey(id))}</span>
              </button>
              <div
                id={panelId}
                hidden={!open}
                className="px-[0.85rem] pb-[0.75rem] pl-[2.35rem]"
              >
                <FaqAnswer id={id} />
                {id === 'deleteAccount' ? (
                  <p className="mt-[0.55rem] mb-0 text-[0.84rem] leading-[1.45] text-ink-soft">
                    <Link
                      to="/privacy"
                      className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
                    >
                      {t('help.faq.deleteAccount.privacy')}
                    </Link>
                    {' · '}
                    <Link
                      to="/terms"
                      className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
                    >
                      {t('help.faq.deleteAccount.terms')}
                    </Link>
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </HelpSection>
  )
}
