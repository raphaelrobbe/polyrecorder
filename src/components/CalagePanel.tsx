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
      : `${total} ms (${formatSignedMs(latencyTrimMs)})`

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
      <div className="flex flex-nowrap items-center gap-[0.4rem] max-sm:gap-[0.3rem]">
        <span className="shrink-0 text-[0.84rem] font-semibold text-ink-soft max-sm:text-[0.78rem]">
          Avance de lecture
        </span>
        <Button
          variant="round"
          className="h-[1.25rem] w-[1.25rem] shrink-0 border-ink/22 text-[0.72rem] font-bold text-ink-soft hover:enabled:border-ink/35 hover:enabled:bg-ink/6 hover:enabled:text-ink aria-expanded:border-ink/35 aria-expanded:bg-ink/6 aria-expanded:text-ink max-sm:h-[1.15rem] max-sm:w-[1.15rem] max-sm:text-[0.68rem]"
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
        <div className="ml-auto inline-flex min-w-0 items-center gap-[0.35rem] max-sm:gap-[0.22rem]">
          <Button
            variant="trim"
            className="px-[0.55rem] py-[0.32rem] text-[0.78rem] max-sm:px-[0.4rem] max-sm:py-[0.24rem] max-sm:text-[0.72rem]"
            title="Démarrer le monitoring un peu plus tôt (−5 ms)"
            onClick={() => updateLatencyTrim(latencyTrimMs - 5)}
          >
            −5&nbsp;ms
          </Button>
          <span className="min-w-0 max-w-[8.5rem] truncate text-center text-[0.84rem] font-semibold tabular-nums text-ink max-sm:max-w-[7.5rem] max-sm:text-[0.76rem]">
            {trimLabel}
          </span>
          <Button
            variant="trim"
            className="px-[0.55rem] py-[0.32rem] text-[0.78rem] max-sm:px-[0.4rem] max-sm:py-[0.24rem] max-sm:text-[0.72rem]"
            title="Démarrer le monitoring un peu plus tard (+5 ms)"
            onClick={() => updateLatencyTrim(latencyTrimMs + 5)}
          >
            +5&nbsp;ms
          </Button>
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
        la timeline. Les boutons ±5&nbsp;ms ajustent ce correctif si le monitoring
        te paraît encore en retard ou en avance (réglage mémorisé sur cet
        appareil). Ce n’est pas le calage auto des pistes (marquages 3–4) :
        celui-ci sert uniquement pendant l’enregistrement.
      </p>
    </div>
  )
}
