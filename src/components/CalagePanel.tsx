import { useEffect, useRef } from 'react'
import { formatSignedMs } from '../lib/format'
import { updateLatencyTrim } from '../lib/sessionActions'
import { cn } from '../lib/utils'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { MsOffsetEditor } from './MsOffsetEditor'

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
  const trimDelta =
    latencyTrimMs === 0 ? null : `(${formatSignedMs(latencyTrimMs)})`

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
    <div ref={panelRef} className={cn('relative mt-[0.85rem] mb-0.5', className)}>
      <div className="flex flex-nowrap items-start gap-[0.4rem] max-sm:gap-[0.3rem]">
        <span className="shrink-0 pt-[0.28rem] text-[0.84rem] font-semibold text-ink-soft max-sm:text-[0.78rem]">
          Avance de lecture
        </span>
        <Button
          variant="round"
          className="mt-[0.22rem] h-[1.25rem] w-[1.25rem] shrink-0 border-ink/22 text-[0.72rem] font-bold text-ink-soft hover:enabled:border-ink/35 hover:enabled:bg-ink/6 hover:enabled:text-ink aria-expanded:border-ink/35 aria-expanded:bg-ink/6 aria-expanded:text-ink max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
          aria-expanded={calageTipOpen}
          aria-controls="calage-info-tip"
          title="À propos de l'avance de lecture"
          onClick={(event) => {
            event.stopPropagation()
            patch({ calageTipOpen: !calageTipOpen })
          }}
        >
          ?
        </Button>
        <div className="ml-auto inline-flex flex-col items-center">
          <MsOffsetEditor
            title="Ajuster l'avance de lecture du monitoring"
            value={total}
            onChange={(next) =>
              updateLatencyTrim(Math.max(0, next) - lastReportedLatencyMs)
            }
            minusAriaLabel="Démarrer le monitoring un peu plus tôt (−5 ms)"
            plusAriaLabel="Démarrer le monitoring un peu plus tard (+5 ms)"
            inputAriaLabel="Avance de lecture en millisecondes"
            inputProps={{ 'data-latency-trim': true }}
          />
          <small
            className={cn(
              'mt-[0.08rem] min-h-[1.15em] text-center text-[0.62rem] font-semibold leading-[1.25] tabular-nums text-ink-soft',
              !trimDelta && 'invisible',
            )}
          >
            {trimDelta || '\u00a0'}
          </small>
        </div>
      </div>
      <p
        className="mt-[0.55rem] mb-0 text-[0.78rem] leading-[1.4] text-ink-soft max-sm:text-[0.72rem]"
        id="calage-info-tip"
        hidden={!calageTipOpen}
      >
        Pendant « Piste suivante », les prises déjà faites sont rejouées dans le
        casque avec un peu de latence matérielle. PolyRecorder démarre cette
        écoute un peu plus tôt pour que ta nouvelle voix tombe au bon endroit sur
        la timeline. Ajuste la valeur (±5&nbsp;ms ou saisie directe) si le
        monitoring te paraît encore en retard ou en avance (réglage mémorisé sur
        cet appareil). Ce n’est pas le calage auto des pistes (marquages 3–4) :
        celui-ci sert uniquement pendant l’enregistrement.
      </p>
    </div>
  )
}
