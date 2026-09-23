import { prefersHeadphonesHint } from '../lib/audio/runtime.client'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { useSessionStore } from '../store/sessionStore'
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

export function HelpPanel({ className }: HelpPanelProps) {
  useLocale()
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  // Aide : hors mobile, afficher même si la 1re touche n’a pas encore activé les hints
  const showShortcuts = !prefersHeadphonesHint() || keyboardHintsEnabled

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
