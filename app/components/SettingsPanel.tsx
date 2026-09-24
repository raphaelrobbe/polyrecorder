import { useEffect, useRef, useState } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { useRouteLoaderData } from '@remix-run/react'
import { prefersHeadphonesHint } from '../lib/deviceHint'
import { writeAutoCloudSave } from '../lib/cloudPrefs'
import { refreshSkewWarning } from '../lib/sessionActions.client'
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
import { Button } from './Button'

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
  const showCalageWarnings = useSessionStore((s) => s.showCalageWarnings)
  const autoCloudSave = useSessionStore((s) => s.autoCloudSave)
  const setAutoplayAfterStop = useSessionStore((s) => s.setAutoplayAfterStop)
  const setSkipCountInPlayback = useSessionStore((s) => s.setSkipCountInPlayback)
  const setSkipCountInDownload = useSessionStore((s) => s.setSkipCountInDownload)
  const setShowCalageWarnings = useSessionStore((s) => s.setShowCalageWarnings)
  const setAutoCloudSave = useSessionStore((s) => s.setAutoCloudSave)
  const [calageWarningsTipOpen, setCalageWarningsTipOpen] = useState(false)
  const calageWarningsTipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!calageWarningsTipOpen) return
    const onDocClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        calageWarningsTipRef.current &&
        !calageWarningsTipRef.current.contains(target)
      ) {
        setCalageWarningsTipOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [calageWarningsTipOpen])

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

      <div ref={calageWarningsTipRef}>
        <div className="flex items-start gap-[0.4rem]">
          <CheckboxOption
            className="min-w-0 flex-1"
            checked={showCalageWarnings}
            onCheckedChange={(on) => {
              setShowCalageWarnings(on)
              refreshSkewWarning()
            }}
          >
            {t('settings.showCalageWarnings')}
          </CheckboxOption>
          <Button
            variant="round"
            className="mt-[0.12rem] h-[1.25rem] w-[1.25rem] shrink-0 border-ink/22 text-[0.72rem] font-bold text-ink-soft hover:enabled:border-ink/35 hover:enabled:bg-ink/6 hover:enabled:text-ink aria-expanded:border-ink/35 aria-expanded:bg-ink/6 aria-expanded:text-ink max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
            aria-expanded={calageWarningsTipOpen}
            aria-controls="settings-calage-warnings-tip"
            title={t('settings.showCalageWarnings.about')}
            onClick={(event) => {
              event.stopPropagation()
              setCalageWarningsTipOpen((open) => !open)
            }}
          >
            ?
          </Button>
        </div>
        <p
          className="mt-[0.55rem] mb-0 text-[0.78rem] leading-[1.4] text-ink-soft max-sm:text-[0.72rem]"
          id="settings-calage-warnings-tip"
          hidden={!calageWarningsTipOpen}
        >
          {t('settings.showCalageWarnings.tip')}
        </p>
      </div>

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
