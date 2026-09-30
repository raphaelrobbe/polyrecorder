import {
  downloadSelectedMix,
  setCutPlaybackRate,
  stopMixToStart,
  toggleMixPlayPause,
} from '../lib/sessionActions.client'
import { getPlaybackSources } from '../lib/audio/runtime.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { withShortcut } from '../lib/withShortcut'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { IconDownload, IconPause, IconPlay, IconStop } from './icons'

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
  const cutMode = useSessionStore((s) => s.cutMode)
  const cutPlaybackRate = useSessionStore((s) => s.cutPlaybackRate)
  const cutMerging = useSessionStore((s) => s.cutMerging)

  const visible = tracks.length > 0 && state !== 'recording'
  if (!visible) return null

  const hasPlayback =
    getPlaybackSources().length > 0 || playingTrackIds.length > 0
  const isPausedOrIdle = !hasPlayback || mixPaused
  const playLabel = isPausedOrIdle ? t('mix.play') : t('mix.pause')
  const enabled = new Set(enabledTrackIds)
  const canDownload =
    !mixExporting &&
    !cutMerging &&
    tracks.some((track) => enabled.has(track.id) && track.blob.size > 0)
  const playing = !isPausedOrIdle

  return (
    <div
      className={cn(
        'col-start-2 m-0 flex min-w-0 flex-col items-center gap-[0.3rem]',
        className,
      )}
    >
      <div className="inline-flex min-w-0 items-center justify-center gap-[0.55rem]">
        <Button
          variant="round"
          className="h-[2.75rem] w-[2.75rem] [&_svg]:size-[1.15rem]"
          icon={<IconStop />}
          disabled={tracks.length === 0 || cutMerging}
          aria-label={t('mix.stop')}
          title={t('mix.stop')}
          onClick={() => stopMixToStart()}
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
          disabled={tracks.length === 0 || cutMerging}
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
      {cutMode ? (
        <div
          className="flex items-center gap-[0.22rem]"
          role="group"
          aria-label={t('cut.rate.aria')}
        >
          <Button
            type="button"
            variant="trim"
            className={cn(
              'min-w-[2.35rem] border-ink/14 px-[0.35rem] py-[0.2rem] text-[0.68rem] font-semibold tabular-nums text-ink/55',
              'hover:enabled:border-ink/22 hover:enabled:bg-ink/5 hover:enabled:text-ink-soft',
              cutPlaybackRate === 0.25 &&
                'border-mode-cut bg-mode-cut text-on-mode-cut hover:enabled:border-mode-cut hover:enabled:bg-mode-cut hover:enabled:text-on-mode-cut',
            )}
            disabled={cutMerging}
            aria-pressed={cutPlaybackRate === 0.25}
            title={t('cut.rate.quarter')}
            aria-label={t('cut.rate.quarter')}
            onClick={() => setCutPlaybackRate(0.25)}
          >
            ×0.25
          </Button>
          <Button
            type="button"
            variant="trim"
            className={cn(
              'min-w-[2.35rem] border-ink/14 px-[0.35rem] py-[0.2rem] text-[0.68rem] font-semibold tabular-nums text-ink/55',
              'hover:enabled:border-ink/22 hover:enabled:bg-ink/5 hover:enabled:text-ink-soft',
              cutPlaybackRate === 0.5 &&
                'border-mode-cut bg-mode-cut text-on-mode-cut hover:enabled:border-mode-cut hover:enabled:bg-mode-cut hover:enabled:text-on-mode-cut',
            )}
            disabled={cutMerging}
            aria-pressed={cutPlaybackRate === 0.5}
            title={t('cut.rate.half')}
            aria-label={t('cut.rate.half')}
            onClick={() => setCutPlaybackRate(0.5)}
          >
            ×0.5
          </Button>
        </div>
      ) : null}
    </div>
  )
}
