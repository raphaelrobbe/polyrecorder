import { useEffect } from 'react'
import { prefersHeadphonesHint } from '../lib/audio/runtime.client'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import {
  applyInputMonitorSelection,
  applySinkMonitorSelection,
  applySinkPlaybackSelection,
  refreshDeviceSnapshot,
} from '../lib/sessionActions.client'
import { useSessionStore } from '../store/sessionStore'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { CheckboxOption, OptionGroup } from './CheckboxOption'
import { LocaleButtons } from './LocaleButtons'
import { ThemeButtons } from './ThemeButtons'
import {
  SettingsDeviceCols,
  SettingsDeviceField,
  SettingsDeviceSection,
  SettingsDevices,
  SettingsNote,
  SettingsSelect,
} from './SettingsDevices'

type SettingsPanelProps = {
  className?: string
}

export function SettingsPanel({ className }: SettingsPanelProps) {
  useLocale()
  const autoplayAfterStop = useSessionStore((s) => s.autoplayAfterStop)
  const skipCountInPlayback = useSessionStore((s) => s.skipCountInPlayback)
  const skipCountInDownload = useSessionStore((s) => s.skipCountInDownload)
  const setAutoplayAfterStop = useSessionStore((s) => s.setAutoplayAfterStop)
  const setSkipCountInPlayback = useSessionStore((s) => s.setSkipCountInPlayback)
  const setSkipCountInDownload = useSessionStore((s) => s.setSkipCountInDownload)
  const sinkSelectable = useSessionStore((s) => s.sinkSelectable)
  const deviceSelectable = useSessionStore((s) => s.deviceSelectable)
  const outputOptions = useSessionStore((s) => s.outputOptions)
  const inputOptions = useSessionStore((s) => s.inputOptions)
  const sinkMonitorId = useSessionStore((s) => s.sinkMonitorId)
  const sinkPlaybackId = useSessionStore((s) => s.sinkPlaybackId)
  const inputMonitorId = useSessionStore((s) => s.inputMonitorId)
  const inputOverrideNote = useSessionStore((s) => s.inputOverrideNote)

  const showMobileNote = prefersHeadphonesHint()
  const showDesktopDevices = !showMobileNote

  useEffect(() => {
    void refreshDeviceSnapshot()

    const onDeviceChange = () => {
      void refreshDeviceSnapshot()
    }
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange)
    return () => {
      navigator.mediaDevices?.removeEventListener?.(
        'devicechange',
        onDeviceChange,
      )
    }
  }, [])

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

      <SettingsDevices title={t('settings.devices')}>
        <SettingsNote hidden={!showMobileNote}>
          {t('settings.devices.mobileNote')}
        </SettingsNote>

        <div hidden={!showDesktopDevices}>
          <SettingsDeviceSection
            title={t('settings.devices.playback')}
            hint={t('settings.devices.playback.hint')}
          >
            <SettingsDeviceCols columns={2} hidden={!sinkSelectable}>
              <SettingsDeviceField label={t('settings.devices.duringRecord')}>
                <SettingsSelect
                  aria-label={t('settings.devices.sinkMonitor')}
                  value={sinkMonitorId}
                  onChange={(event) =>
                    applySinkMonitorSelection(event.target.value)
                  }
                >
                  {outputOptions.map((option) => (
                    <option key={option.deviceId} value={option.deviceId}>
                      {option.label}
                    </option>
                  ))}
                </SettingsSelect>
              </SettingsDeviceField>
              <SettingsDeviceField label={t('settings.devices.duringPlayback')}>
                <SettingsSelect
                  aria-label={t('settings.devices.sinkPlayback')}
                  value={sinkPlaybackId}
                  onChange={(event) =>
                    applySinkPlaybackSelection(event.target.value)
                  }
                >
                  {outputOptions.map((option) => (
                    <option key={option.deviceId} value={option.deviceId}>
                      {option.label}
                    </option>
                  ))}
                </SettingsSelect>
              </SettingsDeviceField>
            </SettingsDeviceCols>
            <SettingsNote hidden={sinkSelectable}>
              {t('settings.devices.sinkUnsupported')}
            </SettingsNote>
          </SettingsDeviceSection>

          <SettingsDeviceSection
            title={t('settings.devices.record')}
            hint={t('settings.devices.record.hint')}
          >
            <SettingsDeviceCols columns={1}>
              <SettingsDeviceField>
                <SettingsSelect
                  aria-label={t('settings.devices.inputMonitor')}
                  value={inputMonitorId}
                  disabled={!deviceSelectable && inputOptions.length === 0}
                  onChange={(event) =>
                    applyInputMonitorSelection(event.target.value)
                  }
                >
                  {inputOptions.map((option) => (
                    <option key={option.deviceId} value={option.deviceId}>
                      {option.label}
                    </option>
                  ))}
                </SettingsSelect>
              </SettingsDeviceField>
            </SettingsDeviceCols>
            <SettingsNote hidden={!inputOverrideNote}>
              {inputOverrideNote}
            </SettingsNote>
          </SettingsDeviceSection>
        </div>
      </SettingsDevices>
    </DeckOverlayPanel>
  )
}
