import { useEffect, useState } from 'react'
import { Link } from '@remix-run/react'
import { prefersHeadphonesHint } from '../lib/deviceHint'
import { useLocale } from '../hooks/useLocale'
import { t, type MessageKey } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'
import { withBrand } from './BrandInline'
import { Button } from './Button'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpFaq, helpFaqMatchesQuery } from './HelpFaq'
import { HelpSection, HelpText } from './HelpSection'
import {
  HelpShortcutRow,
  HelpShortcutsCategory,
  HelpShortcutsTable,
} from './HelpShortcuts'

type HelpPanelProps = {
  className?: string
}

const HOWTO_HASH = 'mode-emploi-calage'

const TOC: Array<{
  href: string
  sectionId: string
  labelKey: MessageKey
  emphasize?: boolean
}> = [
  {
    href: '#help-faq',
    sectionId: 'help-faq',
    labelKey: 'help.toc.faq',
    emphasize: true,
  },
  { href: '#help-start', sectionId: 'help-start', labelKey: 'help.toc.start' },
  { href: '#help-guest', sectionId: 'help-guest', labelKey: 'help.toc.guest' },
  { href: '#help-modes', sectionId: 'help-modes', labelKey: 'help.toc.modes' },
  {
    href: '#help-metronome',
    sectionId: 'help-metronome',
    labelKey: 'help.toc.metronome',
  },
  { href: '#help-piano', sectionId: 'help-piano', labelKey: 'help.toc.piano' },
  {
    href: '#help-record',
    sectionId: 'help-record',
    labelKey: 'help.toc.record',
  },
  { href: `#${HOWTO_HASH}`, sectionId: HOWTO_HASH, labelKey: 'help.toc.sync' },
  { href: '#help-mix', sectionId: 'help-mix', labelKey: 'help.toc.mix' },
  {
    href: '#help-import',
    sectionId: 'help-import',
    labelKey: 'help.toc.import',
  },
  {
    href: '#help-library',
    sectionId: 'help-library',
    labelKey: 'help.toc.library',
  },
  { href: '#help-share', sectionId: 'help-share', labelKey: 'help.toc.share' },
  {
    href: '#help-account',
    sectionId: 'help-account',
    labelKey: 'help.toc.account',
  },
  {
    href: '#help-devices',
    sectionId: 'help-devices',
    labelKey: 'help.toc.devices',
  },
  {
    href: '#help-shortcuts',
    sectionId: 'help-shortcuts',
    labelKey: 'help.toc.shortcuts',
  },
]

function matchesHelpQuery(query: string, ...parts: string[]): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return parts.some((part) => part.toLowerCase().includes(q))
}

