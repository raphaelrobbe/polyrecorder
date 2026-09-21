import { useEffect, useRef } from 'react'
import { formatSignedMs } from '../lib/format'
import { updateLatencyTrim } from '../lib/sessionActions'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'

type CalagePanelProps = {
  className?: string
}

export function CalagePanel({ className }: CalagePanelProps) {
  const calageMode = useSessionStore((s) => s.calageMode)
  const calageTipOpen = useSessionStore((s) => s.calageTipOpen)
  const latencyTrimMs = useSessionStore((s) => s.latencyTrimMs)
  const lastReportedLatencyMs = useSessionStore((s) => s.lastReportedLatencyMs)
  const patch = useSessionStore((s) => s.patch)
  const panelRef = useRef<HTMLDivElement>(null)

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
      if (panelRef.current && !panelRef.current.contains(target)) {
        patch({ calageTipOpen: false })
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [calageTipOpen, patch])

  if (!calageMode) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        'relative mt-[1.1rem] mb-1 rounded-2xl border border-line bg-[rgba(15,61,62,0.03)] px-[0.95rem] py-[0.85rem]',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-[0.65rem]">
        <div className="inline-flex items-center gap-[0.4rem]">
          <span className="text-[0.78rem] font-bold tracking-[0.08em] uppercase text-ink-soft">
            Gestion du calage
          </span>
          <Button
            variant="round"
            className="h-[1.35rem] w-[1.35rem] border-[rgba(15,61,62,0.28)] text-[0.78rem] font-bold text-ink-soft hover:enabled:border-[rgba(15,61,62,0.4)] hover:enabled:bg-[rgba(15,61,62,0.08)] hover:enabled:text-ink aria-expanded:border-[rgba(15,61,62,0.4)] aria-expanded:bg-[rgba(15,61,62,0.08)] aria-expanded:text-ink"
            aria-expanded={calageTipOpen}
            aria-controls="calage-info-tip"
            title="À propos de la gestion du calage"
            onClick={(event) => {
              event.stopPropagation()
              patch({ calageTipOpen: !calageTipOpen })
            }}
          >
            ?
          </Button>
        </div>
        <div className="inline-flex items-center gap-[0.4rem]">
          <Button
            variant="trim"
            title="Démarrer le monitoring un peu plus tôt (−5 ms)"
            onClick={() => updateLatencyTrim(latencyTrimMs - 5)}
          >
            −5 ms
          </Button>
          <span className="min-w-[9.5rem] text-center text-[0.82rem] font-bold tabular-nums">
            {trimLabel}
          </span>
          <Button
            variant="trim"
            title="Démarrer le monitoring un peu plus tard (+5 ms)"
            onClick={() => updateLatencyTrim(latencyTrimMs + 5)}
          >
            +5 ms
          </Button>
        </div>
      </div>
      <p
        className="mt-[0.7rem] mb-0 rounded-xl bg-[rgba(15,61,62,0.06)] px-[0.8rem] py-[0.7rem] text-[0.8rem] leading-[1.4] text-ink-soft"
        id="calage-info-tip"
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
