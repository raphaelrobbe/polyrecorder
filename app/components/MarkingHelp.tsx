import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { useSessionStore } from '../store/sessionStore'
import { cn } from '../lib/utils'

type MarkingHelpProps = {
  className?: string
}

export function MarkingHelp({ className }: MarkingHelpProps) {
  useLocale()
  const markingOpen = useSessionStore((s) => s.markingOpen)
  const patch = useSessionStore((s) => s.patch)

  return (
    <div
      className={cn(
        'relative mt-[0.35rem] overflow-hidden rounded-[18px] border border-ink/16 bg-transparent p-0 text-[0.82rem] leading-[1.4] text-ink-soft',
        className,
      )}
    >
      <button
        type="button"
        className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-none border-0 bg-transparent px-[1.05rem] py-[0.85rem] text-left font-[inherit] text-inherit hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:-outline-offset-2"
        data-marking-accordion
        aria-expanded={markingOpen}
        aria-controls="marking-help-panel"
        onClick={() => patch({ markingOpen: !markingOpen })}
      >
        <span className="min-w-0 flex-auto text-[0.9rem] font-bold tracking-[0.01em] leading-[1.35] text-ink">
          {t('howto.title')}
        </span>
        <svg
          className="h-[1.15rem] w-[1.15rem] shrink-0 text-ink-soft transition-transform duration-[180ms] ease-in-out group-aria-expanded:rotate-180"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z"
          />
        </svg>
      </button>
      <div
        className="px-[1.05rem] pb-4"
        id="marking-help-panel"
        data-marking-panel
        hidden={!markingOpen}
      >
        <ul className="m-0 list-disc list-outside pl-[1.15rem] [&_li+li]:mt-[0.35rem]">
          <li>{t('howto.step1')}</li>
          <li>{t('howto.step2')}</li>
          <li>{t('howto.step3')}</li>
          <li>{t('howto.step4')}</li>
          <li>{t('howto.step5')}</li>
          <li>{t('howto.step6')}</li>
        </ul>
        <p className="mt-[0.85rem] mb-0 rounded-xl border border-ink/22 bg-foam px-[0.8rem] py-[0.7rem] text-[0.84rem] font-semibold leading-[1.4] text-ink shadow-[inset_0_0_0_1px_var(--highlight)]">
          {t('howto.tips')}
        </p>
        <p className="mt-[0.85rem] mb-0 rounded-xl border border-ink/10 bg-ink/6 px-[0.8rem] py-[0.7rem] text-[0.8rem] leading-[1.4] text-ink-soft">
          {t('howto.latency')}
        </p>
      </div>
    </div>
  )
}