export function HelpPanel({ className }: HelpPanelProps) {
  useLocale()
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const showShortcuts = !prefersHeadphonesHint() || keyboardHintsEnabled
  const [whyNeededOpen, setWhyNeededOpen] = useState(false)
  const [howtoWithMetro, setHowtoWithMetro] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const scrollToHash = () => {
      if (typeof window === 'undefined') return
      const id = window.location.hash.replace(/^#/, '')
      if (!id) return
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  const show = {
    start: matchesHelpQuery(
      search,
      t('help.start.title'),
      t('help.start.body1'),
      t('help.start.body2'),
      t('help.start.howtoLink'),
      t('help.toc.start'),
    ),
    guest: matchesHelpQuery(
      search,
      t('help.guest.title'),
      t('help.guest.body1'),
      t('help.guest.body2'),
      t('help.guest.body3'),
      t('help.toc.guest'),
    ),
    modes: matchesHelpQuery(
      search,
      t('help.modes.title'),
      t('help.modes.body1'),
      t('help.modes.body2'),
      t('help.toc.modes'),
      t('mode.cut'),
      t('mode.cut.hint'),
      'découpage',
      'decoupage',
      'cut',
      'schneiden',
      'klipp',
      'fusion',
      'merge',
      'muteRanges',
    ),
    metronome: matchesHelpQuery(
      search,
      t('help.metronome.title'),
      t('help.metronome.body1'),
      t('help.metronome.body2'),
      t('help.toc.metronome'),
    ),
    piano: matchesHelpQuery(
      search,
      t('help.piano.title'),
      t('help.piano.body1'),
      t('help.piano.body2'),
      t('help.toc.piano'),
    ),
    record: matchesHelpQuery(
      search,
      t('help.record.title'),
      t('help.record.body1'),
      t('help.record.body2', { f2: t('help.record.f2') }),
      t('help.toc.record'),
    ),
    howto: matchesHelpQuery(
      search,
      t('howto.title'),
      t('howto.metro.on'),
      t('howto.metro.off'),
      t('howto.metro.add'),
      t('howto.step1'),
      t('howto.step2'),
      t('howto.step2.metro'),
      t('howto.step3'),
      t('howto.step4'),
      t('howto.step4.metro'),
      t('howto.step5'),
      t('howto.step6'),
      t('howto.tips'),
      t('howto.whyNeeded'),
      t('howto.whyNeeded.about'),
      t('howto.latency'),
      t('howto.latency.manual'),
      t('howto.autoAlign'),
      t('help.toc.sync'),
    ),
    sync: matchesHelpQuery(
      search,
      t('help.sync.title'),
      t('help.sync.body1'),
      t('help.sync.body2'),
      t('help.sync.body3'),
      t('help.sync.body4'),
    ),
    mix: matchesHelpQuery(
      search,
      t('help.mix.title'),
      t('help.mix.body1'),
      t('help.mix.body2'),
      t('help.mix.body3'),
      t('help.toc.mix'),
    ),
    import: matchesHelpQuery(
      search,
      t('help.import.title'),
      t('help.import.body1'),
      t('help.import.body2'),
      t('help.toc.import'),
    ),
    library: matchesHelpQuery(
      search,
      t('help.library.title'),
      t('help.library.body1'),
      t('help.library.body2'),
      t('help.toc.library'),
    ),
    share: matchesHelpQuery(
      search,
      t('help.share.title'),
      t('help.share.body1'),
      t('help.share.body2'),
      t('help.toc.share'),
    ),
    account: matchesHelpQuery(
      search,
      t('help.account.title'),
      t('help.account.body1'),
      t('help.account.body2'),
      t('nav.privacy'),
      t('nav.terms'),
      t('help.toc.account'),
    ),
    devices: matchesHelpQuery(
      search,
      t('help.devices.title'),
      t('help.devices.body1'),
      t('help.toc.devices'),
    ),
    shortcuts:
      showShortcuts &&
      matchesHelpQuery(
        search,
        t('help.shortcuts.title'),
        t('help.shortcuts.recording'),
        t('help.shortcuts.record'),
        t('help.shortcuts.next'),
        t('help.shortcuts.discard'),
        t('help.shortcuts.stop'),
        t('help.shortcuts.playback'),
        t('help.shortcuts.playPause'),
        t('help.shortcuts.downloadCat'),
        t('help.shortcuts.download'),
        t('help.shortcuts.general'),
        t('help.shortcuts.editTitle'),
        t('help.shortcuts.closePanels'),
        t('help.toc.shortcuts'),
        'E',
        'R',
        'S',
        'N',
        'F2',
        'Espace',
        'Entrée',
        'Suppr',
        'Échap',
        'T',
        'D',
      ),
    faq: helpFaqMatchesQuery(search),
  }

  const sectionVisible: Record<string, boolean> = {
    'help-start': show.start,
    'help-guest': show.guest,
    'help-modes': show.modes,
    'help-metronome': show.metronome,
    'help-piano': show.piano,
    'help-record': show.record,
    [HOWTO_HASH]: show.howto,
    'help-sync': show.sync,
    'help-mix': show.mix,
    'help-import': show.import,
    'help-library': show.library,
    'help-share': show.share,
    'help-account': show.account,
    'help-devices': show.devices,
    'help-shortcuts': show.shortcuts,
    'help-faq': show.faq,
  }

  const anyVisible = Object.values(show).some(Boolean)
  const tocItems = TOC.filter(
    (item) =>
      (item.sectionId !== 'help-shortcuts' || showShortcuts) &&
      sectionVisible[item.sectionId],
  )

  return (
    <DeckOverlayPanel
      title={t('help.title')}
      titleAside={
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('help.search.placeholder')}
          aria-label={t('help.search.aria')}
          className={cn(
            'w-full rounded-lg border-[1.5px] border-line bg-surface',
            'px-[0.65rem] py-[0.38rem] font-[inherit] text-[0.82rem] font-semibold text-ink',
            'placeholder:font-medium placeholder:text-ink-soft/70',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          )}
        />
      }
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel={t('help.close')}
    >
      {tocItems.length > 0 ? (
        <nav aria-label={t('help.toc.aria')}>
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-[0.65rem] gap-y-[0.35rem] p-0 text-[0.8rem] font-semibold leading-none">
            {tocItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={cn(
                    'inline-flex items-center rounded-full border-[1.5px] py-0 leading-none',
                    item.emphasize
                      ? 'border-ink/20 bg-ink/6 px-[0.65rem] text-ink no-underline transition-[background,border-color,color] duration-150 hover:border-ink/35 hover:bg-ink/10'
                      : 'border-transparent px-0 text-ink-soft underline decoration-ink/25 underline-offset-2 hover:text-ink hover:decoration-ink/55',
                  )}
                >
                  {t(item.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {!anyVisible ? (
        <p className="m-0 text-[0.88rem] font-semibold text-ink-soft">
          {t('help.search.empty')}
        </p>
      ) : null}

      <HelpSection
        id="help-start"
        title={t('help.start.title')}
        hidden={!show.start}
      >
        <HelpText>{t('help.start.body1')}</HelpText>
        <HelpText>{t('help.start.body2')}</HelpText>
        <p className="mt-[0.65rem] mb-0 text-[0.84rem] font-semibold leading-[1.45]">
          <a
            href={`#${HOWTO_HASH}`}
            className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
          >
            {t('help.start.howtoLink')}
          </a>
        </p>
      </HelpSection>

      <HelpSection
        id="help-guest"
        title={t('help.guest.title')}
        hidden={!show.guest}
      >
        <HelpText>{t('help.guest.body1')}</HelpText>
        <HelpText>{t('help.guest.body2')}</HelpText>
        <HelpText>{t('help.guest.body3')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-modes"
        title={t('help.modes.title')}
        hidden={!show.modes}
      >
        <HelpText>{t('help.modes.body1')}</HelpText>
        <HelpText>{t('help.modes.body2')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-metronome"
        title={t('help.metronome.title')}
        hidden={!show.metronome}
      >
        <HelpText>{t('help.metronome.body1')}</HelpText>
        <HelpText>{t('help.metronome.body2')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-piano"
        title={t('help.piano.title')}
        hidden={!show.piano}
      >
        <HelpText>{t('help.piano.body1')}</HelpText>
        <HelpText>{t('help.piano.body2')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-record"
        title={t('help.record.title')}
        hidden={!show.record}
      >
        <HelpText>{t('help.record.body1')}</HelpText>
        <HelpText>
          {t('help.record.body2', {
            f2: showShortcuts ? t('help.record.f2') : '',
          })}
        </HelpText>
      </HelpSection>

      <HelpSection
        id={HOWTO_HASH}
        title={t('howto.title')}
        hidden={!show.howto}
      >
        <button
          type="button"
          aria-pressed={howtoWithMetro}
          title={howtoWithMetro ? t('howto.metro.on') : t('howto.metro.off')}
          aria-label={howtoWithMetro ? t('howto.metro.on') : t('howto.metro.off')}
          onClick={() => setHowtoWithMetro((on) => !on)}
          className={cn(
            'mb-[0.75rem] inline-flex items-center justify-center rounded-full px-[0.78rem] py-[0.42rem]',
            'border-[1.5px] font-[inherit] text-[0.82rem] font-bold tracking-[0.01em]',
            'transition-[background,color,border-color,box-shadow,transform] duration-160',
            'cursor-pointer active:scale-[0.98]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
            howtoWithMetro
              ? 'border-ink bg-ink text-on-ink shadow-[0_4px_12px_color-mix(in_srgb,var(--ink)_22%,transparent)]'
              : 'border-line bg-surface text-ink-soft hover:text-ink',
          )}
        >
          {howtoWithMetro ? t('howto.metro.on') : t('howto.metro.off')}
        </button>
        {howtoWithMetro ? (
          <HelpText className="mb-[0.75rem]">{t('howto.metro.add')}</HelpText>
        ) : null}
        <ul className="m-0 list-disc list-outside pl-[1.15rem] text-[0.84rem] leading-[1.45] text-ink-soft [&_li+li]:mt-[0.35rem]">
          <li>{withBrand(t('howto.step1'))}</li>
          <li>
            {withBrand(
              t(howtoWithMetro ? 'howto.step2.metro' : 'howto.step2'),
            )}
          </li>
          <li>{withBrand(t('howto.step3'))}</li>
          <li>
            {withBrand(
              t(howtoWithMetro ? 'howto.step4.metro' : 'howto.step4'),
            )}
          </li>
          <li>{withBrand(t('howto.step5'))}</li>
          <li>{withBrand(t('howto.step6'))}</li>
        </ul>
        <p className="mt-[0.85rem] mb-0 rounded-xl border border-ink/22 bg-foam px-[0.8rem] py-[0.7rem] text-[0.84rem] font-semibold leading-[1.4] text-ink shadow-[inset_0_0_0_1px_var(--highlight)]">
          {withBrand(t('howto.tips'))}
        </p>
        <div className="mt-[0.85rem]">
          <div className="flex items-center gap-[0.4rem]">
            <span className="text-[0.84rem] font-semibold text-ink-soft">
              {t('howto.whyNeeded')}
            </span>
            <Button
              variant="round"
              className="h-[1.25rem] w-[1.25rem] shrink-0 border-ink/22 text-[0.72rem] font-bold text-ink-soft hover:enabled:border-ink/35 hover:enabled:bg-ink/6 hover:enabled:text-ink aria-expanded:border-ink/35 aria-expanded:bg-ink/6 aria-expanded:text-ink max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
              aria-expanded={whyNeededOpen}
              aria-controls="howto-why-needed-tip"
              title={t('howto.whyNeeded.about')}
              onClick={() => setWhyNeededOpen((open) => !open)}
            >
              ?
            </Button>
          </div>
          <div
            className="mt-[0.55rem] mb-0 rounded-xl border border-ink/10 bg-ink/6 px-[0.8rem] py-[0.7rem] text-[0.8rem] leading-[1.4] text-ink-soft"
            id="howto-why-needed-tip"
            hidden={!whyNeededOpen}
          >
            <p className="m-0">{withBrand(t('howto.latency'))}</p>
            <p className="mt-[0.65rem] mb-0">
              {withBrand(t('howto.latency.manual'))}
            </p>
          </div>
        </div>
        <HelpText className="mt-[0.85rem]">{t('howto.autoAlign')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-sync"
        title={t('help.sync.title')}
        hidden={!show.sync}
      >
        <HelpText>{t('help.sync.body1')}</HelpText>
        <HelpText>{t('help.sync.body2')}</HelpText>
        <HelpText>{t('help.sync.body3')}</HelpText>
        <HelpText>{t('help.sync.body4')}</HelpText>
      </HelpSection>

      <HelpSection id="help-mix" title={t('help.mix.title')} hidden={!show.mix}>
        <HelpText>{t('help.mix.body1')}</HelpText>
        <HelpText>{t('help.mix.body2')}</HelpText>
        <HelpText>{t('help.mix.body3')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-import"
        title={t('help.import.title')}
        hidden={!show.import}
      >
        <HelpText>{t('help.import.body1')}</HelpText>
        <HelpText>{t('help.import.body2')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-library"
        title={t('help.library.title')}
        hidden={!show.library}
      >
        <HelpText>{t('help.library.body1')}</HelpText>
        <HelpText>{t('help.library.body2')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-share"
        title={t('help.share.title')}
        hidden={!show.share}
      >
        <HelpText>{t('help.share.body1')}</HelpText>
        <HelpText>{t('help.share.body2')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-account"
        title={t('help.account.title')}
        hidden={!show.account}
      >
        <HelpText>{t('help.account.body1')}</HelpText>
        <HelpText>{t('help.account.body2')}</HelpText>
        <p className="mt-[0.55rem] mb-0 text-[0.84rem] leading-[1.45] text-ink-soft">
          <Link
            to="/privacy"
            className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
          >
            {t('nav.privacy')}
          </Link>
          {' · '}
          <Link
            to="/terms"
            className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
          >
            {t('nav.terms')}
          </Link>
        </p>
      </HelpSection>

      <HelpSection
        id="help-devices"
        title={t('help.devices.title')}
        hidden={!show.devices}
      >
        <HelpText>{t('help.devices.body1')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-shortcuts"
        title={t('help.shortcuts.title')}
        hidden={!show.shortcuts}
      >
        <HelpShortcutsTable>
          <HelpShortcutsCategory>
            {t('help.shortcuts.recording')}
          </HelpShortcutsCategory>
          <HelpShortcutRow
            keys="E / R"
            action={t('help.shortcuts.record')}
          />
          <HelpShortcutRow keys="S / N" action={t('help.shortcuts.next')} />
          <HelpShortcutRow
            keys="Suppr"
            action={t('help.shortcuts.discard')}
          />
          <HelpShortcutRow keys="Entrée" action={t('help.shortcuts.stop')} />
          <HelpShortcutsCategory>
            {t('help.shortcuts.playback')}
          </HelpShortcutsCategory>
          <HelpShortcutRow
            keys="Espace"
            action={t('help.shortcuts.playPause')}
          />
          <HelpShortcutsCategory>
            {t('help.shortcuts.downloadCat')}
          </HelpShortcutsCategory>
          <HelpShortcutRow
            keys="T / D"
            action={t('help.shortcuts.download')}
          />
          <HelpShortcutsCategory>
            {t('help.shortcuts.general')}
          </HelpShortcutsCategory>
          <HelpShortcutRow keys="F2" action={t('help.shortcuts.editTitle')} />
          <HelpShortcutRow
            keys="Échap"
            action={t('help.shortcuts.closePanels')}
          />
        </HelpShortcutsTable>
      </HelpSection>

      {show.faq ? <HelpFaq filterQuery={search} /> : null}
    </DeckOverlayPanel>
  )
}
