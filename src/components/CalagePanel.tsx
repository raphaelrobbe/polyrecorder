import { useEffect } from 'react'
import { formatSignedMs } from '../lib/format'
import { updateLatencyTrim } from '../lib/sessionActions'
import { useSessionStore } from '../store/sessionStore'

export function CalagePanel() {
  const calageMode = useSessionStore((s) => s.calageMode)
  const calageTipOpen = useSessionStore((s) => s.calageTipOpen)
  const latencyTrimMs = useSessionStore((s) => s.latencyTrimMs)
  const lastReportedLatencyMs = useSessionStore((s) => s.lastReportedLatencyMs)
  const patch = useSessionStore((s) => s.patch)

  const total = Math.max(0, lastReportedLatencyMs + latencyTrimMs)
  const trimLabel =
    latencyTrimMs === 0
      ? `${total} ms`
      : `${total} ms (correctif ${formatSignedMs(latencyTrimMs)})`

  useEffect(() => {
    if (!calageTipOpen) return
    const onDocClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      const panel = document.querySelector('[data-calage]')
      if (panel && !panel.contains(target)) {
        patch({ calageTipOpen: false })
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [calageTipOpen, patch])

  if (!calageMode) return null

  return (
    <div className="calage" data-calage>
      <div className="calage-top">
        <div className="calage-heading">
          <span className="calage-title">Gestion du calage</span>
          <button
            type="button"
            className="btn-info"
            data-calage-info
            aria-expanded={calageTipOpen}
            aria-controls="calage-info-tip"
            title="À propos de la gestion du calage"
            onClick={(event) => {
              event.stopPropagation()
              patch({ calageTipOpen: !calageTipOpen })
            }}
          >
            ?
          </button>
        </div>
        <div className="calage-controls">
          <button
            type="button"
            className="btn btn-trim"
            data-trim-delta="-5"
            title="Démarrer le monitoring un peu plus tôt (−5 ms)"
            onClick={() => updateLatencyTrim(latencyTrimMs - 5)}
          >
            −5 ms
          </button>
          <span className="calage-value" data-trim-value>
            {trimLabel}
          </span>
          <button
            type="button"
            className="btn btn-trim"
            data-trim-delta="5"
            title="Démarrer le monitoring un peu plus tard (+5 ms)"
            onClick={() => updateLatencyTrim(latencyTrimMs + 5)}
          >
            +5 ms
          </button>
        </div>
      </div>
      <p
        className="calage-tip"
        id="calage-info-tip"
        data-calage-tip
        hidden={!calageTipOpen}
      >
        Pendant « Piste suivante », les prises déjà faites sont rejouées dans le
        casque avec un peu de latence matérielle. PolyRecorder démarre cette
        écoute un peu plus tôt pour que ta nouvelle voix tombe au bon endroit sur
        la timeline. Les boutons ±5&nbsp;ms ajustent ce correctif si le monitoring
        te paraît encore en retard ou en avance (réglage mémorisé sur cet
        appareil). Ce n’est pas le calage auto des pistes (marquages 3–4) :
        celui-ci sert uniquement pendant l’enregistrement.
      </p>
    </div>
  )
}
