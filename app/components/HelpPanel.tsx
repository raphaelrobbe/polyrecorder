import { useEffect, useState } from 'react'
import { prefersHeadphonesHint } from '../lib/deviceHint'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { useSessionStore } from '../store/sessionStore'
import { withBrand } from './BrandInline'
import { Button } from './Button'
import { DeckOverlayPanel } from './DeckOverlayPanel'
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

export function HelpPanel({ className }: HelpPanelProps) {
  useLocale()
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const showShortcuts = !prefersHeadphonesHint() || keyboardHintsEnabled
  const [whyNeededOpen, setWhyNeededOpen] = useState(false)

  useEffect(() => {
    const scrollToHowto = () => {
      if (typeof window === 'undefined') return
      if (window.location.hash.replace(/^#/, '') !== HOWTO_HASH) return
      window.requestAnimationFrame(() => {
        document.getElementById(HOWTO_HASH)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
    scrollToHowto()
    window.addEventListener('hashchange', scrollToHowto)
    return () => window.removeEventListener('hashchange', scrollToHowto)
  }, [])

  return (
    <DeckOverlayPanel
      title={t('help.title')}
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel={t('help.close')}
    >
      <HelpSection title={t('help.customize.title')}>
        <HelpText>
          {t('help.customize.body1', {
            f2: showShortcuts ? t('help.customize.f2') : '',
          })}
        </HelpText>
        <HelpText>{t('help.customize.body2')}</HelpText>
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
      </HelpSection>

      <HelpSection title={t('help.shortcuts.title')} hidden={!showShortcuts}>
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
    </DeckOverlayPanel>
  )
}
