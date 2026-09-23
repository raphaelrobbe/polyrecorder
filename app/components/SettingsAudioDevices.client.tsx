import { useEffect } from 'react'
import { prefersHeadphonesHint } from '../lib/deviceHint'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import {
  applyInputMonitorSelection,
  applySinkMonitorSelection,
  applySinkPlaybackSelection,
  refreshDeviceSnapshot,
} from '../lib/sessionActions.client'
import { useSessionStore } from '../store/sessionStore'
import {
  SettingsDeviceCols,
  SettingsDeviceField,
  SettingsDeviceSection,
  SettingsDevices,
  SettingsNote,
  SettingsSelect,
} from './SettingsDevices'

/** Client-only audio device pickers (enumerateDevices / sinkId). */
export default function SettingsAudioDevices() {
  useLocale()
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
  )
}
