import { prefersHeadphonesHint } from '../lib/audio/runtime'
import { useSessionStore } from '../store/sessionStore'
import { DeckOverlayPanel } from './DeckOverlayPanel'
import { HelpSection, HelpText } from './HelpSection'
import {
  HelpShortcutRow,
  HelpShortcutsCategory,
  HelpShortcutsTable,
} from './HelpShortcuts'

type HelpPanelProps = {
  className?: string
}

export function HelpPanel({ className }: HelpPanelProps) {
  const keyboardHintsEnabled = useSessionStore((s) => s.keyboardHintsEnabled)
  // Aide : hors mobile, afficher même si la 1re touche n’a pas encore activé les hints
  const showShortcuts = !prefersHeadphonesHint() || keyboardHintsEnabled

  return (
    <DeckOverlayPanel
      title="Aide"
      className={className}
      bodyClassName="flex flex-col gap-5"
      closeAriaLabel="Fermer l'aide"
    >
      <HelpSection title="Personnalisation">
        <HelpText>
          Le nom du projet se modifie en haut, en cliquant sur le titre
          <span hidden={!showShortcuts}> (ou avec F2)</span>. Le nom de chaque
          piste se modifie aussi en cliquant dessus dans la liste.
        </HelpText>
        <HelpText>
          Ces noms servent au fichier MP3 téléchargé : le titre du projet, et —
          si toutes les pistes ne sont pas sélectionnées — les noms des pistes
          exportées, par exemple «&nbsp;Ma polyphonie_Basses 1 - Basses
          2.mp3&nbsp;».
        </HelpText>
      </HelpSection>

      <HelpSection title="Synchronisation">
        <HelpText>
          Pour caler les pistes entre elles, la première (référence) doit
          commencer par quatre marquages nets et réguliers (1-2-3-4, ou tout
          signal audible en 4 temps). Les pistes suivantes ne reprennent que les
          3ème et 4ème temps, puis la voix. PolyRecorder s’en sert pour mesurer
          et corriger automatiquement le décalage dû à la latence audio.
        </HelpText>
        <HelpText>
          Des bruits parasites peuvent empêcher la reconnaissance du 1-2-3-4.
          Dans ce cas, mieux vaut recommencer l’enregistrement de zéro pour
          repartir sur une bonne piste de référence : sinon tout devra être calé
          à la main. Idem pour le 3-4 des pistes suivantes : un marquage peu
          clair ou noyé dans le bruit fausse le calage auto de cette prise.
        </HelpText>
      </HelpSection>

      <HelpSection title="Raccourcis clavier" hidden={!showShortcuts}>
        <HelpShortcutsTable>
          <HelpShortcutsCategory>Enregistrement</HelpShortcutsCategory>
          <HelpShortcutRow keys="E / R" action="Enregistrer" />
          <HelpShortcutRow keys="S / N" action="Piste suivante" />
          <HelpShortcutRow keys="Suppr" action="Annuler la prise" />
          <HelpShortcutRow keys="Entrée" action="Stop" />
          <HelpShortcutsCategory>Lecture</HelpShortcutsCategory>
          <HelpShortcutRow keys="Espace" action="Play / Pause" />
          <HelpShortcutsCategory>Téléchargement</HelpShortcutsCategory>
          <HelpShortcutRow keys="T / D" action="Télécharger le MP3" />
          <HelpShortcutsCategory>Général</HelpShortcutsCategory>
          <HelpShortcutRow keys="F2" action="Éditer le titre" />
          <HelpShortcutRow keys="Échap" action="Fermer Aide / Paramètres" />
        </HelpShortcutsTable>
      </HelpSection>
    </DeckOverlayPanel>
  )
}
