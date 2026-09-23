import {
  downloadSelectedMix,
  seekMixTo,
  toggleMixPlayPause,
} from '../lib/sessionActions.client'
import { getPlaybackSources } from '../lib/audio/runtime.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { IconDownload, IconPause, IconPlay, IconRestart } from './icons'

type MixTransportProps = {
  className?: string
}

export function MixTransport({ className }: MixTransportProps) {
  useLocale()
  const tracks = useSessionStore((s) => s.tracks)
  const state = useSessionStore((s) => s.state)
  const mixPaused = useSessionStore((s) => s.mixPaused)
  const mixExporting = useSessionStore((s) => s.mixExporting)
  const playingTrackIds = useSessionStore((s) => s.playingTrackIds)
  const enabledTrackIds = useSessionStore((s) => s.enabledTrackIds)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)

  const visible = tracks.length > 0 && state !== 'recording'
  if (!visible) return null

  const hasPlayback =
    getPlaybackSources().length > 0 || playingTrackIds.length > 0
  const isPausedOrIdle = !hasPlayback || mixPaused
  const playLabel = isPausedOrIdle ? t('mix.play') : t('mix.pause')
  const enabled = new Set(enabledTrackIds)
  const canDownload =
    !mixExporting &&
    tracks.some((track) => enabled.has(track.id) && track.blob.size > 0)
  const playing = !isPausedOrIdle

  return (
    <div
      className={cn(
        'col-start-2 m-0 inline-flex min-w-0 items-center justify-center gap-[0.55rem]',
        className,
      )}
    >
      <Button
        variant="round"
        className="h-[2.75rem] w-[2.75rem] [&_svg]:size-[1.15rem]"
        icon={<IconRestart />}
        disabled={tracks.length === 0}
        aria-label={t('mix.restart')}
        title={t('mix.restart')}
        onClick={() => void seekMixTo(0)}
      />
      <Button
        variant="round"
        className={cn(
          'h-[3.6rem] w-[3.6rem] [&_svg]:size-[1.45rem]',
          playing
            ? 'border-line bg-transparent text-ink hover:enabled:border-ink hover:enabled:bg-ink hover:enabled:text-on-ink'
            : 'border-0 bg-ink text-on-ink hover:enabled:bg-ink/90 hover:enabled:text-on-ink',
        )}
        icon={isPausedOrIdle ? <IconPlay /> : <IconPause />}
        disabled={tracks.length === 0}
        aria-label={playLabel}
        aria-pressed={playing}
        title={withShortcut(playLabel, 'Espace', keyboardHintsEnabled)}
        onClick={() => void toggleMixPlayPause()}
      />
      <Button
        variant="round"
        className="h-[2.75rem] w-[2.75rem] shrink-0 bg-surface shadow-none aria-busy:opacity-55 [&_svg]:size-[1.15rem]"
        icon={<IconDownload />}
        disabled={!canDownload}
        aria-busy={mixExporting}
        aria-label={t('mix.download')}
        title={withShortcut(
          t('mix.download.hint'),
          'T / D',
          keyboardHintsEnabled,
        )}
        onClick={() => void downloadSelectedMix()}
      />
    </div>
  )
}
