import { useState } from 'react'
import { Link } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t, type MessageKey } from '../lib/i18n'
import { cn } from '../lib/utils'
import { HelpSection, HelpText } from './HelpSection'
import { IconChevron } from './icons'

export const HELP_FAQ_IDS = [
  'accountNeeded',
  'guestKeepTakes',
  'guestLost',
  'headphones',
  'modes',
  'metronome',
  'piano',
  'skew',
  'countInVsAlign',
  'import',
  'storage',
  'libraryWhere',
  'share',
  'collab',
  'browsers',
  'sizeLimit',
  'deleteAccount',
  'pwa',
  'accountStats',
] as const

type FaqId = (typeof HELP_FAQ_IDS)[number]

function faqKeys(id: FaqId): { q: MessageKey; a: MessageKey } {
  return {
    q: `help.faq.${id}.q` as MessageKey,
    a: `help.faq.${id}.a` as MessageKey,
  }
}

/** FAQ accordions at the bottom of /aide (several may stay open). */
export function HelpFaq({ className }: { className?: string }) {
  useLocale()
  const [openIds, setOpenIds] = useState<Set<FaqId>>(() => new Set())

  const toggle = (id: FaqId) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <HelpSection
      id="help-faq"
      title={t('help.faq.title')}
      className={className}
    >
      <ul className="m-0 flex list-none flex-col gap-[0.45rem] p-0">
        {HELP_FAQ_IDS.map((id) => {
          const { q, a } = faqKeys(id)
          const open = openIds.has(id)
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
                <span className="min-w-0 flex-1">{t(q)}</span>
              </button>
              <div id={panelId} hidden={!open} className="px-[0.85rem] pb-[0.75rem] pl-[2.35rem]">
                <HelpText>{t(a)}</HelpText>
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
