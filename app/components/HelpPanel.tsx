import { useEffect, useState } from 'react'
import { Link } from '@remix-run/react'
import { prefersHeadphonesHint } from '../lib/deviceHint'
import { useLocale } from '../hooks/useLocale'
import { t, type MessageKey } from '../lib/i18n'
import { useSessionStore } from '../store/sessionStore'
import { withBrand } from './BrandInline'
import { Button } from './Button'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpFaq } from './HelpFaq'
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

const TOC: Array<{ href: string; labelKey: MessageKey }> = [
  { href: '#help-start', labelKey: 'help.toc.start' },
  { href: '#help-guest', labelKey: 'help.toc.guest' },
  { href: '#help-modes', labelKey: 'help.toc.modes' },
  { href: '#help-metronome', labelKey: 'help.toc.metronome' },
  { href: '#help-piano', labelKey: 'help.toc.piano' },
  { href: '#help-record', labelKey: 'help.toc.record' },
  { href: `#${HOWTO_HASH}`, labelKey: 'help.toc.sync' },
  { href: '#help-mix', labelKey: 'help.toc.mix' },
  { href: '#help-import', labelKey: 'help.toc.import' },
  { href: '#help-library', labelKey: 'help.toc.library' },
  { href: '#help-share', labelKey: 'help.toc.share' },
  { href: '#help-account', labelKey: 'help.toc.account' },
  { href: '#help-devices', labelKey: 'help.toc.devices' },
  { href: '#help-shortcuts', labelKey: 'help.toc.shortcuts' },
  { href: '#help-faq', labelKey: 'help.toc.faq' },
]

export function HelpPanel({ className }: HelpPanelProps) {
  useLocale()
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const showShortcuts = !prefersHeadphonesHint() || keyboardHintsEnabled
  const [whyNeededOpen, setWhyNeededOpen] = useState(false)

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

  return (
    <DeckOverlayPanel
      title={t('help.title')}
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel={t('help.close')}
    >
      <nav aria-label={t('help.toc.aria')}>
        <ul className="m-0 flex list-none flex-wrap gap-x-[0.65rem] gap-y-[0.35rem] p-0 text-[0.8rem] font-semibold leading-none">
          {TOC.filter(
            (item) => item.href !== '#help-shortcuts' || showShortcuts,
          ).map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-ink-soft underline decoration-ink/25 underline-offset-2 hover:text-ink hover:decoration-ink/55"
              >
                {t(item.labelKey)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <HelpSection id="help-start" title={t('help.start.title')}>
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

      <HelpSection id="help-guest" title={t('help.guest.title')}>
        <HelpText>{t('help.guest.body1')}</HelpText>
        <HelpText>{t('help.guest.body2')}</HelpText>
        <HelpText>{t('help.guest.body3')}</HelpText>
      </HelpSection>

      <HelpSection id="help-modes" title={t('help.modes.title')}>
        <HelpText>{t('help.modes.body1')}</HelpText>
        <HelpText>{t('help.modes.body2')}</HelpText>
      </HelpSection>

      <HelpSection id="help-metronome" title={t('help.metronome.title')}>
        <HelpText>{t('help.metronome.body1')}</HelpText>
        <HelpText>{t('help.metronome.body2')}</HelpText>
      </HelpSection>

      <HelpSection id="help-piano" title={t('help.piano.title')}>
        <HelpText>{t('help.piano.body1')}</HelpText>
        <HelpText>{t('help.piano.body2')}</HelpText>
      </HelpSection>

      <HelpSection id="help-record" title={t('help.record.title')}>
        <HelpText>{t('help.record.body1')}</HelpText>
        <HelpText>
          {t('help.record.body2', {
            f2: showShortcuts ? t('help.record.f2') : '',
          })}
        </HelpText>
      </HelpSection>

      <HelpSection id={HOWTO_HASH} title={t('howto.title')}>
        <ul className="m-0 list-disc list-outside pl-[1.15rem] text-[0.84rem] leading-[1.45] text-ink-soft [&_li+li]:mt-[0.35rem]">
          <li>{withBrand(t('howto.step1'))}</li>
          <li>{withBrand(t('howto.step2'))}</li>
          <li>{withBrand(t('howto.step3'))}</li>
          <li>{withBrand(t('howto.step4'))}</li>
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

      <HelpSection title={t('help.sync.title')}>
        <HelpText>{t('help.sync.body1')}</HelpText>
        <HelpText>{t('help.sync.body2')}</HelpText>
        <HelpText>{t('help.sync.body3')}</HelpText>
      </HelpSection>

      <HelpSection id="help-mix" title={t('help.mix.title')}>
        <HelpText>{t('help.mix.body1')}</HelpText>
        <HelpText>{t('help.mix.body2')}</HelpText>
      </HelpSection>

      <HelpSection id="help-import" title={t('help.import.title')}>
        <HelpText>{t('help.import.body1')}</HelpText>
        <HelpText>{t('help.import.body2')}</HelpText>
      </HelpSection>

      <HelpSection id="help-library" title={t('help.library.title')}>
        <HelpText>{t('help.library.body1')}</HelpText>
        <HelpText>{t('help.library.body2')}</HelpText>
      </HelpSection>

      <HelpSection id="help-share" title={t('help.share.title')}>
        <HelpText>{t('help.share.body1')}</HelpText>
        <HelpText>{t('help.share.body2')}</HelpText>
      </HelpSection>

      <HelpSection id="help-account" title={t('help.account.title')}>
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

      <HelpSection id="help-devices" title={t('help.devices.title')}>
        <HelpText>{t('help.devices.body1')}</HelpText>
      </HelpSection>

      <HelpSection
        id="help-shortcuts"
        title={t('help.shortcuts.title')}
        hidden={!showShortcuts}
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

      <HelpFaq />
    </DeckOverlayPanel>
  )
}
