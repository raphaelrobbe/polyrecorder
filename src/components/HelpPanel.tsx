import { useEffect, useRef } from 'react'
import { withShortcut } from '../hooks/useKeyboardShortcuts'
import { useDeckStore } from '../store/deckStore'
import { useSessionStore } from '../store/sessionStore'

export function HelpPanel() {
  const leaveDeckOverlay = useDeckStore((s) => s.leaveDeckOverlay)
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className="deck-help" data-deck-help>
      <button
        ref={closeRef}
        type="button"
        className="btn-deck-icon btn-close-panel"
        data-close-help
        aria-label="Fermer l'aide"
        title={withShortcut('Fermer', 'Échap', keyboardHintsEnabled)}
        data-title-base="Fermer"
        onClick={() => leaveDeckOverlay()}
      >
        ×
      </button>
      <h2 className="settings-title">Aide</h2>
      <div className="help-sections">
        <section className="help-section">
          <h3 className="help-section-title">Personnalisation</h3>
          <p className="help-text">
            Le nom du projet se modifie en haut, en cliquant sur le titre
            <span data-help-f2-hint hidden={!keyboardHintsEnabled}>
              {' '}
              (ou avec F2)
            </span>
            . Le nom de chaque piste se modifie aussi en cliquant dessus dans la
            liste.
          </p>
          <p className="help-text">
            Ces noms servent au fichier MP3 téléchargé : le titre du projet, et —
            si toutes les pistes ne sont pas sélectionnées — les noms des pistes
            exportées, par exemple «&nbsp;Ma polyphonie_Basses 1 - Basses
            2.mp3&nbsp;».
          </p>
        </section>
        <section className="help-section">
          <h3 className="help-section-title">Synchronisation</h3>
          <p className="help-text">
            Pour caler les pistes entre elles, la première (référence) doit
            commencer par quatre marquages nets et réguliers (1-2-3-4, ou tout
            signal audible en 4 temps). Les pistes suivantes ne reprennent que
            les 3ème et 4ème temps, puis la voix. PolyRecorder s’en sert pour
            mesurer et corriger automatiquement le décalage dû à la latence
            audio.
          </p>
          <p className="help-text">
            Des bruits parasites peuvent empêcher la reconnaissance du 1-2-3-4.
            Dans ce cas, mieux vaut recommencer l’enregistrement de zéro pour
            repartir sur une bonne piste de référence : sinon tout devra être
            calé à la main. Idem pour le 3-4 des pistes suivantes : un marquage
            peu clair ou noyé dans le bruit fausse le calage auto de cette prise.
          </p>
        </section>
        <section
          className="help-section"
          data-help-shortcuts
          hidden={!keyboardHintsEnabled}
        >
          <h3 className="help-section-title">Raccourcis clavier</h3>
          <table className="help-shortcuts-table">
            <tbody>
              <tr className="help-shortcuts-category">
                <td colSpan={2}>Enregistrement</td>
              </tr>
              <tr>
                <td>E / R</td>
                <td>Enregistrer</td>
              </tr>
              <tr>
                <td>S / N</td>
                <td>Piste suivante</td>
              </tr>
              <tr>
                <td>Suppr</td>
                <td>Annuler la prise</td>
              </tr>
              <tr>
                <td>Entrée</td>
                <td>Stop</td>
              </tr>
              <tr className="help-shortcuts-category">
                <td colSpan={2}>Lecture</td>
              </tr>
              <tr>
                <td>Espace</td>
                <td>Play / Pause</td>
              </tr>
              <tr className="help-shortcuts-category">
                <td colSpan={2}>Téléchargement</td>
              </tr>
              <tr>
                <td>T / D</td>
                <td>Télécharger le MP3</td>
              </tr>
              <tr className="help-shortcuts-category">
                <td colSpan={2}>Général</td>
              </tr>
              <tr>
                <td>F2</td>
                <td>Éditer le titre</td>
              </tr>
              <tr>
                <td>Échap</td>
                <td>Fermer Aide / Paramètres</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}
