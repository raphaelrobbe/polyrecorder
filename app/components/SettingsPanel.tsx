import { ClientOnly } from 'remix-utils/client-only'
import { useRouteLoaderData } from '@remix-run/react'
import { prefersHeadphonesHint } from '../lib/deviceHint'
import { writeAutoCloudSave } from '../lib/cloudPrefs'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import type { loader as rootLoader } from '../root'
import { useSessionStore } from '../store/sessionStore'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { CheckboxOption, OptionGroup } from './CheckboxOption'
import { LocaleButtons } from './LocaleButtons'
import { ThemeButtons } from './ThemeButtons'
import { SettingsDevices, SettingsNote } from './SettingsDevices'
import SettingsAudioDevices from './SettingsAudioDevices.client'

type SettingsPanelProps = {
  className?: string
}

export function SettingsPanel({ className }: SettingsPanelProps) {
  useLocale()
  const rootData = useRouteLoaderData<typeof rootLoader>('root')
  const user = rootData?.user ?? null
  const autoplayAfterStop = useSessionStore((s) => s.autoplayAfterStop)
  const skipCountInPlayback = useSessionStore((s) => s.skipCountInPlayback)
  const skipCountInDownload = useSessionStore((s) => s.skipCountInDownload)
  const autoCloudSave = useSessionStore((s) => s.autoCloudSave)
  const setAutoplayAfterStop = useSessionStore((s) => s.setAutoplayAfterStop)
  const setSkipCountInPlayback = useSessionStore((s) => s.setSkipCountInPlayback)
  const setSkipCountInDownload = useSessionStore((s) => s.setSkipCountInDownload)
  const setAutoCloudSave = useSessionStore((s) => s.setAutoCloudSave)

  return (
    <DeckOverlayPanel
      title={t('settings.title')}
      className={className}
      bodyClassName="flex max-w-[36rem] flex-col gap-[0.85rem]"
      closeAriaLabel={t('settings.close')}
    >
      <ThemeButtons />
      <LocaleButtons />

      <CheckboxOption
        checked={autoplayAfterStop}
        onCheckedChange={setAutoplayAfterStop}
      >
        {t('settings.autoplay')}
      </CheckboxOption>
      <OptionGroup title={t('settings.skipCountIn')}>
        <CheckboxOption
          title={t('settings.skipCountIn.play.hint')}
          checked={skipCountInPlayback}
          onCheckedChange={setSkipCountInPlayback}
        >
          {t('settings.skipCountIn.play')}
        </CheckboxOption>
        <CheckboxOption
          title={t('settings.skipCountIn.download.hint')}
          checked={skipCountInDownload}
          onCheckedChange={setSkipCountInDownload}
        >
          {t('settings.skipCountIn.download')}
        </CheckboxOption>
      </OptionGroup>

      {user ? (
        <CheckboxOption
          title={t('settings.autoCloudSave.hint')}
          checked={autoCloudSave}
          onCheckedChange={(on) => {
            writeAutoCloudSave(on)
            setAutoCloudSave(on)
          }}
        >
          {t('settings.autoCloudSave')}
        </CheckboxOption>
      ) : null}

      <ClientOnly
        fallback={
          <SettingsDevices title={t('settings.devices')}>
            <SettingsNote hidden={!prefersHeadphonesHint()}>
              {t('settings.devices.mobileNote')}
            </SettingsNote>
          </SettingsDevices>
        }
      >
        {() => <SettingsAudioDevices />}
      </ClientOnly>
    </DeckOverlayPanel>
  )
}
