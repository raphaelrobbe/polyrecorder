import { useSessionStore } from '../store/sessionStore'

export function MarkingHelp() {
  const markingOpen = useSessionStore((s) => s.markingOpen)
  const patch = useSessionStore((s) => s.patch)

  return (
    <div
      className={`marking-help${markingOpen ? ' is-open' : ''}`}
      data-marking-help
    >
      <button
        type="button"
        className="marking-help-toggle"
        data-marking-accordion
        aria-expanded={markingOpen}
        aria-controls="marking-help-panel"
        onClick={() => patch({ markingOpen: !markingOpen })}
      >
        <span className="marking-help-title">Mode d'emploi</span>
        <svg
          className="marking-help-chevron"
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
        className="marking-help-panel"
        id="marking-help-panel"
        data-marking-panel
        hidden={!markingOpen}
      >
        <ul className="marking-help-steps">
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
        <p className="marking-tip">
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
