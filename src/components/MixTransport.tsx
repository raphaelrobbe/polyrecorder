import {
  downloadSelectedMix,
  seekMixTo,
  toggleMixPlayPause,
} from '../lib/sessionActions'
import { getPlaybackSources } from '../lib/audio/runtime'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useSessionStore } from '../store/sessionStore'

export function MixTransport() {
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
  const playLabel = isPausedOrIdle ? 'Lecture' : 'Pause'
  const enabled = new Set(enabledTrackIds)
  const canDownload =
    !mixExporting &&
    tracks.some((track) => enabled.has(track.id) && track.blob.size > 0)

  return (
    <div className="mix-transport" data-mix-transport>
      <button
        type="button"
        className="btn btn-restart"
        data-restart-mix
        disabled={tracks.length === 0}
        aria-label="Revenir au début"
        title="Revenir au début"
        onClick={() => void seekMixTo(0)}
      >
        <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        className="btn btn-play"
        data-play-mix
        disabled={tracks.length === 0}
        aria-label={playLabel}
        aria-pressed={!isPausedOrIdle}
        title={withShortcut(playLabel, 'Espace', keyboardHintsEnabled)}
        onClick={() => void toggleMixPlayPause()}
      >
        {isPausedOrIdle ? (
          <svg className="icon icon-play" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7z" fill="currentColor" />
          </svg>
        ) : (
          <svg
            className="icon icon-pause"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor" />
          </svg>
        )}
      </button>
      <div className="mix-export">
        <button
          type="button"
          className="btn btn-download"
          data-download-mix
          disabled={!canDownload}
          aria-busy={mixExporting}
          aria-label="Télécharger le mix (MP3)"
          title={withShortcut(
            'Télécharger le mix des pistes sélectionnées (MP3)',
            'T / D',
            keyboardHintsEnabled,
          )}
          data-title-base="Télécharger le mix des pistes sélectionnées (MP3)"
          onClick={() => void downloadSelectedMix()}
        >
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M11 4h2v8.2l2.6-2.6 1.4 1.4L12 16l-5-5 1.4-1.4L11 12.2V4zM5 18h14v2H5v-2z"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
