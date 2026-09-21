import { useSessionStore } from '../store/sessionStore'
import { cn } from '../lib/utils'

type MarkingHelpProps = {
  className?: string
}

export function MarkingHelp({ className }: MarkingHelpProps) {
  const markingOpen = useSessionStore((s) => s.markingOpen)
  const patch = useSessionStore((s) => s.patch)

  return (
    <div
      className={cn(
        'relative mt-[0.35rem] overflow-hidden rounded-[18px] border border-[rgba(15,61,62,0.16)] bg-transparent p-0 text-[0.82rem] leading-[1.4] text-ink-soft',
        className,
      )}
    >
      <button
        type="button"
        className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-none border-0 bg-transparent px-[1.05rem] py-[0.85rem] text-left font-[inherit] text-inherit hover:bg-[rgba(15,61,62,0.05)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(15,61,62,0.35)] focus-visible:-outline-offset-2"
        data-marking-accordion
        aria-expanded={markingOpen}
        aria-controls="marking-help-panel"
        onClick={() => patch({ markingOpen: !markingOpen })}
      >
        <span className="min-w-0 flex-auto text-[0.9rem] font-bold tracking-[0.01em] leading-[1.35] text-ink">
          Mode d'emploi
        </span>
        <svg
          className="h-[1.15rem] w-[1.15rem] shrink-0 text-ink-soft transition-transform duration-[180ms] ease-in-out group-aria-expanded:rotate-180"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z"
          />
        </svg>
      </button>
      <div
        className="px-[1.05rem] pb-4"
        id="marking-help-panel"
        data-marking-panel
        hidden={!markingOpen}
      >
        <ul className="m-0 list-disc list-outside pl-[1.15rem] [&_li+li]:mt-[0.35rem]">
          <li>cliquer sur le bouton rouge « Enregistrer »</li>
          <li>
            à haute voix et de manière régulière, dire 1-2-3-4 (ou quoi que ce
            soit d’audible en 4 temps) puis chanter la première voix
          </li>
          <li>
            cliquer sur le bouton « Piste suivante » (chevron vers la droite), on
            passe directement à l’enregistrement de la deuxième voix
          </li>
          <li>
            ne répéter que les 3ème et 4ème temps à haute voix puis chanter la
            deuxième voix
          </li>
          <li>recommencer pour les voix suivantes</li>
          <li>
            cliquer sur le bouton rouge « Stop » à la fin de la dernière voix
          </li>
        </ul>
        <p className="mt-[0.85rem] mb-0 rounded-xl border border-[rgba(15,61,62,0.1)] bg-[rgba(15,61,62,0.06)] px-[0.8rem] py-[0.7rem] text-[0.8rem] leading-[1.4] text-ink-soft">
          Les navigateurs et le matériel audio introduisent une latence (casque,
          micro, buffer). Sans repères communs, les prises se décalent. Les
          quatre marquages de la piste de référence et les «&nbsp;3-4&nbsp;» des
          pistes suivantes permettent à PolyRecorder de mesurer et corriger ce
          décalage automatiquement. Des sons nets, espacés et réguliers donnent
          un meilleur calage ; une battue irrégulière ou peu audible peut
          fausser la synchronisation.
        </p>
      </div>
    </div>
  )
}
