import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from '@remix-run/react'
import { prefersHeadphonesHint } from '../lib/deviceHint'
import { useLocale } from '../hooks/useLocale'
import { t, type MessageKey } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'
import { withBrand } from './BrandInline'
import { Button } from './Button'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpFaq, helpFaqMatchesQuery } from './HelpFaq'
import {
  HelpActionList,
  HelpActionRow,
  HelpSection,
  HelpSubtitle,
  HelpText,
} from './HelpSection'
import {
  HelpShortcutRow,
  HelpShortcutsCategory,
  HelpShortcutsTable,
} from './HelpShortcuts'
import {
  DeckModePill,
  HelpToolPill,
  helpNavPillLeadingClassName,
} from './ModeTools'
import {
  IconAutoAlign,
  IconDiscard,
  IconDownload,
  IconHighlight,
  IconImportAudio,
  IconNext,
  IconPlus,
  IconRecord,
  IconScissors,
  IconSpeakerOn,
  IconStop,
  IconTrash,
} from './icons'

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
  {
    href: '#help-record',
    sectionId: 'help-record',
    labelKey: 'help.toc.record',
  },
  { href: '#help-piano', sectionId: 'help-piano', labelKey: 'help.toc.piano' },
  {
    href: '#help-metronome',
    sectionId: 'help-metronome',
    labelKey: 'help.toc.metronome',
  },
  { href: '#help-sync', sectionId: 'help-sync', labelKey: 'help.toc.sync' },
  { href: '#help-mix', sectionId: 'help-mix', labelKey: 'help.toc.mix' },
  { href: '#help-cut', sectionId: 'help-cut', labelKey: 'help.toc.cut' },
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

/**
 * When searching: if any subtitle block matches, show only those blocks
 * (plus the section title). If only the section shell matches, show all.
 */
function resolveSubtitleVisibility<T extends Record<string, boolean>>(
  query: string,
  sectionMatch: boolean,
  subs: T,
): { showSection: boolean; show: T } {
  const q = query.trim()
  if (!q) {
    const all = { ...subs }
    for (const key of Object.keys(all) as Array<keyof T>) {
      all[key] = true as T[keyof T]
    }
    return { showSection: sectionMatch, show: all }
  }
  const anySub = Object.values(subs).some(Boolean)
  if (anySub) {
    return { showSection: true, show: { ...subs } }
  }
  if (sectionMatch) {
    const all = { ...subs }
    for (const key of Object.keys(all) as Array<keyof T>) {
      all[key] = true as T[keyof T]
    }
    return { showSection: true, show: all }
  }
  const none = { ...subs }
  for (const key of Object.keys(none) as Array<keyof T>) {
    none[key] = false as T[keyof T]
  }
  return { showSection: false, show: none }
}

