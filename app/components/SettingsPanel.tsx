import { useEffect, useRef, useState } from 'react'
import { ClientOnly } from 'remix-utils/client-only'
import { useRouteLoaderData } from '@remix-run/react'
import { prefersHeadphonesHint } from '../lib/deviceHint'
import { writeAutoCloudSave } from '../lib/cloudPrefs'
import {
  readAlignPrefs,
  writeAlignPrefs,
  type AlignPrefs,
} from '../lib/alignPrefs'
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
  const autoCloudSave = useSessionStore((s) => s.autoCloudSave)
  const setAutoplayAfterStop = useSessionStore((s) => s.setAutoplayAfterStop)
  const setAutoCloudSave = useSessionStore((s) => s.setAutoCloudSave)
  const [defaults, setDefaults] = useState<AlignPrefs>(() => readAlignPrefs())
  const [calageWarningsTipOpen, setCalageWarningsTipOpen] = useState(false)
  const [autoAlignTipOpen, setAutoAlignTipOpen] = useState(false)
  const calageWarningsTipRef = useRef<HTMLDivElement>(null)
  const autoAlignTipRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!autoAlignTipOpen) return
    const onDocClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (
        autoAlignTipRef.current &&
        !autoAlignTipRef.current.contains(target)
      ) {
        setAutoAlignTipOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [autoAlignTipOpen])

  const patchDefaults = (partial: Partial<AlignPrefs>) => {
    writeAlignPrefs(partial)
    setDefaults((prev) => ({ ...prev, ...partial }))
  }

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

      <OptionGroup title={t('settings.defaultsForNewProjects')} stack>
        <div ref={autoAlignTipRef}>
          <div className="flex items-start gap-[0.4rem]">
            <CheckboxOption
              className="min-w-0 flex-1"
              checked={defaults.autoAlignEnabled}
              onCheckedChange={(on) => patchDefaults({ autoAlignEnabled: on })}
            >
              {t('settings.autoAlign')}
            </CheckboxOption>
            <Button
              variant="round"
              className="mt-[0.12rem] h-[1.25rem] w-[1.25rem] shrink-0 border-ink/22 text-[0.72rem] font-bold text-ink-soft hover:enabled:border-ink/35 hover:enabled:bg-ink/6 hover:enabled:text-ink aria-expanded:border-ink/35 aria-expanded:bg-ink/6 aria-expanded:text-ink max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
              aria-expanded={autoAlignTipOpen}
              aria-controls="settings-auto-align-tip"
              title={t('settings.autoAlign.about')}
              onClick={(event) => {
                event.stopPropagation()
                setAutoAlignTipOpen((open) => !open)
              }}
            >
              ?
            </Button>
          </div>
          <p
            className="mt-[0.55rem] mb-0 text-[0.78rem] leading-[1.4] text-ink-soft max-sm:text-[0.72rem]"
            id="settings-auto-align-tip"
            hidden={!autoAlignTipOpen}
          >
            {t('settings.autoAlign.tip')}
          </p>
        </div>

        {defaults.autoAlignEnabled ? (
          <div ref={calageWarningsTipRef}>
            <div className="flex items-start gap-[0.4rem]">
              <CheckboxOption
                className="min-w-0 flex-1"
                checked={defaults.showCalageWarnings}
                onCheckedChange={(on) =>
                  patchDefaults({ showCalageWarnings: on })
                }
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
        ) : null}

        <OptionGroup title={t('settings.skipCountIn')}>
          <CheckboxOption
            title={t('settings.skipCountIn.play.hint')}
            checked={defaults.skipCountInPlayback}
            onCheckedChange={(on) =>
              patchDefaults({ skipCountInPlayback: on })
            }
          >
            {t('settings.skipCountIn.play')}
          </CheckboxOption>
          <CheckboxOption
            title={t('settings.skipCountIn.download.hint')}
            checked={defaults.skipCountInDownload}
            onCheckedChange={(on) =>
              patchDefaults({ skipCountInDownload: on })
            }
          >
            {t('settings.skipCountIn.download')}
          </CheckboxOption>
        </OptionGroup>
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
