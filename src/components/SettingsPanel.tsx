import { useEffect } from 'react'
import { prefersHeadphonesHint } from '../lib/audio/runtime'
import { useTheme } from '../hooks/useTheme'
import type { ThemePreference } from '../lib/theme'
import {
  applyInputMonitorSelection,
  applySinkMonitorSelection,
  applySinkPlaybackSelection,
  refreshDeviceSnapshot,
} from '../lib/sessionActions'
import { useSessionStore } from '../store/sessionStore'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { CheckboxOption, OptionGroup } from './CheckboxOption'
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
  const { preference, setPreference } = useTheme()

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
      title="Paramètres"
      className={className}
      bodyClassName="flex max-w-[36rem] flex-col gap-[0.85rem]"
      closeAriaLabel="Fermer les paramètres"
    >
      <SettingsDeviceField label="Apparence">
        <SettingsSelect
          aria-label="Thème d'apparence"
          value={preference}
          onChange={(event) => {
            setPreference(event.target.value as ThemePreference)
          }}
        >
          <option value="system">Automatique (navigateur)</option>
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </SettingsSelect>
      </SettingsDeviceField>

      <CheckboxOption
        checked={autoplayAfterStop}
        onCheckedChange={setAutoplayAfterStop}
      >
        Lire automatiquement après la fin de l'enregistrement
      </CheckboxOption>
      <OptionGroup title="Supprimer le 1-2-3-4">
        <CheckboxOption
          title="La lecture commence juste après le « 4 »"
          checked={skipCountInPlayback}
          onCheckedChange={setSkipCountInPlayback}
        >
          à la lecture
        </CheckboxOption>
        <CheckboxOption
          title="Le MP3 commence juste après le « 4 »"
          checked={skipCountInDownload}
          onCheckedChange={setSkipCountInDownload}
        >
          au téléchargement du mp3
        </CheckboxOption>
      </OptionGroup>

      <SettingsDevices title="Périphériques audio">
        <SettingsNote hidden={!showMobileNote}>
          Sur téléphone ou tablette, choisir une entrée ou une sortie depuis le
          navigateur pose plus de problèmes que ça n’en résout (casque Bluetooth
          mal détecté, son coupé, micro imposé par le système…). Branche plutôt
          un casque : le téléphone gère la route audio.
        </SettingsNote>

        <div hidden={!showDesktopDevices}>
          <SettingsDeviceSection
            title="Lecture"
            hint="Pour éviter que le micro reprenne le son lu : utilise un casque."
          >
            <SettingsDeviceCols columns={2} hidden={!sinkSelectable}>
              <SettingsDeviceField label="pendant l'enregistrement">
                <SettingsSelect
                  aria-label="Sortie pendant l'enregistrement"
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
              <SettingsDeviceField label="en lecture">
                <SettingsSelect
                  aria-label="Sortie en lecture"
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
              Ce navigateur ne permet pas de choisir la sortie audio depuis la
              page. Branche un casque pour le monitoring, ou change la sortie
              dans les réglages du système.
            </SettingsNote>
          </SettingsDeviceSection>

          <SettingsDeviceSection
            title="Enregistrement"
            hint="Micro utilisé pour capturer les prises. Les libellés apparaissent après l’autorisation d’accès."
          >
            <SettingsDeviceCols columns={1}>
              <SettingsDeviceField>
                <SettingsSelect
                  aria-label="Micro pendant l'enregistrement"
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