export function HelpPanel({ className }: HelpPanelProps) {
  useLocale()
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const showShortcuts = !prefersHeadphonesHint() || keyboardHintsEnabled
  const [whyNeededOpen, setWhyNeededOpen] = useState(false)
  const [howtoWithMetro, setHowtoWithMetro] = useState(false)
  const [searchParams] = useSearchParams()
  const urlQ = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(urlQ)
  const lastUrlQRef = useRef(urlQ)

  useEffect(() => {
    if (urlQ === lastUrlQRef.current) return
    lastUrlQRef.current = urlQ
    setSearch(urlQ)
  }, [urlQ])

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
    metronome: matchesHelpQuery(
      search,
      t('help.metronome.title'),
      t('help.metronome.body1'),
      t('help.toc.metronome'),
    ),
    piano: matchesHelpQuery(
      search,
      t('help.piano.title'),
      t('help.piano.body1'),
      t('help.toc.piano'),
    ),
    record: matchesHelpQuery(
      search,
      t('help.record.title'),
      t('help.record.action.import'),
      t('help.record.action.record'),
      t('help.record.action.next'),
      t('help.record.action.stopCapture'),
      t('help.record.action.discard'),
      t('help.record.action.stopPlay'),
      t('help.record.action.export'),
      t('help.record.mode.simple'),
      t('help.record.mode.mix'),
      t('help.record.mode.align'),
      t('help.record.mode.cut'),
      t('help.record.tool.piano'),
      t('help.record.tool.metronome'),
      t('help.record.body2', { f2: t('help.record.f2') }),
      t('help.toc.record'),
      t('mode.simple'),
      t('mode.mix'),
      t('mode.align'),
      t('mode.cut'),
      t('piano.toggle'),
      t('deck.metronome'),
    ),
    sync: (() => {
      const shell = matchesHelpQuery(
        search,
        t('help.sync.title'),
        t('help.toc.sync'),
        t('mode.label'),
        t('mode.align'),
        t('mode.align.hint'),
      )
      const autoAlign = matchesHelpQuery(
        search,
        t('help.sync.autoAlign.title'),
        t('help.sync.autoAlign.body1'),
        t('help.sync.autoAlign.body2'),
        t('help.sync.autoAlign.body3'),
        t('help.sync.autoAlign.body4'),
        t('help.sync.autoAlign.rerun.before'),
        t('help.sync.autoAlign.rerun.after'),
        t('help.sync.noise.body'),
        t('help.sync.ref.body'),
      )
      const howto = matchesHelpQuery(
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
        t('howto.whyNeeded'),
        t('howto.whyNeeded.about'),
        t('howto.latency'),
      )
      const punch = matchesHelpQuery(
        search,
        t('help.sync.punch.title'),
        t('help.sync.punch.body1.before'),
        t('help.sync.punch.body1.after'),
        t('help.sync.punch.bodyInvite'),
        t('help.sync.punch.body2'),
        t('help.sync.punch.seeCut'),
      )
      const resolved = resolveSubtitleVisibility(search, shell, {
        autoAlign,
        howto,
        punch,
      })
      return {
        section: resolved.showSection,
        autoAlign: resolved.show.autoAlign,
        howto: resolved.show.howto,
        punch: resolved.show.punch,
      }
    })(),
    cut: (() => {
      const shell = matchesHelpQuery(
        search,
        t('help.cut.title'),
        t('help.toc.cut'),
        t('mode.label'),
        t('mode.cut'),
        t('mode.cut.hint'),
        t('help.cut.body1'),
        'découpage',
        'decoupage',
        'cut',
        'schneiden',
        'klipp',
      )
      const split = matchesHelpQuery(
        search,
        t('help.cut.split.title'),
        t('help.cut.split.body1.before'),
        t('help.cut.split.body1.after'),
        t('help.cut.split.body2'),
      )
      const mute = matchesHelpQuery(
        search,
        t('help.cut.mute.title'),
        t('help.cut.mute.body1'),
        'muteRanges',
      )
      const merge = matchesHelpQuery(
        search,
        t('help.cut.merge.title'),
        t('help.cut.merge.body1'),
        'fusion',
        'merge',
      )
      const tips = matchesHelpQuery(
        search,
        t('help.cut.tips.body1'),
        t('help.cut.tips.body2'),
      )
      const body1 = matchesHelpQuery(search, t('help.cut.body1'))
      const anySub = split || mute || merge || tips
      const resolved = resolveSubtitleVisibility(search, shell || body1, {
        split,
        mute,
        merge,
        tips,
      })
      return {
        section: resolved.showSection,
        // Intro only when not filtering down to a specific subtitle.
        intro: !search.trim() || body1 || ((shell || body1) && !anySub),
        split: resolved.show.split,
        mute: resolved.show.mute,
        merge: resolved.show.merge,
        tips: resolved.show.tips,
      }
    })(),
    mix: matchesHelpQuery(
      search,
      t('help.mix.title'),
      t('help.toc.mix'),
      t('mode.label'),
      t('mode.mix'),
      t('mode.mix.hint'),
      t('help.mix.body1.before'),
      t('help.mix.body1.mid'),
      t('help.mix.body1.after'),
      t('help.mix.body2.before'),
      t('help.mix.body2.after'),
      t('help.mix.body3'),
      t('help.mix.body4'),
      t('nav.settings'),
    ),
    library: matchesHelpQuery(
      search,
      t('help.library.title'),
      t('help.library.body1'),
      t('help.library.body2'),
      t('help.library.body3.before'),
      t('help.library.body3.mid'),
      t('help.library.body3.after'),
      t('help.toc.library'),
    ),
    share: matchesHelpQuery(
      search,
      t('help.share.title'),
      t('help.share.body1'),
      t('help.share.body2'),
      t('help.share.body3'),
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
      t('help.devices.body2'),
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
    'help-metronome': show.metronome,
    'help-piano': show.piano,
    'help-record': show.record,
    [HOWTO_HASH]: show.sync.section && show.sync.howto,
    'help-sync': show.sync.section,
    'help-cut': show.cut.section,
    'help-mix': show.mix,
    'help-library': show.library,
    'help-share': show.share,
    'help-account': show.account,
    'help-devices': show.devices,
    'help-shortcuts': show.shortcuts,
    'help-faq': show.faq,
  }

  const anyVisible = Object.values(show).some((value) =>
    typeof value === 'boolean' ? value : Boolean(value.section),
  )
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

      {anyVisible ? (
        <p className="m-0 rounded-xl border border-ink/22 bg-foam px-[0.8rem] py-[0.7rem] text-[0.84rem] font-semibold leading-[1.4] text-ink shadow-[inset_0_0_0_1px_var(--highlight)]">
          {withBrand(t('howto.tips'))}
        </p>
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
        id="help-record"
        title={t('help.record.title')}
        hidden={!show.record}
      >
        <HelpActionList className="mb-[0.65rem]">
          <HelpActionRow icon={<IconRecord className="size-[1.35rem]" />}>
            {t('help.record.action.record')}
          </HelpActionRow>
          <HelpActionRow icon={<IconNext />}>
            {t('help.record.action.next')}
          </HelpActionRow>
          <HelpActionRow
            icon={<IconStop style={{ color: 'var(--brand-5)' }} />}
          >
            {t('help.record.action.stopCapture')}
          </HelpActionRow>
          <HelpActionRow icon={<IconDiscard />}>
            {t('help.record.action.discard')}
          </HelpActionRow>
          <HelpActionRow icon={<IconImportAudio />}>
            {t('help.record.action.import')}
          </HelpActionRow>
          <HelpActionRow icon={<IconStop className="text-ink" />}>
            {t('help.record.action.stopPlay')}
          </HelpActionRow>
          <HelpActionRow icon={<IconDownload />}>
            {t('help.record.action.export')}
          </HelpActionRow>
          <HelpActionRow
            href="#help-record"
            leadingWide
            leadingClassName={helpNavPillLeadingClassName}
            icon={<DeckModePill mode="simple" size="sm" />}
          >
            {t('help.record.mode.simple')}
          </HelpActionRow>
          <HelpActionRow
            href="#help-mix"
            leadingWide
            leadingClassName={helpNavPillLeadingClassName}
            icon={<DeckModePill mode="mix" size="sm" />}
          >
            {t('help.record.mode.mix')}
          </HelpActionRow>
          <HelpActionRow
            href="#help-sync"
            leadingWide
            leadingClassName={helpNavPillLeadingClassName}
            icon={<DeckModePill mode="align" size="sm" />}
          >
            {t('help.record.mode.align')}
          </HelpActionRow>
          <HelpActionRow
            href="#help-cut"
            leadingWide
            leadingClassName={helpNavPillLeadingClassName}
            icon={<DeckModePill mode="cut" size="sm" />}
          >
            {t('help.record.mode.cut')}
          </HelpActionRow>
          <HelpActionRow
            href="#help-piano"
            leadingWide
            leadingClassName={helpNavPillLeadingClassName}
            icon={<HelpToolPill>{t('piano.toggle')}</HelpToolPill>}
          >
            {t('help.record.tool.piano')}
          </HelpActionRow>
          <HelpActionRow
            href="#help-metronome"
            leadingWide
            leadingClassName={helpNavPillLeadingClassName}
            icon={<HelpToolPill>{t('deck.metronome')}</HelpToolPill>}
          >
            {t('help.record.tool.metronome')}
          </HelpActionRow>
        </HelpActionList>
        <HelpText>
          {t('help.record.body2', {
            f2: showShortcuts ? t('help.record.f2') : '',
          })}
        </HelpText>
      </HelpSection>

      <HelpSection
        id="help-piano"
        title={t('help.piano.title')}
        hidden={!show.piano}
      >
        <HelpText>{t('help.piano.body1')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-metronome"
        title={t('help.metronome.title')}
        hidden={!show.metronome}
      >
        <HelpText>{t('help.metronome.body1')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-sync"
        title={
          <>
            {t('mode.label')}
            <DeckModePill mode="align" />
          </>
        }
        hidden={!show.sync.section}
      >
        {show.sync.autoAlign ? (
          <>
            <HelpSubtitle>{t('help.sync.autoAlign.title')}</HelpSubtitle>
            <HelpText>{t('help.sync.autoAlign.body1')}</HelpText>
            <HelpText>{t('help.sync.autoAlign.body2')}</HelpText>
            <HelpText>{t('help.sync.autoAlign.body3')}</HelpText>
            <HelpText>{t('help.sync.autoAlign.body4')}</HelpText>
            <HelpText>{t('help.sync.noise.body')}</HelpText>
            <HelpText>{t('help.sync.ref.body')}</HelpText>

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
              </div>
            </div>

            <p className="mt-[0.85rem] mb-0 text-[0.84rem] leading-[1.45] text-ink-soft">
              {t('help.sync.autoAlign.rerun.before')}{' '}
              <IconAutoAlign className="mx-[0.12rem] inline-block size-[1.05rem] align-[-0.18rem] text-ink" />{' '}
              {t('help.sync.autoAlign.rerun.after')}
            </p>
          </>
        ) : null}

        {show.sync.howto ? (
          <div
            id={HOWTO_HASH}
            className="mt-[0.85rem] rounded-xl border border-ink/10 bg-ink/6 px-[0.8rem] py-[0.75rem]"
          >
            <HelpSubtitle className="mt-0">{t('howto.title')}</HelpSubtitle>
            <button
              type="button"
              aria-pressed={howtoWithMetro}
              title={howtoWithMetro ? t('howto.metro.on') : t('howto.metro.off')}
              aria-label={
                howtoWithMetro ? t('howto.metro.on') : t('howto.metro.off')
              }
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
          </div>
        ) : null}

        {show.sync.punch ? (
          <>
            <HelpSubtitle>{t('help.sync.punch.title')}</HelpSubtitle>
            <p className="m-0 text-[0.84rem] leading-[1.45] text-ink-soft">
              {t('help.sync.punch.body1.before')}{' '}
              <IconRecord className="mx-[0.12rem] inline-block size-[1.15rem] align-[-0.22rem]" />{' '}
              {withBrand(t('help.sync.punch.body1.after'))}
            </p>
            <HelpText>{t('help.sync.punch.bodyInvite')}</HelpText>
            <HelpText>{t('help.sync.punch.body2')}</HelpText>
            <p className="mt-[0.65rem] mb-0 text-[0.84rem] font-semibold leading-[1.45]">
              <a
                href="#help-cut"
                className="text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
              >
                {t('help.sync.punch.seeCut')}
              </a>
            </p>
          </>
        ) : null}
      </HelpSection>

      <HelpSection
        id="help-mix"
        title={
          <>
            {t('mode.label')}
            <DeckModePill mode="mix" />
          </>
        }
        hidden={!show.mix}
      >
        <p className="m-0 text-[0.84rem] leading-[1.45] text-ink-soft">
          {t('help.mix.body1.before')}{' '}
          <IconHighlight
            filled
            className="mx-[0.12rem] inline-block size-[1.05rem] align-[-0.18rem] text-ink"
          />{' '}
          {t('help.mix.body1.mid')}{' '}
          <IconSpeakerOn className="mx-[0.12rem] inline-block size-[1.05rem] align-[-0.18rem] text-ink" />{' '}
          {t('help.mix.body1.after')}
        </p>
        <p className="mt-[0.65rem] mb-0 text-[0.84rem] leading-[1.45] text-ink-soft">
          {t('help.mix.body2.before')}{' '}
          <Link
            to="/parametres"
            className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 hover:decoration-ink"
          >
            {t('nav.settings')}
          </Link>
          {t('help.mix.body2.after')}
        </p>
        <HelpText>{t('help.mix.body3')}</HelpText>
        <HelpText>{t('help.mix.body4')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-cut"
        title={
          <>
            {t('mode.label')}
            <DeckModePill mode="cut" />
          </>
        }
        hidden={!show.cut.section}
      >
        {show.cut.intro ? <HelpText>{t('help.cut.body1')}</HelpText> : null}
        {show.cut.split ? (
          <>
            <HelpSubtitle>{t('help.cut.split.title')}</HelpSubtitle>
            <p className="m-0 text-[0.84rem] leading-[1.45] text-ink-soft">
              {t('help.cut.split.body1.before')}{' '}
              <IconScissors className="mx-[0.12rem] inline-block size-[1.05rem] align-[-0.18rem] text-ink" />{' '}
              {t('help.cut.split.body1.after')}
            </p>
            <HelpText>{t('help.cut.split.body2')}</HelpText>
          </>
        ) : null}
        {show.cut.mute ? (
          <>
            <HelpSubtitle>{t('help.cut.mute.title')}</HelpSubtitle>
            <HelpText>{t('help.cut.mute.body1')}</HelpText>
          </>
        ) : null}
        {show.cut.merge ? (
          <>
            <HelpSubtitle>{t('help.cut.merge.title')}</HelpSubtitle>
            <HelpText>{t('help.cut.merge.body1')}</HelpText>
          </>
        ) : null}
        {show.cut.tips ? (
          <>
            <HelpText>{t('help.cut.tips.body1')}</HelpText>
            <HelpText>{t('help.cut.tips.body2')}</HelpText>
          </>
        ) : null}
      </HelpSection>

      <HelpSection
        id="help-library"
        title={t('help.library.title')}
        hidden={!show.library}
      >
        <HelpText>{t('help.library.body1')}</HelpText>
        <HelpText>{t('help.library.body2')}</HelpText>
        <p className="mt-[0.65rem] mb-0 text-[0.84rem] leading-[1.45] text-ink-soft">
          {t('help.library.body3.before')}{' '}
          <IconTrash className="mx-[0.12rem] inline-block size-[1.05rem] align-[-0.18rem] text-ink" />
          {t('help.library.body3.mid')}{' '}
          <IconPlus className="mx-[0.12rem] inline-block size-[1.05rem] align-[-0.18rem] text-ink" />
          {t('help.library.body3.after')}
        </p>
      </HelpSection>

      <HelpSection
        id="help-share"
        title={t('help.share.title')}
        hidden={!show.share}
      >
        <HelpText>{t('help.share.body1')}</HelpText>
        <HelpText>{t('help.share.body2')}</HelpText>
        <HelpText>{t('help.share.body3')}</HelpText>
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
        <HelpText>{t('help.devices.body2')}</HelpText>
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
