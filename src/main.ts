import './style.css'
import { encodeAudioBufferToMp3 } from './mp3-encode'

type AppState = 'idle' | 'recording' | 'playing'

type Track = {
  id: number
  name: string
  blob: Blob
  url: string
  durationMs: number
  /**
   * Position on the mix timeline (ms).
   * Positive = start later (take began after mix t0).
   * Negative = skip the beginning (take began before mix t0 / pre-roll).
   */
  offsetMs: number
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('Missing #app root')
}

app.innerHTML = `
  <main class="stage">
    <header class="brand">
      <h1>PolyRecorder</h1>
      <p>Enregistre, superpose, écoute, télécharge.</p>
    </header>

    <section class="deck" aria-label="Enregistreur" data-deck>
      <div class="deck-main" data-deck-main>
      <div class="status">
        <input
          type="text"
          class="session-title is-default-name"
          data-session-title
          value="Ma polyphonie"
          maxlength="60"
          aria-label="Titre de l'enregistrement"
          title="Titre de l'enregistrement"
          data-title-base="Titre de l'enregistrement"
          spellcheck="false"
        />
        <div class="timer" data-timer hidden>00:00</div>
      </div>

      <div class="capture-bar" data-capture-bar>
        <div class="meter" data-meter-wrap hidden aria-hidden="true"><span data-meter></span></div>
        <div class="mix-transport" data-mix-transport hidden>
          <button type="button" class="btn btn-restart" data-restart-mix disabled aria-label="Revenir au début" title="Revenir au début">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" fill="currentColor"/>
            </svg>
          </button>
          <button type="button" class="btn btn-play" data-play-mix disabled aria-label="Lecture" title="Lecture">
            <svg class="icon icon-play" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <svg class="icon icon-pause" viewBox="0 0 24 24" aria-hidden="true" hidden>
              <path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor"/>
            </svg>
          </button>
          <div class="mix-export">
            <button
              type="button"
              class="btn btn-download"
              data-download-mix
              disabled
              aria-label="Télécharger le mix (MP3)"
              title="Télécharger le mix des pistes sélectionnées (MP3)"
              data-title-base="Télécharger le mix des pistes sélectionnées (MP3)"
            >
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M11 4h2v8.2l2.6-2.6 1.4 1.4L12 16l-5-5 1.4-1.4L11 12.2V4zM5 18h14v2H5v-2z"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="capture-actions" data-controls>
          <button
            type="button"
            class="btn btn-transport btn-next"
            data-next
            hidden
            disabled
            aria-label="Piste suivante"
            title="Piste suivante : rejoue cette prise et enregistre la suivante en même temps."
            data-title-base="Piste suivante : rejoue cette prise et enregistre la suivante en même temps."
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M5.5 5.5v13l9.5-6.5-9.5-6.5zm11 0h2.5v13H16.5V5.5z"/>
            </svg>
          </button>
          <button
            type="button"
            class="btn btn-transport btn-discard"
            data-discard
            hidden
            disabled
            aria-label="Annuler la prise et recommencer"
            title="Annuler la prise et recommencer"
            data-title-base="Annuler la prise et recommencer"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M9 3h6l1 2h5v2H3V5h5l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM6 9h2v9H6V9zm1 12c-.6 0-1-.4-1-1l1-11h10l1 11c0 .6-.4 1-1 1H7z"/>
            </svg>
          </button>
          <button
            type="button"
            class="btn btn-transport btn-record"
            data-record
            aria-label="Enregistrer"
            title="Enregistrer"
            data-title-base="Enregistrer"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="6.5" fill="currentColor"/>
            </svg>
          </button>
          <button
            type="button"
            class="btn btn-transport btn-stop"
            data-stop
            hidden
            disabled
            aria-label="Stop"
            title="Stop"
            data-title-base="Stop"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="tracks" data-tracks-panel hidden>
        <p class="mix-clock" data-mix-clock>00:00.000</p>
        <div
          class="mix-seek"
          data-mix-seek
          role="slider"
          tabindex="0"
          aria-label="Position de lecture"
          aria-valuemin="0"
          aria-valuenow="0"
          aria-valuemax="0"
        >
          <div class="mix-seek-fill" data-mix-seek-fill></div>
        </div>
        <p class="ref-peaks" data-ref-peaks hidden></p>
        <div class="tracks-master-row">
          <span class="tracks-master-drag" aria-hidden="true"></span>
          <label class="track-mute" title="Activer / couper toutes les pistes">
            <input type="checkbox" data-select-all aria-label="Activer toutes les pistes" />
            <span class="track-mute-icon" aria-hidden="true">
              <svg class="icon-speaker-on" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/>
              </svg>
              <svg class="icon-speaker-off" viewBox="0 0 24 24">
                <path fill="currentColor" d="M3.63 3.63 2.22 5.04 6.18 9H3v6h4l5 5v-6.96l4.57 4.57A7 7 0 0 1 14 18.7v2.06a9 9 0 0 0 3.33-1.68l2.63 2.63 1.41-1.41L3.63 3.63zM16.5 12c0-.77-.2-1.5-.54-2.14l1.5-1.5A6.9 6.9 0 0 1 18.5 12a6.9 6.9 0 0 1-.8 3.22l1.52 1.52A8.9 8.9 0 0 0 20.5 12c0-2.8-1.28-5.3-3.3-6.93l-1.47 1.47A6.95 6.95 0 0 1 16.5 12zM12 4 9.91 6.09 12 8.18V4z"/>
              </svg>
            </span>
          </label>
          <div class="tracks-master-spacer">
            <button
              type="button"
              class="btn btn-trash btn-trash-all"
              data-delete-all-tracks
              aria-label="Supprimer toutes les pistes"
              title="Supprimer toutes les pistes"
            >
              ×
            </button>
          </div>
          <label class="track-check track-check-align" data-align-header hidden title="Activer / désactiver le calage auto (sauf piste 1)">
            <input type="checkbox" data-align-all aria-label="Calage auto sur toutes les pistes" />
            <span class="track-check-box" aria-hidden="true"></span>
          </label>
          <span class="tracks-master-nudge" data-align-nudge-spacer hidden aria-hidden="true"></span>
        </div>
        <ul data-tracks></ul>
      </div>

      <div class="skew-warning" data-skew-warning hidden title="Un calage auto supérieur à 300 ms indique souvent un problème de sync (marquages peu clairs, latence, etc.). Ouvre le mode calage pour inspecter et ajuster.">
        <button type="button" class="btn-skew-close" data-dismiss-skew aria-label="Fermer" title="Fermer">×</button>
        <strong>Attention</strong>
        <span data-skew-warning-text></span>
        <button type="button" class="btn btn-skew" data-open-advanced>Ouvrir le mode calage</button>
      </div>

      <p class="error" data-error hidden></p>

      <div class="calage" data-calage hidden>
        <div class="calage-top">
          <div class="calage-heading">
            <span class="calage-title">Gestion du calage</span>
            <button
              type="button"
              class="btn-info"
              data-calage-info
              aria-expanded="false"
              aria-controls="calage-info-tip"
              title="À propos de la gestion du calage"
            >
              ?
            </button>
          </div>
          <div class="calage-controls">
            <button type="button" class="btn btn-trim" data-trim-delta="-5" title="Démarrer le monitoring un peu plus tôt (−5 ms)">
              −5 ms
            </button>
            <span class="calage-value" data-trim-value>…</span>
            <button type="button" class="btn btn-trim" data-trim-delta="5" title="Démarrer le monitoring un peu plus tard (+5 ms)">
              +5 ms
            </button>
          </div>
        </div>
        <p class="calage-tip" id="calage-info-tip" data-calage-tip hidden>
          Pendant « Piste suivante », les prises déjà faites sont rejouées dans le casque avec un peu de latence matérielle.
          PolyRecorder démarre cette écoute un peu plus tôt pour que ta nouvelle voix tombe au bon endroit sur la timeline.
          Les boutons ±5&nbsp;ms ajustent ce correctif si le monitoring te paraît encore en retard ou en avance
          (réglage mémorisé sur cet appareil). Ce n’est pas le calage auto des pistes (marquages 3–4) : celui-ci sert uniquement pendant l’enregistrement.
        </p>
      </div>
      </div>

      <div class="deck-settings" data-deck-settings hidden>
        <button
          type="button"
          class="btn-deck-icon btn-close-panel"
          data-close-settings
          aria-label="Fermer les paramètres"
          title="Fermer"
          data-title-base="Fermer"
        >
          ×
        </button>
        <h2 class="settings-title">Paramètres</h2>
        <div class="settings-options">
          <label class="autoplay-option" data-autoplay-wrap>
            <input type="checkbox" data-autoplay-after-stop checked />
            <span>Lire automatiquement après la fin de l'enregistrement</span>
          </label>
          <div class="settings-skip-count" data-skip-count-in-wrap>
            <span class="settings-skip-count-title">Supprimer le 1-2-3-4</span>
            <div class="settings-skip-count-options">
              <label class="autoplay-option" title="La lecture commence juste après le « 4 »">
                <input type="checkbox" data-skip-count-in-playback checked />
                <span>à la lecture</span>
              </label>
              <label class="autoplay-option" title="Le MP3 commence juste après le « 4 »">
                <input type="checkbox" data-skip-count-in-download checked />
                <span>au téléchargement du mp3</span>
              </label>
            </div>
          </div>

          <div class="settings-devices">
            <h3 class="settings-devices-title">Périphériques audio</h3>

            <p class="settings-note" data-devices-mobile-note hidden>
              Sur téléphone ou tablette, choisir une entrée ou une sortie depuis le navigateur
              pose plus de problèmes que ça n’en résout (casque Bluetooth mal détecté, son coupé, micro imposé par le système…).
              Branche plutôt un casque : le téléphone gère la route audio.
            </p>

            <div data-devices-desktop>
              <div class="settings-devices-section" data-sink-settings>
                <h4 class="settings-devices-subtitle">Lecture</h4>
                <p class="settings-group-hint">
                  Pour éviter que le micro reprenne le son lu : utilise un casque.
                </p>
                <div class="settings-devices-cols" data-sink-selects>
                  <label class="settings-device-col" data-sink-monitor-wrap>
                    <span class="settings-device-col-title">pendant l'enregistrement</span>
                    <select
                      class="settings-select"
                      data-sink-monitor
                      aria-label="Sortie pendant l'enregistrement"
                    ></select>
                  </label>
                  <label class="settings-device-col" data-sink-playback-wrap>
                    <span class="settings-device-col-title">en lecture</span>
                    <select
                      class="settings-select"
                      data-sink-playback
                      aria-label="Sortie en lecture"
                    ></select>
                  </label>
                </div>
                <p class="settings-note" data-sink-unsupported hidden>
                  Ce navigateur ne permet pas de choisir la sortie audio depuis la page.
                  Branche un casque pour le monitoring, ou change la sortie dans les réglages du système.
                </p>
              </div>

              <div class="settings-devices-section">
                <h4 class="settings-devices-subtitle">Enregistrement</h4>
                <p class="settings-group-hint">
                  Micro utilisé pour capturer les prises. Les libellés apparaissent après l’autorisation d’accès.
                </p>
                <div class="settings-devices-cols settings-devices-cols--single">
                  <label class="settings-device-col" data-input-monitor-wrap>
                    <select
                      class="settings-select"
                      data-input-monitor
                      aria-label="Micro pendant l'enregistrement"
                    ></select>
                  </label>
                </div>
                <p class="settings-note" data-input-override-note hidden></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="deck-help" data-deck-help hidden>
        <button
          type="button"
          class="btn-deck-icon btn-close-panel"
          data-close-help
          aria-label="Fermer l'aide"
          title="Fermer"
          data-title-base="Fermer"
        >
          ×
        </button>
        <h2 class="settings-title">Aide</h2>
        <div class="help-sections">
          <section class="help-section">
            <h3 class="help-section-title">Personnalisation</h3>
            <p class="help-text">
              Le nom du projet se modifie en haut, en cliquant sur le titre<span data-help-f2-hint hidden> (ou avec F2)</span>.
              Le nom de chaque piste se modifie aussi en cliquant dessus dans la liste.
            </p>
            <p class="help-text">
              Ces noms servent au fichier MP3 téléchargé : le titre du projet, et — si toutes les pistes ne sont pas sélectionnées — les noms des pistes exportées, par exemple
              «&nbsp;Ma polyphonie_Basses 1 - Basses 2.mp3&nbsp;».
            </p>
          </section>
          <section class="help-section">
            <h3 class="help-section-title">Synchronisation</h3>
            <p class="help-text">
              Pour caler les pistes entre elles, la première (référence) doit commencer par quatre marquages nets et réguliers
              (1-2-3-4, ou tout signal audible en 4 temps). Les pistes suivantes ne reprennent que les 3ème et 4ème temps, puis la voix.
              PolyRecorder s’en sert pour mesurer et corriger automatiquement le décalage dû à la latence audio.
            </p>
            <p class="help-text">
              Des bruits parasites peuvent empêcher la reconnaissance du 1-2-3-4. Dans ce cas, mieux vaut recommencer l’enregistrement de zéro pour repartir sur une bonne piste de référence :
              sinon tout devra être calé à la main. Idem pour le 3-4 des pistes suivantes : un marquage peu clair ou noyé dans le bruit
              fausse le calage auto de cette prise.
            </p>
          </section>
          <section class="help-section" data-help-shortcuts hidden>
            <h3 class="help-section-title">Raccourcis clavier</h3>
            <table class="help-shortcuts-table">
              <tbody>
                <tr class="help-shortcuts-category">
                  <td colspan="2">Enregistrement</td>
                </tr>
                <tr><td>E / R</td><td>Enregistrer</td></tr>
                <tr><td>S / N</td><td>Piste suivante</td></tr>
                <tr><td>Suppr</td><td>Annuler la prise</td></tr>
                <tr><td>Entrée</td><td>Stop</td></tr>
                <tr class="help-shortcuts-category">
                  <td colspan="2">Lecture</td>
                </tr>
                <tr><td>Espace</td><td>Play / Pause</td></tr>
                <tr class="help-shortcuts-category">
                  <td colspan="2">Téléchargement</td>
                </tr>
                <tr><td>T / D</td><td>Télécharger le MP3</td></tr>
                <tr class="help-shortcuts-category">
                  <td colspan="2">Général</td>
                </tr>
                <tr><td>F2</td><td>Éditer le titre</td></tr>
                <tr><td>Échap</td><td>Fermer Aide / Paramètres</td></tr>
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </section>

    <div class="marking-help" data-marking-help>
      <button
        type="button"
        class="marking-help-toggle"
        data-marking-accordion
        aria-expanded="false"
        aria-controls="marking-help-panel"
      >
        <span class="marking-help-title">Mode d'emploi</span>
        <svg class="marking-help-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z"/>
        </svg>
      </button>
      <div class="marking-help-panel" id="marking-help-panel" data-marking-panel hidden>
        <ul class="marking-help-steps">
          <li>cliquer sur le bouton rouge « Enregistrer »</li>
          <li>à haute voix et de manière régulière, dire 1-2-3-4 (ou quoi que ce soit d’audible en 4 temps) puis chanter la première voix</li>
          <li>cliquer sur le bouton « Piste suivante » (chevron vers la droite), on passe directement à l’enregistrement de la deuxième voix</li>
          <li>ne répéter que les 3ème et 4ème temps à haute voix puis chanter la deuxième voix</li>
          <li>recommencer pour les voix suivantes</li>
          <li>cliquer sur le bouton rouge « Stop » à la fin de la dernière voix</li>
        </ul>
        <p class="marking-tip">
          Les navigateurs et le matériel audio introduisent une latence (casque, micro, buffer). Sans repères communs, les prises se décalent.
          Les quatre marquages de la piste de référence et les «&nbsp;3-4&nbsp;» des pistes suivantes permettent à PolyRecorder de mesurer et corriger ce décalage automatiquement.
          Des sons nets, espacés et réguliers donnent un meilleur calage ; une battue irrégulière ou peu audible peut fausser la synchronisation.
        </p>
      </div>
    </div>

    <div class="mode-row">
      <label class="mode-toggle" data-calage-mode-wrap hidden>
        <input type="checkbox" data-calage-mode />
        <span>Mode calage</span>
      </label>
      <div class="utility-actions">
        <button
          type="button"
          class="btn-utility"
          data-open-help
          aria-label="Aide"
          title="Aide"
        >
          <span class="btn-utility-glyph" aria-hidden="true">?</span>
          <span>Aide</span>
        </button>
        <button
          type="button"
          class="btn-utility"
          data-open-settings
          aria-label="Paramètres"
          title="Paramètres"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.62l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.2 7.2 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.49-.41h-3.84a.5.5 0 0 0-.49.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.74 8.86a.5.5 0 0 0 .12.62l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.62l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54a.5.5 0 0 0 .49.41h3.84a.5.5 0 0 0 .49-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.62l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"
            />
          </svg>
          <span>Paramètres</span>
        </button>
      </div>
    </div>

    <p class="hint" data-hint></p>
  </main>
`

const els = {
  sessionTitle: app.querySelector<HTMLInputElement>('[data-session-title]')!,
  timer: app.querySelector<HTMLElement>('[data-timer]')!,
  captureBar: app.querySelector<HTMLElement>('[data-capture-bar]')!,
  meterWrap: app.querySelector<HTMLElement>('[data-meter-wrap]')!,
  meter: app.querySelector<HTMLElement>('[data-meter]')!,
  controls: app.querySelector<HTMLElement>('[data-controls]')!,
  record: app.querySelector<HTMLButtonElement>('[data-record]')!,
  next: app.querySelector<HTMLButtonElement>('[data-next]')!,
  discard: app.querySelector<HTMLButtonElement>('[data-discard]')!,
  stop: app.querySelector<HTMLButtonElement>('[data-stop]')!,
  tracksPanel: app.querySelector<HTMLElement>('[data-tracks-panel]')!,
  tracks: app.querySelector<HTMLUListElement>('[data-tracks]')!,
  selectAll: app.querySelector<HTMLInputElement>('[data-select-all]')!,
  deleteAllTracks: app.querySelector<HTMLButtonElement>('[data-delete-all-tracks]')!,
  playMix: app.querySelector<HTMLButtonElement>('[data-play-mix]')!,
  restartMix: app.querySelector<HTMLButtonElement>('[data-restart-mix]')!,
  downloadMix: app.querySelector<HTMLButtonElement>('[data-download-mix]')!,
  mixTransport: app.querySelector<HTMLElement>('[data-mix-transport]')!,
  skipCountInWrap: app.querySelector<HTMLElement>('[data-skip-count-in-wrap]')!,
  skipCountInPlayback: app.querySelector<HTMLInputElement>('[data-skip-count-in-playback]')!,
  skipCountInDownload: app.querySelector<HTMLInputElement>('[data-skip-count-in-download]')!,
  deckMain: app.querySelector<HTMLElement>('[data-deck-main]')!,
  deckSettings: app.querySelector<HTMLElement>('[data-deck-settings]')!,
  deckHelp: app.querySelector<HTMLElement>('[data-deck-help]')!,
  openSettings: app.querySelector<HTMLButtonElement>('[data-open-settings]')!,
  closeSettings: app.querySelector<HTMLButtonElement>('[data-close-settings]')!,
  openHelp: app.querySelector<HTMLButtonElement>('[data-open-help]')!,
  closeHelp: app.querySelector<HTMLButtonElement>('[data-close-help]')!,
  helpShortcuts: app.querySelector<HTMLElement>('[data-help-shortcuts]')!,
  helpF2Hint: app.querySelector<HTMLElement>('[data-help-f2-hint]')!,
  deck: app.querySelector<HTMLElement>('[data-deck]')!,
  autoplayWrap: app.querySelector<HTMLElement>('[data-autoplay-wrap]')!,
  autoplayAfterStop: app.querySelector<HTMLInputElement>('[data-autoplay-after-stop]')!,
  sinkMonitor: app.querySelector<HTMLSelectElement>('[data-sink-monitor]')!,
  sinkPlayback: app.querySelector<HTMLSelectElement>('[data-sink-playback]')!,
  sinkMonitorWrap: app.querySelector<HTMLElement>('[data-sink-monitor-wrap]')!,
  sinkPlaybackWrap: app.querySelector<HTMLElement>('[data-sink-playback-wrap]')!,
  sinkSelects: app.querySelector<HTMLElement>('[data-sink-selects]')!,
  sinkUnsupported: app.querySelector<HTMLElement>('[data-sink-unsupported]')!,
  devicesDesktop: app.querySelector<HTMLElement>('[data-devices-desktop]')!,
  devicesMobileNote: app.querySelector<HTMLElement>('[data-devices-mobile-note]')!,
  inputOverrideNote: app.querySelector<HTMLElement>('[data-input-override-note]')!,
  inputMonitor: app.querySelector<HTMLSelectElement>('[data-input-monitor]')!,
  playIcon: app.querySelector<SVGElement>('.icon-play')!,
  pauseIcon: app.querySelector<SVGElement>('.icon-pause')!,
  mixClock: app.querySelector<HTMLElement>('[data-mix-clock]')!,
  mixSeek: app.querySelector<HTMLElement>('[data-mix-seek]')!,
  mixSeekFill: app.querySelector<HTMLElement>('[data-mix-seek-fill]')!,
  calageMode: app.querySelector<HTMLInputElement>('[data-calage-mode]')!,
  calageModeWrap: app.querySelector<HTMLElement>('[data-calage-mode-wrap]')!,
  calagePanel: app.querySelector<HTMLElement>('[data-calage]')!,
  calageInfo: app.querySelector<HTMLButtonElement>('[data-calage-info]')!,
  calageTip: app.querySelector<HTMLElement>('[data-calage-tip]')!,
  trimValue: app.querySelector<HTMLElement>('[data-trim-value]')!,
  alignAll: app.querySelector<HTMLInputElement>('[data-align-all]')!,
  alignHeader: app.querySelector<HTMLElement>('[data-align-header]')!,
  alignNudgeSpacer: app.querySelector<HTMLElement>('[data-align-nudge-spacer]')!,
  refPeaks: app.querySelector<HTMLElement>('[data-ref-peaks]')!,
  skewWarning: app.querySelector<HTMLElement>('[data-skew-warning]')!,
  skewWarningText: app.querySelector<HTMLElement>('[data-skew-warning-text]')!,
  dismissSkew: app.querySelector<HTMLButtonElement>('[data-dismiss-skew]')!,
  openAdvanced: app.querySelector<HTMLButtonElement>('[data-open-advanced]')!,
  markingHelp: app.querySelector<HTMLElement>('[data-marking-help]')!,
  markingAccordion: app.querySelector<HTMLButtonElement>('[data-marking-accordion]')!,
  markingPanel: app.querySelector<HTMLElement>('[data-marking-panel]')!,
  error: app.querySelector<HTMLElement>('[data-error]')!,
  hint: app.querySelector<HTMLElement>('[data-hint]')!,
  stage: app.querySelector<HTMLElement>('.stage')!,
}

const MIX_LOOKAHEAD_S = 0.12
/** Fallback when the browser reports no output latency (seconds). */
const DEFAULT_MONITOR_LATENCY_S = 0.045
const LATENCY_TRIM_KEY = 'polyrecorder.latencyTrimMs'
const SINK_MONITOR_KEY = 'polyrecorder.sinkMonitor'
const SINK_PLAYBACK_KEY = 'polyrecorder.sinkPlayback'
const INPUT_MONITOR_KEY = 'polyrecorder.inputMonitor'
const OFFSET_WARN_MS = 300
const MAX_RECORDING_MS = 5 * 60 * 1000

type AudioSinkMode = 'monitor' | 'playback'

type AudioContextWithSink = AudioContext & {
  setSinkId: (sinkId: string) => Promise<void>
  readonly sinkId?: string
}
let state: AppState = 'idle'
let sessionStopping = false
let mediaStream: MediaStream | null = null
let activeRecording: {
  recorder: MediaRecorder
  chunks: BlobPart[]
  onData: (event: BlobEvent) => void
} | null = null
let tracks: Track[] = []
let trackCounter = 0
let startedAt = 0
let timerId: number | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let meterSource: MediaStreamAudioSourceNode | null = null
let meterRaf: number | null = null
let playbackSources: AudioBufferSourceNode[] = []
let playbackGain: GainNode | null = null
let bufferCache = new Map<number, AudioBuffer>()
let playingTrackIds = new Set<number>()
let enabledTrackIds = new Set<number>()
let autoAlignTrackIds = new Set<number>()
/** Track used as sync reference for auto-align (independent of display order). */
let referenceTrackId: number | null = null
let trackGains = new Map<number, GainNode>()
let calageMode = false
let keyboardHintsEnabled = window.matchMedia(
  '(hover: hover) and (pointer: fine)',
).matches
let mixListenActive = false
let mixPaused = false
let playWaiters: Array<() => void> = []
let preferMimeType = ''
let pendingTakeOffsetMs = 0
let mixEpochPerf: number | null = null
let mixTimelineStartCtx: number | null = null
let trackPlayheads = new Map<
  number,
  { when: number; skipS: number; lengthS: number }
>()
let playheadRaf: number | null = null
let overdubArmTimer: number | null = null
let pendingRecording: {
  recorder: MediaRecorder
  chunks: BlobPart[]
  onData: (event: BlobEvent) => void
} | null = null
let latencyTrimMs = loadLatencyTrimMs()
let sinkMonitorId = loadSinkId(SINK_MONITOR_KEY)
let sinkPlaybackId = loadSinkId(SINK_PLAYBACK_KEY)
let inputMonitorId = loadSinkId(INPUT_MONITOR_KEY)
let lastReportedLatencyMs = Math.round(DEFAULT_MONITOR_LATENCY_S * 1000)
let skewWarningDismissedKey = ''
let refPeaksLabel = ''
/** 4th count-in peak time (seconds) in the reference track buffer. */
let refPeakFourSec: number | null = null
/** Warning about reference 1-2-3-4 count-in quality. */
let referenceBeatWarning: {
  key: string
  message: string
  reason: 'missing' | 'irregular' | 'error'
} | null = null
let referenceBeatDismissedKey = ''
let trackAlignDetails = new Map<number, { delta3Ms: number; delta4Ms: number }>()
/** Remembered mix playhead when playback is stopped. */
let mixSeekMs = 0
let seekDragActive = false
let dragTrackId: number | null = null
let touchReorder: {
  pointerId: number
  trackId: number
  startY: number
  active: boolean
} | null = null
let mixExporting = false
const SKIP_COUNT_IN_PAD_S = 0.1
const TOUCH_REORDER_THRESHOLD_PX = 10
/** Largest count-in gap may be at most 20% bigger than the smallest. */
const BEAT_GAP_MAX_RATIO = 1.2

const TOUCH_REORDER_EXCLUDE =
  'input, textarea, select, button:not(.track-drag), .track-mute, .track-check, .track-name, .track-nudge, .track-offset, [data-offset-track], [data-delete-track], [data-delete-all-tracks], [data-nudge-track], [data-auto-align-track], [data-toggle-track]'

function loadLatencyTrimMs(): number {
  try {
    const raw = localStorage.getItem(LATENCY_TRIM_KEY)
    if (raw == null) return 0
    const value = Number(raw)
    if (!Number.isFinite(value)) return 0
    return Math.max(-150, Math.min(150, Math.round(value)))
  } catch {
    return 0
  }
}

function saveLatencyTrimMs(value: number) {
  latencyTrimMs = Math.max(-150, Math.min(150, Math.round(value)))
  try {
    localStorage.setItem(LATENCY_TRIM_KEY, String(latencyTrimMs))
  } catch {
    // ignore quota / private mode
  }
  updateCalageDisplay()
}

function loadSinkId(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function saveSinkId(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    // ignore quota / private mode
  }
}

function supportsAudioSinkSelect(): boolean {
  return (
    typeof AudioContext !== 'undefined' &&
    typeof (AudioContext.prototype as AudioContextWithSink).setSinkId ===
      'function'
  )
}

/**
 * Device pickers are desktop-only: on phones/tablets, browser I/O selection
 * is unreliable (missing Bluetooth, silent playback, OS-forced mic).
 */
function allowsAudioDeviceSelect(): boolean {
  return !prefersHeadphonesHint()
}

function allowsAudioSinkSelect(): boolean {
  return supportsAudioSinkSelect() && allowsAudioDeviceSelect()
}

function currentAudioSinkMode(): AudioSinkMode {
  return state === 'recording' ? 'monitor' : 'playback'
}

function sinkIdForMode(mode: AudioSinkMode): string {
  if (!allowsAudioSinkSelect()) return ''
  return mode === 'monitor' ? sinkMonitorId : sinkPlaybackId
}

function inputIdForCapture(): string {
  return allowsAudioDeviceSelect() ? inputMonitorId : ''
}

async function applyAudioSink(mode: AudioSinkMode = currentAudioSinkMode()) {
  if (!supportsAudioSinkSelect() || !audioContext) return
  const ctx = audioContext as AudioContextWithSink
  const sinkId = sinkIdForMode(mode)
  try {
    await ctx.setSinkId(sinkId)
  } catch {
    // Device may have disappeared; fall back to default.
    if (sinkId) {
      try {
        await ctx.setSinkId('')
      } catch {
        // ignore
      }
    }
  }
}

function updateDeviceSettingsUi(apiSupported: boolean) {
  const mobile = !allowsAudioDeviceSelect()
  els.devicesMobileNote.hidden = !mobile
  els.devicesDesktop.hidden = mobile
  if (mobile) {
    setInputOverrideNote(null)
    return
  }

  const sinkSelectable = apiSupported && allowsAudioSinkSelect()
  els.sinkUnsupported.hidden = sinkSelectable
  els.sinkSelects.hidden = !sinkSelectable
}

function setInputOverrideNote(message: string | null) {
  if (!message) {
    els.inputOverrideNote.hidden = true
    els.inputOverrideNote.textContent = ''
    return
  }
  els.inputOverrideNote.hidden = false
  els.inputOverrideNote.textContent = message
}

function fillDeviceSelect(
  select: HTMLSelectElement,
  devices: MediaDeviceInfo[],
  selectedId: string,
  fallbackLabel: string,
) {
  const previous = selectedId
  select.replaceChildren()
  const defaultOption = document.createElement('option')
  defaultOption.value = ''
  defaultOption.textContent = 'Par défaut (système)'
  select.append(defaultOption)

  for (const device of devices) {
    // Skip Chromium's duplicate "default" entry; we already expose "".
    if (device.deviceId === 'default' || device.deviceId === 'communications') {
      continue
    }
    const option = document.createElement('option')
    option.value = device.deviceId
    option.textContent =
      device.label?.trim() || `${fallbackLabel} ${device.deviceId.slice(0, 6)}…`
    select.append(option)
  }

  const hasPrevious =
    previous === '' ||
    Array.from(select.options).some((option) => option.value === previous)
  select.value = hasPrevious ? previous : ''
}

/** Ask for mic access once so enumerateDevices can expose labels. */
async function unlockAudioDeviceLabels() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const inputs = devices.filter((device) => device.kind === 'audioinput')
    if (inputs.some((device) => device.label.trim())) return
  } catch {
    // continue and try getUserMedia
  }

  // Don't disturb an in-progress capture.
  if (mediaStream || state === 'recording') return

  try {
    const probe = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
    for (const track of probe.getTracks()) track.stop()
  } catch {
    // Permission denied or unavailable — lists stay unlabeled.
  }
}

async function refreshAudioDeviceOptions() {
  const apiSupported = supportsAudioSinkSelect()
  const deviceSelectable = allowsAudioDeviceSelect()
  updateDeviceSettingsUi(apiSupported)
  if (!deviceSelectable) return

  await unlockAudioDeviceLabels()

  const sinkSelectable = allowsAudioSinkSelect()

  let outputs: MediaDeviceInfo[] = []
  let inputs: MediaDeviceInfo[] = []
  try {
    // Labels are often empty until a media permission has been granted.
    const devices = await navigator.mediaDevices.enumerateDevices()
    outputs = devices.filter((device) => device.kind === 'audiooutput')
    inputs = devices.filter((device) => device.kind === 'audioinput')
  } catch {
    outputs = []
    inputs = []
  }

  if (sinkSelectable) {
    fillDeviceSelect(els.sinkMonitor, outputs, sinkMonitorId, 'Sortie')
    fillDeviceSelect(els.sinkPlayback, outputs, sinkPlaybackId, 'Sortie')

    if (els.sinkMonitor.value !== sinkMonitorId) {
      sinkMonitorId = els.sinkMonitor.value
      saveSinkId(SINK_MONITOR_KEY, sinkMonitorId)
    }
    if (els.sinkPlayback.value !== sinkPlaybackId) {
      sinkPlaybackId = els.sinkPlayback.value
      saveSinkId(SINK_PLAYBACK_KEY, sinkPlaybackId)
    }
  }

  fillDeviceSelect(els.inputMonitor, inputs, inputMonitorId, 'Micro')

  if (els.inputMonitor.value !== inputMonitorId) {
    inputMonitorId = els.inputMonitor.value
    saveSinkId(INPUT_MONITOR_KEY, inputMonitorId)
  }
}

function formatSignedMs(ms: number): string {
  const rounded = Math.round(ms)
  if (rounded > 0) return `+${rounded} ms`
  return `${rounded} ms`
}

function parseOffsetMsInput(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s*ms$/i, '').replace(/\s+/g, '')
  if (!cleaned || cleaned === '+' || cleaned === '-') return null
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return null
  return Math.round(Math.max(-120_000, Math.min(120_000, value)))
}

function applyManualTrackOffset(track: Track, offsetMs: number) {
  const wasListening = mixListenActive || playingTrackIds.size > 0
  if (wasListening) stopPlayback({ resetSeek: false })
  track.offsetMs = offsetMs
  autoAlignTrackIds.delete(track.id)
  trackAlignDetails.delete(track.id)
}

function updateCalageDisplay() {
  const total = Math.max(0, lastReportedLatencyMs + latencyTrimMs)
  els.trimValue.textContent =
    latencyTrimMs === 0
      ? `${total} ms`
      : `${total} ms (correctif ${formatSignedMs(latencyTrimMs)})`
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatCentis(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms))
  const m = Math.floor(totalMs / 60_000)
  const s = Math.floor((totalMs % 60_000) / 1000)
  const millis = totalMs % 1000
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

/** Like formatCentis, but omit minutes when they are zero (e.g. 00.420). */
function formatCentisCompact(ms: number): string {
  const totalMs = Math.max(0, Math.floor(ms))
  const m = Math.floor(totalMs / 60_000)
  const s = Math.floor((totalMs % 60_000) / 1000)
  const millis = totalMs % 1000
  const sec = `${String(s).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
  return m === 0 ? sec : `${m}:${sec}`
}

function defaultSessionTitle(): string {
  return 'Ma polyphonie'
}

function isDefaultSessionTitle(name: string): boolean {
  return name.trim() === defaultSessionTitle()
}

function getSessionTitle(): string {
  const value = els.sessionTitle.value.trim()
  return value || defaultSessionTitle()
}

function normalizeSessionTitleInput() {
  const next = els.sessionTitle.value.trim().slice(0, 60) || defaultSessionTitle()
  els.sessionTitle.value = next
  els.sessionTitle.classList.toggle('is-default-name', isDefaultSessionTitle(next))
}

function sanitizeFilenamePart(value: string): string {
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')
  return cleaned
}

function filenameFromSessionTitle(): string {
  return sanitizeFilenamePart(getSessionTitle()) || defaultSessionTitle()
}

function downloadFilenameForSelection(selected: Track[]): string {
  const title = filenameFromSessionTitle()
  // Full mix (or empty): just the session title.
  if (selected.length === 0 || selected.length === tracks.length) {
    return `${title}.mp3`
  }
  const trackParts = selected
    .map((track) => sanitizeFilenamePart(track.name) || 'piste')
    .join(' - ')
  return `${title}_${trackParts}.mp3`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function defaultTrackName(index: number): string {
  return `Piste ${index}`
}

function isDefaultTrackName(name: string): boolean {
  return /^Piste \d+$/.test(name.trim())
}

function getMixDurationMs(): number {
  let max = 0
  for (const track of tracks) {
    const delay = Math.max(0, track.offsetMs)
    const skip = Math.max(0, -track.offsetMs)
    const playable = Math.max(0, track.durationMs - skip)
    max = Math.max(max, delay + playable)
  }
  return max
}

function getMaxTrackDurationMs(): number {
  let max = 0
  for (const track of tracks) {
    max = Math.max(max, track.durationMs)
  }
  return max
}

/** Top-right timer: live while recording, otherwise longest track. Hidden with no tracks. */
function updateSessionTimer() {
  const show = state === 'recording' || tracks.length > 0
  els.timer.hidden = !show
  if (!show) return
  if (state === 'recording' || timerId !== null) return
  els.timer.textContent = formatTime(getMaxTrackDurationMs())
}

function setError(message: string | null) {
  if (!message) {
    els.error.hidden = true
    els.error.textContent = ''
    return
  }
  els.error.hidden = false
  els.error.textContent = message
}

function clearRefPeaks() {
  refPeaksLabel = ''
  refPeakFourSec = null
  referenceBeatWarning = null
  referenceBeatDismissedKey = ''
  updateRefPeaksDisplay()
}

function updateRefPeaksDisplay() {
  const show = calageMode && Boolean(refPeaksLabel)
  els.refPeaks.hidden = !show
  els.refPeaks.textContent = show ? refPeaksLabel : ''
}

function formatAlignDetail(
  offsetMs: number,
  detail: { delta3Ms: number; delta4Ms: number },
): string {
  return `${formatSignedMs(offsetMs)} (Δ3 ${formatSignedMs(detail.delta3Ms)}, Δ4 ${formatSignedMs(detail.delta4Ms)})`
}

function setCalageMode(on: boolean) {
  calageMode = on
  els.calageMode.checked = on
  els.calagePanel.hidden = true
  els.alignHeader.hidden = !on || tracks.length < 2
  els.alignNudgeSpacer.hidden = !on || tracks.length < 2
  els.openAdvanced.hidden = on
  els.stage.classList.toggle('is-advanced', on)
  if (!on) setCalageTipOpen(false)
  updateRefPeaksDisplay()
  renderTracks()
  updateMixButtons()
  if (on && tracks.length > 0) void evaluateReferenceBeat()
}

type DeckView = 'main' | 'settings' | 'help'

type DeckHistoryState = { polyrecorderDeck: DeckView }

function isDeckView(value: unknown): value is DeckView {
  return value === 'main' || value === 'settings' || value === 'help'
}

function currentDeckView(): DeckView {
  if (!els.deckSettings.hidden) return 'settings'
  if (!els.deckHelp.hidden) return 'help'
  return 'main'
}

function deckViewUrl(view: DeckView): string {
  const path = `${location.pathname}${location.search}`
  return view === 'main' ? path : `${path}#${view}`
}

function deckViewFromUrl(): DeckView {
  const raw = location.hash.replace(/^#/, '')
  return isDeckView(raw) ? raw : 'main'
}

function deckViewFromState(state: unknown): DeckView | null {
  if (!state || typeof state !== 'object') return null
  const deck = (state as DeckHistoryState).polyrecorderDeck
  return isDeckView(deck) ? deck : null
}

function applyDeckView(view: DeckView) {
  const prev = currentDeckView()

  els.deckMain.hidden = view !== 'main'
  els.deckSettings.hidden = view !== 'settings'
  els.deckHelp.hidden = view !== 'help'
  els.deck.classList.toggle('is-settings', view === 'settings')
  els.deck.classList.toggle('is-help', view === 'help')

  if (view === 'settings') {
    void refreshAudioDeviceOptions()
    els.closeSettings.focus()
  } else if (view === 'help') {
    updateHelpShortcutsVisibility()
    els.closeHelp.focus()
  } else if (prev === 'settings') {
    els.openSettings.focus()
  } else if (prev === 'help') {
    els.openHelp.focus()
  }
}

/** Navigate to a deck view and push a browser history entry. */
function navigateDeckView(view: DeckView) {
  if (currentDeckView() === view) return
  applyDeckView(view)
  history.pushState(
    { polyrecorderDeck: view } satisfies DeckHistoryState,
    '',
    deckViewUrl(view),
  )
}

function openDeckPanel(view: 'settings' | 'help') {
  navigateDeckView(view)
}

/** Échap / croix : retour à l’écran principal en ajoutant une entrée d’historique. */
function leaveDeckOverlay() {
  navigateDeckView('main')
}

function syncDeckViewFromHistory(state: unknown) {
  applyDeckView(deckViewFromState(state) ?? deckViewFromUrl())
}

function updateHelpShortcutsVisibility() {
  els.helpShortcuts.hidden = !keyboardHintsEnabled
  els.helpF2Hint.hidden = !keyboardHintsEnabled
}

function alignableTracks(): Track[] {
  return tracks.filter((track) => track.id !== referenceTrackId)
}

function getReferenceTrack(): Track | null {
  if (referenceTrackId == null) return tracks[0] ?? null
  return tracks.find((track) => track.id === referenceTrackId) ?? tracks[0] ?? null
}

function syncReferenceTrackRules() {
  if (tracks.length === 0) {
    referenceTrackId = null
    trackAlignDetails.clear()
    clearRefPeaks()
    return
  }

  const previousReferenceId = referenceTrackId
  if (
    referenceTrackId == null ||
    !tracks.some((track) => track.id === referenceTrackId)
  ) {
    referenceTrackId = tracks[0]!.id
  }

  if (previousReferenceId != null && previousReferenceId !== referenceTrackId) {
    clearRefPeaks()
  }

  autoAlignTrackIds.delete(referenceTrackId)
  trackAlignDetails.delete(referenceTrackId)
  if (tracks.length < 2) {
    trackAlignDetails.clear()
  }
  updateRefPeaksDisplay()
}

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

async function ensureAudioContext(): Promise<AudioContext> {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext()
  }
  // Do not auto-resume while the user explicitly paused the mix.
  if (audioContext.state === 'suspended' && !mixPaused) {
    await audioContext.resume()
  }
  await applyAudioSink()
  return audioContext
}

/**
 * Delay between scheduling audio and hearing it (headphones/speakers).
 * During overdub we start the monitor early by this amount so singing
 * lands on the same timeline as the recorder.
 */
function getReportedLatencyMs(ctx: AudioContext): number {
  const output = typeof ctx.outputLatency === 'number' ? ctx.outputLatency : 0
  const base = typeof ctx.baseLatency === 'number' ? ctx.baseLatency : 0
  const reported = (Math.max(0, output) + Math.max(0, base)) * 1000
  if (reported >= 5) return Math.min(reported, 250)
  return DEFAULT_MONITOR_LATENCY_S * 1000
}

function getMonitorLatencySec(ctx: AudioContext): number {
  lastReportedLatencyMs = Math.round(getReportedLatencyMs(ctx))
  updateCalageDisplay()
  const totalMs = Math.max(0, lastReportedLatencyMs + latencyTrimMs)
  return Math.min(totalMs / 1000, 0.3)
}

async function closeAudioContext() {
  stopMeterNodes()
  stopPlayback()
  if (audioContext && audioContext.state !== 'closed') {
    await audioContext.close()
  }
  audioContext = null
}

async function ensureMic(): Promise<MediaStream> {
  const wantedId = inputIdForCapture()
  if (mediaStream) {
    const liveTrack = mediaStream
      .getAudioTracks()
      .find((track) => track.readyState === 'live')
    if (liveTrack) {
      const currentId = liveTrack.getSettings().deviceId ?? ''
      // Only reuse when the live track is confirmed to match the selection.
      // An empty currentId cannot prove a match for a specific deviceId.
      if (!wantedId) return mediaStream
      if (currentId && currentId === wantedId) return mediaStream
    }
    for (const track of mediaStream.getTracks()) track.stop()
    mediaStream = null
  }

  // Disable browser voice processing: with monitor playback, echoCancellation
  // and noiseSuppression make the next take metallic and very quiet.
  const base: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  }

  const open = (audio: MediaTrackConstraints) =>
    navigator.mediaDevices.getUserMedia({ audio })

  if (wantedId) {
    try {
      mediaStream = await open({ ...base, deviceId: { exact: wantedId } })
    } catch {
      try {
        mediaStream = await open({ ...base, deviceId: { ideal: wantedId } })
      } catch {
        mediaStream = await open(base)
      }
    }
  } else {
    mediaStream = await open(base)
  }

  const liveTrack = mediaStream
    .getAudioTracks()
    .find((track) => track.readyState === 'live')
  const actualId = liveTrack?.getSettings().deviceId ?? ''
  const actualLabel = liveTrack?.label?.trim() || ''

  if (wantedId && actualId && actualId !== wantedId) {
    setInputOverrideNote(
      actualLabel
        ? `Le système a ouvert « ${actualLabel} » à la place du micro choisi (souvent le cas avec un casque Bluetooth).`
        : 'Le système a ouvert un autre micro que celui choisi (souvent le cas avec un casque Bluetooth).',
    )
  } else if (wantedId && !actualId) {
    // Mobile browsers sometimes omit deviceId in getSettings(); can't verify.
    setInputOverrideNote(null)
  } else {
    setInputOverrideNote(null)
  }

  void refreshAudioDeviceOptions()
  return mediaStream
}

function releaseMic() {
  stopMeterNodes()
  if (!mediaStream) return
  for (const track of mediaStream.getTracks()) track.stop()
  mediaStream = null
}

function stopMeterNodes() {
  if (meterRaf !== null) {
    cancelAnimationFrame(meterRaf)
    meterRaf = null
  }
  els.meter.style.width = '0%'

  try {
    meterSource?.disconnect()
  } catch {
    // already disconnected
  }
  if (meterSource) {
    for (const track of meterSource.mediaStream.getAudioTracks()) {
      track.stop()
    }
  }
  meterSource = null
  analyser = null
}

async function startMeter(stream: MediaStream) {
  stopMeterNodes()
  const ctx = await ensureAudioContext()

  // Clone tracks so the analyser never touches the MediaRecorder input.
  const meterStream = new MediaStream(
    stream.getAudioTracks().map((track) => track.clone()),
  )
  meterSource = ctx.createMediaStreamSource(meterStream)
  analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  meterSource.connect(analyser)

  const data = new Uint8Array(analyser.frequencyBinCount)
  const tick = () => {
    if (!analyser) return
    analyser.getByteTimeDomainData(data)
    let sum = 0
    for (const value of data) {
      const centered = (value - 128) / 128
      sum += centered * centered
    }
    const rms = Math.sqrt(sum / data.length)
    const level = Math.min(100, Math.round(rms * 280))
    els.meter.style.width = `${level}%`
    meterRaf = requestAnimationFrame(tick)
  }
  meterRaf = requestAnimationFrame(tick)
}

function startTimer(fromPerf = performance.now()) {
  startedAt = fromPerf
  els.timer.hidden = false
  els.timer.textContent = '00:00'
  if (timerId !== null) window.clearInterval(timerId)
  timerId = window.setInterval(() => {
    const elapsed = performance.now() - startedAt
    els.timer.textContent = formatTime(elapsed)
    if (
      elapsed >= MAX_RECORDING_MS &&
      state === 'recording' &&
      !sessionStopping
    ) {
      if (timerId !== null) {
        window.clearInterval(timerId)
        timerId = null
      }
      void stopSession()
    }
  }, 200)
}

function stopTimer(): number {
  const elapsed = startedAt > 0 ? performance.now() - startedAt : 0
  startedAt = 0
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
  updateSessionTimer()
  return elapsed
}

function settlePlayWaiters() {
  const waiters = playWaiters
  playWaiters = []
  for (const resolve of waiters) resolve()
}

function stopPlayheadClock() {
  if (playheadRaf !== null) {
    cancelAnimationFrame(playheadRaf)
    playheadRaf = null
  }
}

function getMixPositionMs(): number {
  if (!audioContext || mixTimelineStartCtx === null) return mixSeekMs
  return Math.max(0, (audioContext.currentTime - mixTimelineStartCtx) * 1000)
}

function getTrackPositionMs(trackId: number): number {
  const head = trackPlayheads.get(trackId)
  if (!audioContext || !head) return 0
  if (audioContext.currentTime < head.when) return head.skipS * 1000
  const into = audioContext.currentTime - head.when
  const posS = Math.min(head.skipS + head.lengthS, head.skipS + into)
  return Math.max(0, posS * 1000)
}

function updateSeekBar(positionMs = getMixPositionMs()) {
  const duration = getMixDurationMs()
  const clamped = duration > 0 ? Math.min(positionMs, duration) : 0
  const ratio = duration > 0 ? clamped / duration : 0
  const pct = `${Math.max(0, Math.min(1, ratio)) * 100}%`
  els.mixSeekFill.style.width = pct
  els.mixSeek.style.setProperty('--seek-thumb', pct)
  els.mixSeek.setAttribute('aria-valuenow', String(Math.round(clamped)))
  els.mixSeek.setAttribute('aria-valuemax', String(Math.round(duration)))
  els.mixSeek.classList.toggle('is-disabled', tracks.length === 0)
}

function updateClockDisplays() {
  // While scrubbing, keep the pointer position — don't fight the live playhead.
  if (seekDragActive) {
    els.mixClock.textContent = formatCentis(mixSeekMs)
    updateSeekBar(mixSeekMs)
    return
  }

  const positionMs = getMixPositionMs()
  if (mixTimelineStartCtx !== null) mixSeekMs = positionMs
  els.mixClock.textContent = formatCentis(positionMs)
  updateSeekBar(positionMs)
  if (!calageMode) return
  for (const track of tracks) {
    const el = els.tracks.querySelector<HTMLElement>(
      `[data-track-clock="${track.id}"]`,
    )
    if (!el) continue
    el.textContent = formatCentis(getTrackPositionMs(track.id))
  }
}

function startPlayheadClock() {
  stopPlayheadClock()
  const tick = () => {
    updateClockDisplays()
    playheadRaf = requestAnimationFrame(tick)
  }
  playheadRaf = requestAnimationFrame(tick)
}

function stopPlayback(options?: { resetSeek?: boolean }) {
  const positionBeforeStop = getMixPositionMs()
  stopPlayheadClock()

  for (const source of playbackSources) {
    source.onended = null
    try {
      source.stop()
    } catch {
      // already stopped
    }
    try {
      source.disconnect()
    } catch {
      // already disconnected
    }
  }
  playbackSources = []

  try {
    playbackGain?.disconnect()
  } catch {
    // already disconnected
  }
  playbackGain = null
  trackGains.clear()

  playingTrackIds.clear()
  trackPlayheads.clear()
  mixListenActive = false
  mixPaused = false
  mixEpochPerf = null
  mixTimelineStartCtx = null

  if (options?.resetSeek) {
    mixSeekMs = 0
  } else if (positionBeforeStop > 0) {
    mixSeekMs = positionBeforeStop
  }

  if (audioContext?.state === 'suspended') {
    void audioContext.resume()
  }

  settlePlayWaiters()
  updateMixButtons()
  els.mixClock.textContent = formatCentis(mixSeekMs)
  updateSeekBar(mixSeekMs)
}

function selectedTracks(): Track[] {
  return tracks.filter((track) => enabledTrackIds.has(track.id))
}

function setTrackAudible(trackId: number, audible: boolean) {
  const gain = trackGains.get(trackId)
  if (gain) {
    gain.gain.value = audible ? 1 : 0
  }
}

function skewFingerprint(
  skewed: Array<{ track: Track; index: number }>,
): string {
  return skewed
    .map(({ track }) => `${track.id}:${Math.round(track.offsetMs)}`)
    .join('|')
}

function updateSkewWarning() {
  if (
    referenceBeatWarning &&
    referenceBeatWarning.key !== referenceBeatDismissedKey
  ) {
    els.skewWarning.hidden = false
    els.openAdvanced.hidden =
      calageMode || referenceBeatWarning.reason === 'missing'
    els.skewWarningText.textContent = referenceBeatWarning.message
    return
  }

  const skewed = tracks
    .map((track, index) => ({ track, index }))
    .filter(
      ({ track }) =>
        track.id !== referenceTrackId && Math.abs(track.offsetMs) > OFFSET_WARN_MS,
    )

  if (skewed.length === 0) {
    els.skewWarning.hidden = true
    els.skewWarningText.textContent = ''
    skewWarningDismissedKey = ''
    return
  }

  const key = skewFingerprint(skewed)
  if (key === skewWarningDismissedKey) {
    els.skewWarning.hidden = true
    return
  }

  const names = skewed.map(({ track }) => track.name).join(', ')
  els.skewWarning.hidden = false
  els.openAdvanced.hidden = calageMode
  els.skewWarningText.textContent = calageMode
    ? `Calage auto élevé sur ${names}.`
    : `Calage auto élevé sur ${names}. Vérifie le sync en mode calage.`
}

function updateMixButtons() {
  const selectedCount = selectedTracks().length
  const allSelected =
    tracks.length > 0 && selectedCount === tracks.length
  const alignable = alignableTracks()
  const allAutoAlign =
    alignable.length > 0 &&
    alignable.every((track) => autoAlignTrackIds.has(track.id))
  const hasPlayback = playbackSources.length > 0 || playingTrackIds.size > 0
  const isPausedOrIdle = !hasPlayback || mixPaused

  els.selectAll.disabled = tracks.length === 0
  els.selectAll.checked = allSelected && tracks.length > 0
  els.selectAll.indeterminate =
    selectedCount > 0 && selectedCount < tracks.length
  els.deleteAllTracks.disabled = tracks.length === 0 || state === 'recording'
  els.calageModeWrap.hidden = tracks.length === 0
  if (tracks.length === 0 && calageMode) {
    setCalageMode(false)
    return
  }

  els.alignHeader.hidden = !calageMode || alignable.length === 0
  els.alignNudgeSpacer.hidden = !calageMode || alignable.length === 0
  els.alignAll.disabled = alignable.length === 0 || !calageMode
  els.alignAll.checked = allAutoAlign
  els.alignAll.indeterminate =
    alignable.some((track) => autoAlignTrackIds.has(track.id)) && !allAutoAlign

  els.playMix.disabled = tracks.length === 0
  const playLabel = isPausedOrIdle ? 'Lecture' : 'Pause'
  els.playMix.setAttribute('aria-label', playLabel)
  els.playMix.title = withShortcutHint(playLabel, 'Espace')
  els.playMix.setAttribute('aria-pressed', isPausedOrIdle ? 'false' : 'true')
  els.playIcon.toggleAttribute('hidden', !isPausedOrIdle)
  els.pauseIcon.toggleAttribute('hidden', isPausedOrIdle)
  els.restartMix.disabled = tracks.length === 0
  els.downloadMix.disabled =
    mixExporting || selectedTracks().filter((track) => track.blob.size > 0).length === 0
  els.downloadMix.setAttribute(
    'aria-busy',
    mixExporting ? 'true' : 'false',
  )
  els.mixTransport.hidden = state === 'recording' || tracks.length === 0
  els.meterWrap.hidden = state !== 'recording'
  els.captureBar.classList.toggle(
    'is-record-only',
    state !== 'recording' && tracks.length === 0,
  )

  updateSkewWarning()
}

function reorderTrack(fromId: number, beforeId: number | null) {
  const from = tracks.findIndex((track) => track.id === fromId)
  if (from < 0) return

  let to =
    beforeId == null
      ? tracks.length
      : tracks.findIndex((track) => track.id === beforeId)
  if (to < 0) return
  if (from === to || from + 1 === to) return

  const [moved] = tracks.splice(from, 1)
  if (!moved) return
  if (to > from) to -= 1
  tracks.splice(to, 0, moved)

  syncReferenceTrackRules()
  if (playingTrackIds.size > 0 || mixListenActive) {
    stopPlayback({ resetSeek: false })
  }
  renderTracks()
}

function clearDragState() {
  dragTrackId = null
  touchReorder = null
  for (const row of els.tracks.querySelectorAll('.track-row')) {
    row.classList.remove(
      'is-dragging',
      'drag-over',
      'drag-over-before',
      'drag-over-after',
    )
  }
}

function updateDragOverFromPoint(clientY: number) {
  if (dragTrackId == null) return

  let targetRow: HTMLElement | null = null
  for (const row of els.tracks.querySelectorAll<HTMLElement>('.track-row')) {
    const id = Number(row.dataset.trackId)
    if (id === dragTrackId) continue
    const rect = row.getBoundingClientRect()
    if (clientY >= rect.top && clientY <= rect.bottom) {
      targetRow = row
      break
    }
  }

  for (const item of els.tracks.querySelectorAll('.track-row')) {
    item.classList.remove('drag-over', 'drag-over-before', 'drag-over-after')
  }
  if (!targetRow) return

  const rect = targetRow.getBoundingClientRect()
  const before = clientY < rect.top + rect.height / 2
  targetRow.classList.add('drag-over')
  targetRow.classList.toggle('drag-over-before', before)
  targetRow.classList.toggle('drag-over-after', !before)
}

function commitDragOverFromPoint(clientY: number) {
  if (dragTrackId == null) return
  const fromId = dragTrackId

  let targetRow: HTMLElement | null = null
  for (const row of els.tracks.querySelectorAll<HTMLElement>('.track-row')) {
    const id = Number(row.dataset.trackId)
    if (id === fromId) continue
    const rect = row.getBoundingClientRect()
    if (clientY >= rect.top && clientY <= rect.bottom) {
      targetRow = row
      break
    }
  }

  clearDragState()
  if (!targetRow) return

  const targetId = Number(targetRow.dataset.trackId)
  if (!Number.isFinite(targetId) || targetId === fromId) return

  const rect = targetRow.getBoundingClientRect()
  const before = clientY < rect.top + rect.height / 2
  reorderTrack(fromId, before ? targetId : nextTrackIdAfter(targetId))
}

function renderTracks() {
  if (tracks.length === 0) {
    els.tracksPanel.hidden = true
    els.tracks.innerHTML = ''
    trackAlignDetails.clear()
    clearRefPeaks()
    updateMixButtons()
    return
  }

  els.tracksPanel.hidden = false
  updateRefPeaksDisplay()
  els.tracks.innerHTML = tracks
    .map((track) => {
      const isEnabled = enabledTrackIds.has(track.id)
      const autoAlign = autoAlignTrackIds.has(track.id)
      const clock = formatCentis(getTrackPositionMs(track.id))
      const isReference = track.id === referenceTrackId
      const alignDetail = trackAlignDetails.get(track.id)
      const alignDetailText =
        alignDetail && !isReference
          ? formatAlignDetail(track.offsetMs, alignDetail)
          : ''
      const calageControls = calageMode
        ? `
        ${
          isReference
            ? `<span class="track-check-spacer track-ref-badge" title="Piste de référence (marquages 1–2–3–4)" aria-label="Référence">réf.</span>`
            : `<label class="track-check track-check-align" title="Calage auto">
          <input
            type="checkbox"
            data-auto-align-track="${track.id}"
            ${autoAlign ? 'checked' : ''}
            aria-label="Calage auto ${escapeHtml(track.name)}"
          />
          <span class="track-check-box" aria-hidden="true"></span>
        </label>`
        }
        <div class="track-nudge" title="Décaler cette piste à la lecture">
          <button
            type="button"
            class="btn btn-nudge"
            data-nudge-track="${track.id}"
            data-nudge="-5"
            aria-label="Avancer ${escapeHtml(track.name)} de 5 ms"
          >
            −
          </button>
          <label class="track-offset-wrap">
            <input
              type="text"
              class="track-offset"
              data-offset-track="${track.id}"
              value="${Math.round(track.offsetMs)}"
              inputmode="numeric"
              aria-label="Calage de ${escapeHtml(track.name)} en millisecondes"
              spellcheck="false"
            />
            <span class="track-offset-unit" aria-hidden="true">ms</span>
          </label>
          <button
            type="button"
            class="btn btn-nudge"
            data-nudge-track="${track.id}"
            data-nudge="5"
            aria-label="Retarder ${escapeHtml(track.name)} de 5 ms"
          >
            +
          </button>
        </div>
        <small class="track-align-detail${alignDetailText ? '' : ' is-empty'}">${alignDetailText || '&nbsp;'}</small>
        `
        : ''
      return `
      <li class="track-row${calageMode ? ' is-advanced' : ''}${isEnabled ? '' : ' is-muted'}" data-track-id="${track.id}">
        <button
          type="button"
          class="track-drag"
          draggable="true"
          data-drag-track="${track.id}"
          aria-label="Réordonner ${escapeHtml(track.name)}"
          title="Glisser pour réordonner"
        >
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M9 7h2v2H9V7zm4 0h2v2h-2V7zM9 11h2v2H9v-2zm4 0h2v2h-2v-2zm-4 4h2v2H9v-2zm4 0h2v2h-2v-2z"/>
          </svg>
        </button>
        <label class="track-mute" title="${isEnabled ? 'Audible' : 'Muet'}">
          <input
            type="checkbox"
            data-toggle-track="${track.id}"
            ${isEnabled ? 'checked' : ''}
            aria-label="Écouter ${escapeHtml(track.name)}"
          />
          <span class="track-mute-icon" aria-hidden="true">
            <svg class="icon-speaker-on" viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/>
            </svg>
            <svg class="icon-speaker-off" viewBox="0 0 24 24">
              <path fill="currentColor" d="M3.63 3.63 2.22 5.04 6.18 9H3v6h4l5 5v-6.96l4.57 4.57A7 7 0 0 1 14 18.7v2.06a9 9 0 0 0 3.33-1.68l2.63 2.63 1.41-1.41L3.63 3.63zM16.5 12c0-.77-.2-1.5-.54-2.14l1.5-1.5A6.9 6.9 0 0 1 18.5 12a6.9 6.9 0 0 1-.8 3.22l1.52 1.52A8.9 8.9 0 0 0 20.5 12c0-2.8-1.28-5.3-3.3-6.93l-1.47 1.47A6.95 6.95 0 0 1 16.5 12zM12 4 9.91 6.09 12 8.18V4z"/>
            </svg>
          </span>
        </label>
        <div class="track-main">
          <div class="track-main-body">
            <input
              type="text"
              class="track-name${isDefaultTrackName(track.name) ? ' is-default-name' : ''}"
              data-rename-track="${track.id}"
              value="${escapeHtml(track.name)}"
              aria-label="Nom de la piste"
              maxlength="40"
            />
            <span class="track-meta"${calageMode ? '' : ' hidden'}>
              ${
                calageMode
                  ? `<small class="track-clock" data-track-clock="${track.id}">${clock}</small>
              <small class="track-duration">${formatTime(track.durationMs)}</small>`
                  : ''
              }
            </span>
          </div>
          ${
            isReference
              ? ''
              : `<button
            type="button"
            class="btn btn-trash"
            data-delete-track="${track.id}"
            aria-label="Supprimer ${escapeHtml(track.name)}"
            title="Supprimer"
          >
            ×
          </button>`
          }
        </div>
        ${calageControls}
      </li>
    `
    })
    .join('')
  updateMixButtons()
  updateClockDisplays()
  updateSessionTimer()
}

function setUi() {
  const recording = state === 'recording'

  els.controls.classList.toggle('recording', recording)
  els.record.hidden = recording
  els.record.disabled = recording
  els.next.hidden = !recording
  els.discard.hidden = !recording
  els.stop.hidden = !recording
  els.next.disabled = !recording
  els.discard.disabled = !recording
  els.stop.disabled = !recording
  els.stop.classList.toggle('is-recording', recording)

  if (state === 'idle') {
    els.hint.textContent = ''
  } else if (state === 'recording') {
    if (tracks.length === 0) {
      els.hint.textContent = ''
    } else if (prefersHeadphonesHint()) {
      els.hint.textContent =
        'Casque conseillé : sans casque, le micro peut reprendre le son des haut-parleurs et fausser le calage.'
    } else {
      els.hint.textContent =
        'Casque conseillé. Monitoring compensé pour la latence audio.'
    }
  } else {
    els.hint.textContent = 'Écoute en cours.'
  }

  updateMixButtons()
  updateSessionTimer()
}

function stopRecorderToBlob(
  recording: NonNullable<typeof activeRecording>,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { recorder, chunks, onData } = recording

    const onStop = () => {
      recorder.removeEventListener('error', onError)
      recorder.removeEventListener('dataavailable', onData)
      const type = recorder.mimeType || preferMimeType || 'audio/webm'
      resolve(new Blob(chunks, { type }))
    }
    const onError = () => {
      recorder.removeEventListener('stop', onStop)
      recorder.removeEventListener('dataavailable', onData)
      reject(new Error("L'enregistrement a échoué."))
    }

    recorder.addEventListener('stop', onStop, { once: true })
    recorder.addEventListener('error', onError, { once: true })

    try {
      recorder.stop()
    } catch (error) {
      recorder.removeEventListener('stop', onStop)
      recorder.removeEventListener('error', onError)
      recorder.removeEventListener('dataavailable', onData)
      reject(error instanceof Error ? error : new Error("L'enregistrement a échoué."))
    }
  })
}

async function decodeTrack(track: Track): Promise<AudioBuffer> {
  const cached = bufferCache.get(track.id)
  if (cached) return cached

  const ctx = await ensureAudioContext()
  const copy = await track.blob.arrayBuffer()
  const buffer = await ctx.decodeAudioData(copy)
  bufferCache.set(track.id, buffer)
  return buffer
}

/**
 * Detect the first strong onsets (spoken counts or claps).
 * Uses envelope rise (onset strength), not just loudness maxima —
 * claps are too short for a plain RMS peak picker to stay stable.
 * Returns peak times in seconds from the start of the buffer.
 */
function findVolumePeaks(
  buffer: AudioBuffer,
  count: number,
  options?: { minGapSec?: number; thresholdRatio?: number },
): number[] {
  const channel = buffer.numberOfChannels > 0 ? buffer.getChannelData(0) : null
  if (!channel || channel.length === 0) return []

  const sampleRate = buffer.sampleRate
  const minGapSec = options?.minGapSec ?? 0.18
  const thresholdRatio = options?.thresholdRatio ?? 0.22
  // Short window: keeps clap attacks sharp while still working for speech.
  const windowSize = Math.max(1, Math.floor(0.005 * sampleRate))
  const minGapSamples = Math.floor(minGapSec * sampleRate)
  const refineRadius = Math.floor(0.02 * sampleRate)

  const envelope: number[] = []
  for (let i = 0; i < channel.length; i += windowSize) {
    let sum = 0
    const end = Math.min(channel.length, i + windowSize)
    for (let j = i; j < end; j++) {
      const sample = channel[j] ?? 0
      sum += sample * sample
    }
    envelope.push(Math.sqrt(sum / Math.max(1, end - i)))
  }

  if (envelope.length < 3) return []

  // Onset strength = positive derivative of the envelope.
  const onsets: number[] = [0]
  let maxOnset = 0
  for (let i = 1; i < envelope.length; i++) {
    const rise = Math.max(0, (envelope[i] ?? 0) - (envelope[i - 1] ?? 0))
    onsets.push(rise)
    if (rise > maxOnset) maxOnset = rise
  }
  if (maxOnset < 1e-6) return []

  const threshold = maxOnset * thresholdRatio
  type Candidate = { sample: number; strength: number }
  const candidates: Candidate[] = []

  for (let i = 1; i < onsets.length - 1; i++) {
    const value = onsets[i] ?? 0
    if (value < threshold) continue
    if (value < (onsets[i - 1] ?? 0) || value < (onsets[i + 1] ?? 0)) continue

    const approx = i * windowSize
    let peakSample = approx
    let peakAbs = 0
    const from = Math.max(0, approx - refineRadius)
    const to = Math.min(channel.length, approx + refineRadius)
    for (let j = from; j < to; j++) {
      const abs = Math.abs(channel[j] ?? 0)
      if (abs > peakAbs) {
        peakAbs = abs
        peakSample = j
      }
    }

    candidates.push({ sample: peakSample, strength: value })
  }

  // Keep the strongest onsets, then take the earliest `count` with spacing.
  candidates.sort((a, b) => b.strength - a.strength)

  const chosen: Candidate[] = []
  for (const candidate of candidates) {
    if (chosen.some((c) => Math.abs(c.sample - candidate.sample) < minGapSamples)) {
      continue
    }
    chosen.push(candidate)
  }

  chosen.sort((a, b) => a.sample - b.sample)
  return chosen.slice(0, count).map((c) => c.sample / sampleRate)
}

type BeatAssessment =
  | { ok: true; peaks: number[] }
  | { ok: false; reason: 'missing' | 'irregular'; peaks: number[] }

/** Validate a 1-2-3-4 count-in: 4 attacks and regular gaps (±20%). */
function assessCountInBeat(peaks: number[]): BeatAssessment {
  if (peaks.length < 4) {
    return { ok: false, reason: 'missing', peaks }
  }

  const beat = peaks.slice(0, 4)
  const gaps = [beat[1]! - beat[0]!, beat[2]! - beat[1]!, beat[3]! - beat[2]!]
  const minGap = Math.min(...gaps)
  const maxGap = Math.max(...gaps)
  if (!(minGap > 0) || maxGap > minGap * BEAT_GAP_MAX_RATIO) {
    return { ok: false, reason: 'irregular', peaks: beat }
  }

  return { ok: true, peaks: beat }
}

function applyReferencePeaksLabel(reference: Track, peaks: number[]) {
  if (peaks.length === 0) {
    refPeakFourSec = null
    refPeaksLabel = ''
    updateRefPeaksDisplay()
    return
  }

  refPeakFourSec = peaks.length >= 4 ? peaks[3]! : null
  const times = peaks.map((peak) => formatCentisCompact(peak * 1000)).join(' · ')

  if (peaks.length >= 4) {
    const gapsMs = [1, 2, 3].map((index) =>
      Math.round((peaks[index]! - peaks[index - 1]!) * 1000),
    )
    refPeaksLabel = `1-2-3-4 (${reference.name}) : ${times}\nécarts ${gapsMs.join(' / ')} ms`
  } else {
    refPeaksLabel = `Attaques (${reference.name}) : ${times} (${peaks.length}/4)`
  }
  updateRefPeaksDisplay()
}

async function evaluateReferenceBeat(): Promise<void> {
  const reference = getReferenceTrack()
  if (!reference || reference.blob.size === 0) {
    referenceBeatWarning = null
    referenceBeatDismissedKey = ''
    updateSkewWarning()
    return
  }

  try {
    const buffer = await decodeTrack(reference)
    const peaks = findVolumePeaks(buffer, 4)
    const assessment = assessCountInBeat(peaks)
    applyReferencePeaksLabel(reference, assessment.peaks)

    if (assessment.ok) {
      referenceBeatWarning = null
      referenceBeatDismissedKey = ''
    } else if (assessment.reason === 'irregular') {
      referenceBeatWarning = {
        key: `beat:${reference.id}:irregular:${assessment.peaks.map((p) => p.toFixed(3)).join(',')}`,
        message: `Battue 1-2-3-4 irrégulière ou non détectée sur la piste de référence (${reference.name}).`,
        reason: 'irregular',
      }
    } else {
      referenceBeatWarning = {
        key: `beat:${reference.id}:missing:${peaks.length}`,
        message: `Battue 1-2-3-4 non détectée sur « ${reference.name} » (${peaks.length}/4 attaques).`,
        reason: 'missing',
      }
    }
  } catch {
    referenceBeatWarning = {
      key: `beat:${reference.id}:error`,
      message: `Impossible d'analyser la battue de « ${reference.name} ».`,
      reason: 'error',
    }
  }

  updateSkewWarning()
}

/**
 * Pick the peak pair that best matches reference beats 3 and 4.
 * Avoids latching onto speaker-bleed "1-2" when monitoring is audible to the mic.
 */
function findTakeThreeFourPeaks(
  peaks: number[],
  refThree: number,
  refFour: number,
): [number, number] | null {
  if (peaks.length < 2) return null

  const expectedGap = refFour - refThree
  if (!(expectedGap > 0)) {
    return [peaks[0]!, peaks[1]!]
  }

  let best: { three: number; four: number; score: number } | null = null

  for (let i = 0; i < peaks.length - 1; i++) {
    for (let j = i + 1; j < peaks.length; j++) {
      const three = peaks[i]!
      const four = peaks[j]!
      const gap = four - three
      if (!(gap > 0)) continue

      const gapError = Math.abs(gap - expectedGap) / expectedGap
      // Reject pairs whose spacing is far from the reference 3–4 interval.
      if (gapError > 0.4) continue

      // Prefer pairs near the expected absolute times (overdub punch-in ≈ mix t0).
      const timeError =
        (Math.abs(three - refThree) + Math.abs(four - refFour)) /
        (2 * expectedGap)
      const score = gapError * 2 + timeError
      if (!best || score < best.score) {
        best = { three, four, score }
      }
    }
  }

  if (best) return [best.three, best.four]
  // Fallback: earliest two strong peaks.
  return [peaks[0]!, peaks[1]!]
}

function prefersHeadphonesHint(): boolean {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  )
}

/**
 * Align later takes on track 1 using shared "3-4" counts.
 * Track 1 must contain 1-2-3-4; later tracks should contain 3-4 in sync with what was heard.
 */
async function autoAlignTracksFromCounts(): Promise<void> {
  if (tracks.length < 2) {
    throw new Error('Il faut au moins deux pistes pour caler.')
  }

  const reference = getReferenceTrack()
  if (!reference) {
    throw new Error('Piste de référence manquante.')
  }

  const refBuffer = await decodeTrack(reference)
  const refPeaks = findVolumePeaks(refBuffer, 4)
  if (refPeaks.length < 4) {
    throw new Error(
      `${reference.name} : ${refPeaks.length}/4 attaques trouvées. Fais 4 sons bien espacés (voix ou claquements).`,
    )
  }

  const refThree = refPeaks[2]!
  const refFour = refPeaks[3]!
  applyReferencePeaksLabel(reference, refPeaks)

  for (const track of tracks) {
    if (track.id === reference.id) continue
    if (!autoAlignTrackIds.has(track.id)) continue

    const buffer = await decodeTrack(track)
    // Collect several onsets so we can skip speaker-bleed "1-2".
    const peaks = findVolumePeaks(buffer, 8)
    const pair = findTakeThreeFourPeaks(peaks, refThree, refFour)
    if (!pair) {
      throw new Error(
        `${track.name} : ${peaks.length}/2 attaques trouvées. Fais 2 sons nets pour « 3 4 » (voix ou claquements).`,
      )
    }

    const [takeThree, takeFour] = pair

    // mixTime = peakSec + offsetMs/1000  (see scheduleTrackSource)
    // Want take peaks to land on reference 3 and 4.
    const offsetFromThree =
      reference.offsetMs + (refThree - takeThree) * 1000
    const offsetFromFour =
      reference.offsetMs + (refFour - takeFour) * 1000
    const measured = (offsetFromThree + offsetFromFour) / 2
    track.offsetMs = Math.round(measured)
    trackAlignDetails.set(track.id, {
      delta3Ms: Math.round((refThree - takeThree) * 1000),
      delta4Ms: Math.round((refFour - takeFour) * 1000),
    })
  }

  renderTracks()
}

async function maybeAutoAlignAfterTake(): Promise<void> {
  if (tracks.length < 2) return
  const hasTargets = alignableTracks().some((track) =>
    autoAlignTrackIds.has(track.id),
  )
  if (!hasTargets) return
  try {
    await autoAlignTracksFromCounts()
  } catch (error) {
    // Don't block the session if peaks are unclear; user can still click manual align.
    setError(
      error instanceof Error
        ? `Calage auto reporté : ${error.message}`
        : 'Calage auto reporté.',
    )
  }
}

async function renderSelectedMixBuffer(): Promise<AudioBuffer> {
  const selected = selectedTracks().filter((track) => track.blob.size > 0)
  if (selected.length === 0) {
    throw new Error('Aucune piste sélectionnée à exporter.')
  }

  // Ensure a live context exists so decodeAudioData is available.
  await ensureAudioContext()
  const decoded = await Promise.all(
    selected.map(async (track) => ({
      track,
      buffer: await decodeTrack(track),
    })),
  )

  const sampleRate = Math.max(
    44100,
    ...decoded.map(({ buffer }) => buffer.sampleRate),
  )

  let durationS = 0
  for (const { track, buffer } of decoded) {
    const delayS = Math.max(0, track.offsetMs) / 1000
    const skipS = Math.max(0, -track.offsetMs) / 1000
    durationS = Math.max(durationS, delayS + Math.max(0, buffer.duration - skipS))
  }

  const length = Math.max(1, Math.ceil(durationS * sampleRate) + sampleRate)
  const offline = new OfflineAudioContext(2, length, sampleRate)
  const master = offline.createGain()
  // Match live mix headroom.
  master.gain.value = 0.85
  master.connect(offline.destination)

  for (const { track, buffer } of decoded) {
    const source = offline.createBufferSource()
    source.buffer = buffer
    source.connect(master)
    const delayS = Math.max(0, track.offsetMs) / 1000
    const skipS = Math.max(0, -track.offsetMs) / 1000
    const playable = Math.max(0, buffer.duration - skipS)
    if (playable <= 0) continue
    source.start(delayS, skipS, playable)
  }

  return offline.startRendering()
}

function trimAudioBufferFrom(buffer: AudioBuffer, startS: number): AudioBuffer {
  const startSample = Math.min(
    buffer.length,
    Math.max(0, Math.floor(startS * buffer.sampleRate)),
  )
  const length = Math.max(1, buffer.length - startSample)
  if (startSample === 0) return buffer

  const trimmed = new AudioBuffer({
    length,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  })
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    trimmed.copyToChannel(buffer.getChannelData(channel).subarray(startSample), channel)
  }
  return trimmed
}

/** Mix-timeline time (seconds) just after the reference "4", with a short pad. */
async function getSkipCountInStartS(): Promise<number> {
  const reference = getReferenceTrack()
  if (!reference) {
    throw new Error('Piste de référence manquante.')
  }

  let fourSec = refPeakFourSec
  if (fourSec == null) {
    const buffer = await decodeTrack(reference)
    const peaks = findVolumePeaks(buffer, 4)
    if (peaks.length < 4) {
      throw new Error(
        `${reference.name} : ${peaks.length}/4 attaques trouvées. Fais 4 sons bien espacés pour supprimer le 1-2-3-4.`,
      )
    }
    applyReferencePeaksLabel(reference, peaks)
    fourSec = peaks[3]!
  }

  // mixTime = peakSec + offsetMs/1000 (same as scheduleTrackSource)
  return fourSec + reference.offsetMs / 1000 + SKIP_COUNT_IN_PAD_S
}

/** Raise a mix start so playback/export begin after the count-in when enabled. */
async function applySkipCountInStartMs(startAtMs: number): Promise<number> {
  const clamped = Math.max(0, startAtMs)
  // Keep explicit seeks (incl. into the count-in); only rewrite a start-from-0.
  if (!els.skipCountInPlayback.checked || clamped > 0) return clamped
  try {
    const cutMs = (await getSkipCountInStartS()) * 1000
    return Math.max(clamped, cutMs)
  } catch {
    return clamped
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

async function downloadSelectedMix() {
  if (mixExporting) return
  const selected = selectedTracks().filter((track) => track.blob.size > 0)
  if (selected.length === 0) {
    setError('Sélectionne au moins une piste à exporter.')
    return
  }

  mixExporting = true
  updateMixButtons()
  setError(null)

  try {
    let mixed = await renderSelectedMixBuffer()
    if (els.skipCountInDownload.checked) {
      const cutS = await getSkipCountInStartS()
      if (cutS >= mixed.duration - 0.05) {
        throw new Error('Le « 4 » est trop près de la fin : rien à exporter après le décompte.')
      }
      mixed = trimAudioBufferFrom(mixed, cutS)
    }
    const mp3 = await encodeAudioBufferToMp3(mixed, 192)
    downloadBlob(mp3, downloadFilenameForSelection(selected))
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Export MP3 impossible.',
    )
  } finally {
    mixExporting = false
    updateMixButtons()
  }
}

function scheduleTrackSource(
  ctx: AudioContext,
  gain: GainNode,
  track: Track,
  buffer: AudioBuffer,
  timelineStart: number,
  applyOffset: boolean,
  startAtMs = 0,
): { source: AudioBufferSourceNode; endAt: number } | null {
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const trackGain = ctx.createGain()
  trackGain.gain.value = enabledTrackIds.has(track.id) ? 1 : 0
  source.connect(trackGain)
  trackGain.connect(gain)
  trackGains.set(track.id, trackGain)

  const offsetMs = applyOffset ? track.offsetMs : 0
  const delayS = Math.max(0, offsetMs) / 1000
  const skipS = Math.max(0, -offsetMs) / 1000
  const playable = Math.max(0, buffer.duration - skipS)
  const startAtS = Math.max(0, startAtMs) / 1000
  const trackEndS = delayS + playable

  if (playable <= 0 || startAtS >= trackEndS) {
    try {
      source.disconnect()
      trackGain.disconnect()
    } catch {
      // ignore
    }
    trackGains.delete(track.id)
    return null
  }

  const intoTrackS = Math.max(0, startAtS - delayS)
  const remainingS = playable - intoTrackS
  const when = timelineStart + Math.max(0, delayS - startAtS)
  const bufferOffset = skipS + intoTrackS

  source.start(when, bufferOffset, remainingS)

  trackPlayheads.set(track.id, {
    when,
    skipS: bufferOffset,
    lengthS: remainingS,
  })

  return { source, endAt: when + remainingS }
}

async function playTracks(
  tracksToPlay: Track[],
  options?: {
    awaitEnd?: boolean
    asMix?: boolean
    applyOffsets?: boolean
    startAtMs?: number
  },
): Promise<void> {
  const asMix = Boolean(options?.asMix)
  // Mix playback always schedules every track; mute is live via per-track gain.
  const sourceTracks = asMix ? tracks : tracksToPlay
  const playable = sourceTracks.filter((track) => track.blob.size > 0)
  if (playable.length === 0) {
    return Promise.reject(new Error('Piste vide, rien à lire.'))
  }

  let startAtMs = Math.max(0, options?.startAtMs ?? 0)
  if (asMix) {
    startAtMs = await applySkipCountInStartMs(startAtMs)
  }
  stopPlayback({ resetSeek: false })
  mixSeekMs = startAtMs
  mixListenActive = asMix
  updateMixButtons()
  updateClockDisplays()
  const ctx = await ensureAudioContext()
  const applyOffsets = options?.applyOffsets ?? true
  trackGains.clear()
  const decoded = await Promise.all(
    playable.map(async (track) => ({
      track,
      buffer: await decodeTrack(track),
    })),
  )

  const gain = ctx.createGain()
  gain.gain.value = 0.85
  gain.connect(ctx.destination)
  playbackGain = gain

  const timelineStart = ctx.currentTime + MIX_LOOKAHEAD_S
  mixEpochPerf = performance.now() + MIX_LOOKAHEAD_S * 1000 - startAtMs
  mixTimelineStartCtx = timelineStart - startAtMs / 1000
  mixPaused = false
  trackPlayheads.clear()

  for (const { track, buffer } of decoded) {
    const scheduled = scheduleTrackSource(
      ctx,
      gain,
      track,
      buffer,
      timelineStart,
      applyOffsets,
      asMix || applyOffsets ? startAtMs : 0,
    )
    if (!scheduled) continue
    playbackSources.push(scheduled.source)
    playingTrackIds.add(track.id)
  }

  startPlayheadClock()
  updateMixButtons()
  updateClockDisplays()

  const awaitEnd = options?.awaitEnd ?? true
  const startDelayMs = Math.max(0, (timelineStart - ctx.currentTime) * 1000)

  return new Promise<void>((resolve) => {
    let settled = false
    let remaining = playbackSources.length

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      playWaiters = playWaiters.filter((waiter) => waiter !== resolveAsDone)
      fn()
    }

    const resolveAsDone = () => {
      finish(() => {
        stopPlayback({ resetSeek: true })
        resolve()
      })
    }

    if (playbackSources.length === 0) {
      finish(() => {
        stopPlayback({ resetSeek: true })
        resolve()
      })
      return
    }

    if (awaitEnd) {
      playWaiters.push(resolveAsDone)
    }

    for (const source of playbackSources) {
      source.onended = () => {
        // While paused the context clock is frozen, so onended should not fire.
        if (mixPaused) return
        remaining -= 1
        if (remaining > 0) return

        if (awaitEnd) {
          resolveAsDone()
          return
        }

        stopPlayback({ resetSeek: true })
      }
    }

    if (!awaitEnd) {
      window.setTimeout(() => {
        finish(() => resolve())
      }, startDelayMs)
    }
  })
}

function createRecording(stream: MediaStream): NonNullable<typeof activeRecording> {
  preferMimeType = pickMimeType()
  const chunks: BlobPart[] = []

  const recorder = preferMimeType
    ? new MediaRecorder(stream, { mimeType: preferMimeType })
    : new MediaRecorder(stream)

  const onData = (event: BlobEvent) => {
    if (event.data.size > 0) chunks.push(event.data)
  }
  recorder.addEventListener('dataavailable', onData)

  return { recorder, chunks, onData }
}

function clearOverdubArmTimer() {
  if (overdubArmTimer !== null) {
    window.clearTimeout(overdubArmTimer)
    overdubArmTimer = null
  }
}

function discardPendingRecording() {
  clearOverdubArmTimer()
  if (!pendingRecording) return
  pendingRecording.recorder.removeEventListener(
    'dataavailable',
    pendingRecording.onData,
  )
  pendingRecording = null
}

async function beginRecording(options?: { offsetMs?: number; timerFromPerf?: number }) {
  setError(null)
  discardPendingRecording()
  const stream = await ensureMic()
  const recording = createRecording(stream)

  activeRecording = recording
  recording.recorder.start()
  pendingTakeOffsetMs = options?.offsetMs ?? 0

  await startMeter(stream)
  startTimer(options?.timerFromPerf ?? performance.now())
  state = 'recording'
  void applyAudioSink('monitor')
  setUi()
}

/**
 * Start monitor playback and the next take on the same mix timeline.
 * The recorder starts at mix t0 (not earlier) to avoid pre-roll / chunk bleed.
 */
async function beginOverdubRecording(monitor: Track[]): Promise<void> {
  setError(null)
  discardPendingRecording()
  const stream = await ensureMic()
  const recording = createRecording(stream)
  const ctx = await ensureAudioContext()
  await applyAudioSink('monitor')

  // Decode before scheduling so start times stay tight.
  const decoded =
    monitor.length > 0
      ? await Promise.all(
          monitor.map(async (track) => ({
            track,
            buffer: await decodeTrack(track),
          })),
        )
      : []

  stopPlayback()

  // No monitor: plain take on a fresh timeline.
  if (decoded.length === 0) {
    activeRecording = recording
    recording.recorder.start()
    pendingTakeOffsetMs = 0
    mixEpochPerf = null
    await startMeter(stream)
    startTimer()
    state = 'recording'
    setUi()
    return
  }

  const latencySec = getMonitorLatencySec(ctx)
  // Lookahead must cover latency so monitorStart is never in the past.
  const lookaheadSec = Math.max(MIX_LOOKAHEAD_S, latencySec + 0.06)
  const timelineStart = ctx.currentTime + lookaheadSec
  // Start monitor early so it reaches the ear around record punch-in (mix t0).
  const monitorStart = timelineStart - latencySec

  mixEpochPerf = performance.now() + lookaheadSec * 1000
  mixTimelineStartCtx = timelineStart
  mixPaused = false
  trackPlayheads.clear()
  trackGains.clear()

  const gain = ctx.createGain()
  gain.gain.value = 0.85
  gain.connect(ctx.destination)
  playbackGain = gain

  for (const { track, buffer } of decoded) {
    const scheduled = scheduleTrackSource(
      ctx,
      gain,
      track,
      buffer,
      monitorStart,
      true,
    )
    if (!scheduled) continue
    playbackSources.push(scheduled.source)
    playingTrackIds.add(track.id)
  }

  let remainingMonitor = playbackSources.length
  for (const source of playbackSources) {
    source.onended = () => {
      remainingMonitor -= 1
      if (remainingMonitor > 0) return
      stopPlayheadClock()
      playingTrackIds.clear()
      playbackSources = []
      trackPlayheads.clear()
      mixTimelineStartCtx = null
      try {
        playbackGain?.disconnect()
      } catch {
        // already disconnected
      }
      playbackGain = null
      mixPaused = false
      if (audioContext?.state === 'suspended') {
        void audioContext.resume()
      }
      renderTracks()
      updateMixButtons()
      els.mixClock.textContent = '00:00.000'
    }
  }
  renderTracks()
  startPlayheadClock()
  updateMixButtons()

  // Arm the recorder at mix t0 (when compensated monitor should be audible).
  const armDelayMs = Math.max(0, (timelineStart - ctx.currentTime) * 1000)
  await startMeter(stream)
  startTimer(mixEpochPerf)
  state = 'recording'
  setUi()

  pendingRecording = recording
  await new Promise<void>((resolve, reject) => {
    overdubArmTimer = window.setTimeout(() => {
      overdubArmTimer = null
      try {
        if (pendingRecording !== recording) {
          resolve()
          return
        }
        pendingRecording = null
        activeRecording = recording
        recording.recorder.start()
        const recordPerf = performance.now()
        // Residual skew after latency compensation (ideally ~0).
        pendingTakeOffsetMs =
          mixEpochPerf !== null ? recordPerf - mixEpochPerf : 0
        resolve()
      } catch (error) {
        pendingRecording = null
        reject(
          error instanceof Error
            ? error
            : new Error("Impossible de démarrer l'enregistrement."),
        )
      }
    }, armDelayMs)
  })
}

async function finalizeCurrentTake(): Promise<Track> {
  if (!activeRecording || activeRecording.recorder.state === 'inactive') {
    throw new Error('Aucun enregistrement en cours.')
  }

  const durationMs = stopTimer()
  const recording = activeRecording
  activeRecording = null
  const offsetMs = pendingTakeOffsetMs
  pendingTakeOffsetMs = 0

  // Stop recorder before tearing down the meter so the mic stream stays live.
  const blob = await stopRecorderToBlob(recording)
  stopMeterNodes()

  // Let any late events from the old recorder settle before a new one starts.
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })

  if (blob.size === 0) {
    throw new Error("Aucune donnée audio capturée. Réessaie l'enregistrement.")
  }

  trackCounter += 1
  const track: Track = {
    id: trackCounter,
    name: defaultTrackName(tracks.length + 1),
    blob,
    url: URL.createObjectURL(blob),
    // Chronometer is the source of truth: browser metadata for webm is often wrong.
    durationMs,
    offsetMs,
  }
  tracks.push(track)
  enabledTrackIds.add(track.id)
  // First saved take becomes the sync reference (never auto-aligned).
  const becameReference = referenceTrackId == null
  if (becameReference) {
    referenceTrackId = track.id
  } else {
    autoAlignTrackIds.add(track.id)
  }
  renderTracks()
  if (becameReference || track.id === referenceTrackId) {
    await evaluateReferenceBeat()
  }
  await maybeAutoAlignAfterTake()
  return track
}

async function abortCurrentTake(): Promise<void> {
  discardPendingRecording()
  stopPlayback({ resetSeek: true })
  stopMeterNodes()
  stopTimer()
  pendingTakeOffsetMs = 0
  mixSeekMs = 0
  updateSeekBar(0)

  const recording = activeRecording
  activeRecording = null
  if (!recording || recording.recorder.state === 'inactive') return

  try {
    await stopRecorderToBlob(recording)
  } catch {
    // Discarded take — ignore stop errors.
  }
}

/** Throw away the in-progress take and punch in again from mix t0. */
async function discardAndRetake() {
  if (state !== 'recording') return
  els.next.disabled = true
  els.discard.disabled = true
  els.stop.disabled = true

  try {
    await abortCurrentTake()
    if (tracks.length > 0) {
      await beginOverdubRecording(tracks.slice())
    } else {
      await beginRecording({ offsetMs: 0 })
    }
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Impossible de recommencer la prise.',
    )
    stopMeterNodes()
    stopTimer()
    state = 'idle'
    setUi()
  }
}

async function startSession() {
  try {
    stopPlayback()
    pendingTakeOffsetMs = 0
    if (tracks.length > 0) {
      // Resume overdub: play existing takes (muted ones stay silent via gain).
      await beginOverdubRecording(tracks.slice())
    } else {
      await beginRecording({ offsetMs: 0 })
    }
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Impossible d'accéder au micro.",
    )
    state = 'idle'
    setUi()
  }
}

async function nextTrack() {
  if (state !== 'recording') return
  els.next.disabled = true
  els.discard.disabled = true
  els.stop.disabled = true

  try {
    // Keep monitor playing until the new take is armed on the same clock.
    // Finalize stops only the recorder, not playback — then we resync.
    stopPlayback()
    await finalizeCurrentTake()

    // All previous takes are monitored; muted ones stay at gain 0.
    await beginOverdubRecording(tracks.slice())
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Impossible de passer à la piste suivante.',
    )
    stopMeterNodes()
    stopTimer()
    state = 'idle'
    setUi()
  }
}

async function stopSession() {
  if (sessionStopping) return
  sessionStopping = true
  els.next.disabled = true
  els.discard.disabled = true
  els.stop.disabled = true
  discardPendingRecording()
  stopPlayback({ resetSeek: true })

  const elapsedMs = startedAt > 0 ? performance.now() - startedAt : 0
  const keepTake = elapsedMs >= 1000
  const shouldAutoplay = els.autoplayAfterStop.checked

  try {
    if (activeRecording && activeRecording.recorder.state !== 'inactive') {
      if (keepTake) {
        await finalizeCurrentTake()
      } else {
        const recording = activeRecording
        activeRecording = null
        pendingTakeOffsetMs = 0
        stopTimer()
        try {
          await stopRecorderToBlob(recording)
        } catch {
          // Too short to keep — discard quietly.
        }
      }
    }
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Impossible d'arrêter proprement.",
    )
  } finally {
    stopMeterNodes()
    if (timerId !== null) {
      window.clearInterval(timerId)
      timerId = null
    }
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) track.stop()
      mediaStream = null
    }
    activeRecording = null
    await closeAudioContext()
    mixSeekMs = 0
    state = 'idle'
    startedAt = 0
    sessionStopping = false
    setUi()
    updateSessionTimer()
    els.mixClock.textContent = '00:00.000'
    updateSeekBar(0)
    els.hint.textContent = ''
  }

  if (shouldAutoplay && tracks.length > 0) {
    setError(null)
    void playTracks(tracks, {
      awaitEnd: true,
      asMix: true,
      applyOffsets: true,
      startAtMs: 0,
    }).catch((error) => {
      setError(error instanceof Error ? error.message : 'Lecture impossible.')
    })
  }
}

els.record.addEventListener('click', () => {
  void startSession()
})
els.next.addEventListener('click', () => {
  void nextTrack()
})
els.discard.addEventListener('click', () => {
  void discardAndRetake()
})
els.stop.addEventListener('click', () => {
  void stopSession()
})

els.selectAll.addEventListener('change', () => {
  if (els.selectAll.checked) {
    for (const track of tracks) enabledTrackIds.add(track.id)
  } else {
    enabledTrackIds.clear()
  }

  for (const track of tracks) {
    setTrackAudible(track.id, enabledTrackIds.has(track.id))
  }
  renderTracks()
})

els.alignAll.addEventListener('change', () => {
  const alignable = alignableTracks()

  if (!els.alignAll.checked) {
    const wasListening = mixListenActive || playingTrackIds.size > 0
    if (wasListening) stopPlayback({ resetSeek: false })
    for (const track of alignable) {
      autoAlignTrackIds.delete(track.id)
      trackAlignDetails.delete(track.id)
      track.offsetMs = 0
    }
    renderTracks()
    return
  }

  for (const track of alignable) autoAlignTrackIds.add(track.id)
  renderTracks()
  void (async () => {
    try {
      setError(null)
      await autoAlignTracksFromCounts()
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Calage auto impossible.',
      )
      renderTracks()
    }
  })()
})

els.playMix.addEventListener('click', () => {
  void (async () => {
    const hasPlayback = playbackSources.length > 0 || playingTrackIds.size > 0
    if (hasPlayback && audioContext) {
      try {
        if (audioContext.state === 'running' && !mixPaused) {
          await audioContext.suspend()
          mixPaused = true
          updateMixButtons()
          updateClockDisplays()
          return
        }
        if (audioContext.state === 'suspended' || mixPaused) {
          await audioContext.resume()
          mixPaused = false
          updateMixButtons()
          updateClockDisplays()
          return
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Impossible de mettre en pause.',
        )
        return
      }
    }

    if (tracks.length === 0) return
    setError(null)
    const duration = getMixDurationMs()
    const startAtMs =
      duration > 0 && mixSeekMs >= Math.max(0, duration - 30) ? 0 : mixSeekMs
    void playTracks(tracks, {
      awaitEnd: true,
      asMix: true,
      applyOffsets: true,
      startAtMs,
    }).catch((error) => {
      setError(error instanceof Error ? error.message : 'Lecture impossible.')
    })
  })()
})

els.calageMode.addEventListener('change', () => {
  setCalageMode(els.calageMode.checked)
})

els.openSettings.addEventListener('click', () => {
  openDeckPanel('settings')
})

els.closeSettings.addEventListener('click', () => {
  leaveDeckOverlay()
})

els.sinkMonitor.addEventListener('change', () => {
  sinkMonitorId = els.sinkMonitor.value
  saveSinkId(SINK_MONITOR_KEY, sinkMonitorId)
  if (currentAudioSinkMode() === 'monitor') void applyAudioSink('monitor')
})

els.sinkPlayback.addEventListener('change', () => {
  sinkPlaybackId = els.sinkPlayback.value
  saveSinkId(SINK_PLAYBACK_KEY, sinkPlaybackId)
  if (currentAudioSinkMode() === 'playback') void applyAudioSink('playback')
})

els.inputMonitor.addEventListener('change', () => {
  inputMonitorId = els.inputMonitor.value
  saveSinkId(INPUT_MONITOR_KEY, inputMonitorId)
  setInputOverrideNote(null)
  // Apply on next take while recording; otherwise reopen to verify the route.
  if (state === 'recording') return
  releaseMic()
  void ensureMic().catch(() => {
    // Next record will surface the error.
  })
})

if (navigator.mediaDevices?.addEventListener) {
  navigator.mediaDevices.addEventListener('devicechange', () => {
    void refreshAudioDeviceOptions()
  })
}

els.openHelp.addEventListener('click', () => {
  openDeckPanel('help')
})

els.closeHelp.addEventListener('click', () => {
  leaveDeckOverlay()
})

function setCalageTipOpen(open: boolean) {
  els.calageTip.hidden = !open
  els.calageInfo.setAttribute('aria-expanded', open ? 'true' : 'false')
}

function setMarkingAccordionOpen(open: boolean) {
  els.markingPanel.hidden = !open
  els.markingAccordion.setAttribute('aria-expanded', open ? 'true' : 'false')
  els.markingHelp.classList.toggle('is-open', open)
}

els.calageInfo.addEventListener('click', (event) => {
  event.stopPropagation()
  setCalageTipOpen(Boolean(els.calageTip.hidden))
})

els.markingAccordion.addEventListener('click', () => {
  setMarkingAccordionOpen(Boolean(els.markingPanel.hidden))
})

document.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Node)) return
  if (!els.calageTip.hidden && !els.calagePanel.contains(target)) {
    setCalageTipOpen(false)
  }
})

els.openAdvanced.addEventListener('click', () => {
  setCalageMode(true)
})

els.dismissSkew.addEventListener('click', () => {
  if (
    referenceBeatWarning &&
    referenceBeatWarning.key !== referenceBeatDismissedKey
  ) {
    referenceBeatDismissedKey = referenceBeatWarning.key
    updateSkewWarning()
    return
  }

  const skewed = tracks
    .map((track, index) => ({ track, index }))
    .filter(
      ({ track }) =>
        track.id !== referenceTrackId && Math.abs(track.offsetMs) > OFFSET_WARN_MS,
    )
  skewWarningDismissedKey = skewFingerprint(skewed)
  els.skewWarning.hidden = true
})

els.restartMix.addEventListener('click', () => {
  void (async () => {
    if (tracks.length === 0) return
    setError(null)
    try {
      await playTracks(tracks, {
        awaitEnd: true,
        asMix: true,
        applyOffsets: true,
        startAtMs: 0,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Lecture impossible.')
    }
  })()
})

els.downloadMix.addEventListener('click', () => {
  void downloadSelectedMix()
})

function seekRatioFromPointer(clientX: number): number {
  const rect = els.mixSeek.getBoundingClientRect()
  if (rect.width <= 0) return 0
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
}

async function seekMixTo(ms: number) {
  if (tracks.length === 0 || state === 'recording') return

  const duration = getMixDurationMs()
  const target = Math.max(0, Math.min(duration, ms))
  mixSeekMs = target
  updateClockDisplays()

  const wasPaused =
    mixPaused && (playbackSources.length > 0 || playingTrackIds.size > 0)

  try {
    setError(null)
    await playTracks(tracks, {
      awaitEnd: true,
      asMix: true,
      applyOffsets: true,
      startAtMs: target,
    })
    if (wasPaused && audioContext) {
      await audioContext.suspend()
      mixPaused = true
      updateMixButtons()
      updateClockDisplays()
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Lecture impossible.')
  }
}

els.mixSeek.addEventListener('pointerdown', (event) => {
  if (tracks.length === 0 || state === 'recording') return
  event.preventDefault()
  seekDragActive = true
  // Stop the playhead clock fighting the scrub preview.
  stopPlayheadClock()
  els.mixSeek.setPointerCapture(event.pointerId)
  const duration = getMixDurationMs()
  mixSeekMs = seekRatioFromPointer(event.clientX) * duration
  updateClockDisplays()
})

els.mixSeek.addEventListener('pointermove', (event) => {
  if (!seekDragActive || tracks.length === 0) return
  const duration = getMixDurationMs()
  mixSeekMs = seekRatioFromPointer(event.clientX) * duration
  updateClockDisplays()
})

els.mixSeek.addEventListener('pointerup', (event) => {
  if (!seekDragActive) return
  seekDragActive = false
  try {
    els.mixSeek.releasePointerCapture(event.pointerId)
  } catch {
    // ignore
  }
  void seekMixTo(mixSeekMs)
})

els.sessionTitle.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    els.sessionTitle.blur()
  }
})

els.sessionTitle.addEventListener('focusin', () => {
  if (!isDefaultSessionTitle(els.sessionTitle.value)) return
  els.sessionTitle.select()
  els.sessionTitle.addEventListener(
    'mouseup',
    (mouseupEvent) => {
      mouseupEvent.preventDefault()
      els.sessionTitle.select()
    },
    { once: true },
  )
})

els.sessionTitle.addEventListener('input', () => {
  els.sessionTitle.classList.toggle(
    'is-default-name',
    isDefaultSessionTitle(els.sessionTitle.value),
  )
})

els.sessionTitle.addEventListener('focusout', () => {
  normalizeSessionTitleInput()
})

els.mixSeek.addEventListener('pointercancel', () => {
  seekDragActive = false
})

els.tracks.addEventListener('keydown', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  if (target.matches('[data-rename-track], [data-offset-track]') && event.key === 'Enter') {
    event.preventDefault()
    target.blur()
  }
})

els.tracks.addEventListener('focusin', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  if (target.matches('[data-offset-track]')) {
    target.select()
    target.addEventListener(
      'mouseup',
      (mouseupEvent) => {
        mouseupEvent.preventDefault()
        target.select()
      },
      { once: true },
    )
    return
  }
  if (!target.matches('[data-rename-track]')) return
  if (!isDefaultTrackName(target.value)) return
  target.select()
  // Le mouseup du clic de focus replace le caret et annule select().
  target.addEventListener(
    'mouseup',
    (mouseupEvent) => {
      mouseupEvent.preventDefault()
      target.select()
    },
    { once: true },
  )
})

els.tracks.addEventListener('focusout', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return

  if (target.matches('[data-offset-track]')) {
    const id = Number(target.dataset.offsetTrack)
    const track = tracks.find((item) => item.id === id)
    if (!track || !Number.isFinite(id)) return
    const parsed = parseOffsetMsInput(target.value)
    const next = parsed ?? Math.round(track.offsetMs)
    if (next !== track.offsetMs) {
      applyManualTrackOffset(track, next)
      renderTracks()
      updateSkewWarning()
      return
    }
    target.value = String(Math.round(track.offsetMs))
    return
  }

  if (!target.matches('[data-rename-track]')) return
  const id = Number(target.dataset.renameTrack)
  const track = tracks.find((item) => item.id === id)
  if (!track || !Number.isFinite(id)) return
  const next = target.value.trim() || defaultTrackName(tracks.indexOf(track) + 1)
  track.name = next.slice(0, 40)
  target.value = track.name
  target.classList.toggle('is-default-name', isDefaultTrackName(track.name))
  updateSkewWarning()
})

els.tracks.addEventListener('input', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  if (!target.matches('[data-rename-track]')) return
  target.classList.toggle('is-default-name', isDefaultTrackName(target.value))
})

els.tracks.addEventListener('change', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return

  if (target.matches('[data-toggle-track]')) {
    const id = Number(target.dataset.toggleTrack)
    if (!Number.isFinite(id)) return
    if (target.checked) enabledTrackIds.add(id)
    else enabledTrackIds.delete(id)
    setTrackAudible(id, target.checked)
    const row = target.closest('.track-row')
    row?.classList.toggle('is-muted', !target.checked)
    updateMixButtons()
    return
  }

  if (target.matches('[data-auto-align-track]')) {
    const id = Number(target.dataset.autoAlignTrack)
    const track = tracks.find((item) => item.id === id)
    if (!track || track.id === referenceTrackId || !Number.isFinite(id)) return

    if (target.checked) {
      autoAlignTrackIds.add(id)
      void (async () => {
        try {
          setError(null)
          await autoAlignTracksFromCounts()
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : 'Calage auto impossible.',
          )
          renderTracks()
        }
      })()
      return
    }

    autoAlignTrackIds.delete(id)
    trackAlignDetails.delete(id)
    track.offsetMs = 0
    const wasListening = mixListenActive || playingTrackIds.size > 0
    if (wasListening) stopPlayback({ resetSeek: false })
    renderTracks()
  }
})

els.tracks.addEventListener('dragstart', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const handle = target.closest<HTMLElement>('[data-drag-track]')
  if (!handle || !(event instanceof DragEvent) || !event.dataTransfer) return

  const id = Number(handle.dataset.dragTrack)
  if (!Number.isFinite(id)) return
  touchReorder = null
  dragTrackId = id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(id))

  const row = handle.closest('.track-row')
  row?.classList.add('is-dragging')
})

els.tracks.addEventListener('dragend', () => {
  clearDragState()
})

els.tracks.addEventListener('dragover', (event) => {
  if (dragTrackId == null || !(event instanceof DragEvent)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  updateDragOverFromPoint(event.clientY)
})

els.tracks.addEventListener('dragleave', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const row = target.closest('.track-row')
  if (!row) return
  const related = event.relatedTarget
  if (related instanceof Node && row.contains(related)) return
  row.classList.remove('drag-over', 'drag-over-before', 'drag-over-after')
})

els.tracks.addEventListener('drop', (event) => {
  if (dragTrackId == null || !(event instanceof DragEvent)) return
  event.preventDefault()
  commitDragOverFromPoint(event.clientY)
})

els.tracks.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse') return
  if (!(event.target instanceof Element)) return
  if (event.target.closest(TOUCH_REORDER_EXCLUDE)) return

  const row = event.target.closest<HTMLElement>('.track-row')
  if (!row) return
  const id = Number(row.dataset.trackId)
  if (!Number.isFinite(id)) return

  touchReorder = {
    pointerId: event.pointerId,
    trackId: id,
    startY: event.clientY,
    active: false,
  }
})

els.tracks.addEventListener(
  'pointermove',
  (event) => {
    if (!touchReorder || touchReorder.pointerId !== event.pointerId) return

    const dy = event.clientY - touchReorder.startY
    if (!touchReorder.active) {
      if (Math.abs(dy) < TOUCH_REORDER_THRESHOLD_PX) return
      touchReorder.active = true
      dragTrackId = touchReorder.trackId
      const row = els.tracks.querySelector<HTMLElement>(
        `.track-row[data-track-id="${touchReorder.trackId}"]`,
      )
      row?.classList.add('is-dragging')
      try {
        row?.setPointerCapture(event.pointerId)
      } catch {
        // Ignore capture failures on older browsers.
      }
    }

    event.preventDefault()
    updateDragOverFromPoint(event.clientY)
  },
  { passive: false },
)

function endTouchReorder(event: PointerEvent) {
  if (!touchReorder || touchReorder.pointerId !== event.pointerId) return
  const wasActive = touchReorder.active
  const clientY = event.clientY
  if (wasActive) {
    commitDragOverFromPoint(clientY)
  } else {
    touchReorder = null
  }
}

els.tracks.addEventListener('pointerup', endTouchReorder)
els.tracks.addEventListener('pointercancel', () => {
  if (!touchReorder) return
  clearDragState()
})

function nextTrackIdAfter(trackId: number): number | null {
  const index = tracks.findIndex((track) => track.id === trackId)
  if (index < 0) return null
  return tracks[index + 1]?.id ?? null
}

els.tracks.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (
    target.closest(
      '[data-toggle-track], .track-mute, .track-check, .track-name, .track-offset, .track-offset-wrap, .track-drag, [data-offset-track], [data-auto-align-track], [data-select-all], [data-align-all], [data-delete-all-tracks]',
    )
  ) {
    return
  }

  const deleteBtn = target.closest<HTMLButtonElement>('[data-delete-track]')
  if (deleteBtn) {
    event.preventDefault()
    const id = Number(deleteBtn.dataset.deleteTrack)
    const index = tracks.findIndex((item) => item.id === id)
    if (index < 0) return
    const track = tracks[index]!
    if (track.id === referenceTrackId) return
    const ok = window.confirm(`Supprimer « ${track.name} » ?`)
    if (!ok) return

    const wasPlaying = playingTrackIds.size > 0 || mixListenActive
    if (wasPlaying) stopPlayback({ resetSeek: false })

    const [removed] = tracks.splice(index, 1)
    if (removed) {
      URL.revokeObjectURL(removed.url)
      bufferCache.delete(removed.id)
      enabledTrackIds.delete(removed.id)
      autoAlignTrackIds.delete(removed.id)
      trackAlignDetails.delete(removed.id)
      trackGains.delete(removed.id)
      trackPlayheads.delete(removed.id)
    }
    // The reference track cannot be deleted; still refresh beat checks.
    syncReferenceTrackRules()
    renderTracks()
    void evaluateReferenceBeat()
    return
  }

  const nudgeBtn = target.closest<HTMLButtonElement>('[data-nudge-track]')
  if (nudgeBtn) {
    event.preventDefault()
    const id = Number(nudgeBtn.dataset.nudgeTrack)
    const delta = Number(nudgeBtn.dataset.nudge)
    const track = tracks.find((item) => item.id === id)
    if (!track || !Number.isFinite(delta)) return

    const wasListening = mixListenActive || playingTrackIds.size > 0
    if (wasListening) stopPlayback({ resetSeek: false })

    track.offsetMs = Math.round(track.offsetMs + delta)
    autoAlignTrackIds.delete(id)
    trackAlignDetails.delete(id)
    renderTracks()
    updateSkewWarning()
  }
})

els.deleteAllTracks.addEventListener('click', () => {
  if (tracks.length === 0 || state === 'recording') return
  const count = tracks.length
  const ok = window.confirm(
    count === 1
      ? `Supprimer la piste « ${tracks[0]!.name} » ?`
      : `Supprimer les ${count} pistes ? Elles seront définitivement perdues.`,
  )
  if (!ok) return

  if (playingTrackIds.size > 0 || mixListenActive) {
    stopPlayback({ resetSeek: true })
  }

  for (const track of tracks) {
    URL.revokeObjectURL(track.url)
  }
  tracks.length = 0
  bufferCache.clear()
  enabledTrackIds.clear()
  autoAlignTrackIds.clear()
  trackAlignDetails.clear()
  trackGains.clear()
  trackPlayheads.clear()
  playingTrackIds.clear()
  syncReferenceTrackRules()
  renderTracks()
  updateSessionTimer()
})

app.querySelectorAll<HTMLButtonElement>('[data-trim-delta]').forEach((button) => {
  button.addEventListener('click', () => {
    const delta = Number(button.dataset.trimDelta)
    if (!Number.isFinite(delta)) return
    saveLatencyTrimMs(latencyTrimMs + delta)
  })
})

window.addEventListener('beforeunload', () => {
  stopPlayback()
  stopMeterNodes()
  if (mediaStream) {
    for (const track of mediaStream.getTracks()) track.stop()
  }
  for (const track of tracks) URL.revokeObjectURL(track.url)
})

function withShortcutHint(label: string, shortcut: string): string {
  return keyboardHintsEnabled ? `${label} (${shortcut})` : label
}

function applyKeyboardShortcutTooltips() {
  const entries: Array<[HTMLElement, string]> = [
    [els.closeSettings, 'Échap'],
    [els.closeHelp, 'Échap'],
    [els.record, 'E / R'],
    [els.next, 'S / N'],
    [els.downloadMix, 'T / D'],
    [els.stop, 'Entrée'],
    [els.discard, 'Suppr'],
    [els.sessionTitle, 'F2'],
  ]
  for (const [el, shortcut] of entries) {
    const base = el.dataset.titleBase ?? el.getAttribute('title') ?? ''
    if (!base) continue
    el.title = withShortcutHint(base, shortcut)
  }
  const playLabel =
    els.playMix.getAttribute('aria-label') === 'Pause' ? 'Pause' : 'Lecture'
  els.playMix.title = withShortcutHint(playLabel, 'Espace')
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  if (target instanceof HTMLElement && target.isContentEditable) return true
  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  )
}

function triggerControl(button: HTMLButtonElement): boolean {
  if (button.disabled || button.hidden) return false
  if (
    typeof button.checkVisibility === 'function' &&
    !button.checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true,
    })
  ) {
    return false
  }
  button.click()
  return true
}

function enableKeyboardHintsFromDevice() {
  if (keyboardHintsEnabled) return
  keyboardHintsEnabled = true
  applyKeyboardShortcutTooltips()
  updateHelpShortcutsVisibility()
}

window.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return

  // First real key press ⇒ show shortcut hints (hybrids / clavier Bluetooth).
  if (
    !keyboardHintsEnabled &&
    (event.key.length === 1 ||
      event.key === 'Escape' ||
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'F2' ||
      event.key === 'Delete')
  ) {
    enableKeyboardHintsFromDevice()
  }

  const overlayOpen = !els.deckSettings.hidden || !els.deckHelp.hidden
  if (overlayOpen) {
    if (event.key === 'Escape') {
      event.preventDefault()
      leaveDeckOverlay()
    }
    return
  }

  if (event.key === 'F2') {
    event.preventDefault()
    els.sessionTitle.focus()
    if (isDefaultSessionTitle(els.sessionTitle.value)) els.sessionTitle.select()
    return
  }

  if (isEditableKeyboardTarget(event.target)) return

  if (event.key === ' ' || event.code === 'Space') {
    if (triggerControl(els.playMix)) event.preventDefault()
    return
  }

  if (state === 'recording') {
    if (event.key === 'Enter') {
      if (triggerControl(els.stop)) event.preventDefault()
      return
    }
    if (event.key === 'Delete') {
      if (triggerControl(els.discard)) event.preventDefault()
      return
    }
    const key = event.key.toLowerCase()
    if (key === 's' || key === 'n') {
      if (triggerControl(els.next)) event.preventDefault()
      return
    }
    return
  }

  const key = event.key.toLowerCase()
  if (key === 'e' || key === 'r') {
    if (triggerControl(els.record)) event.preventDefault()
    return
  }
  if (key === 'd' || key === 't') {
    if (triggerControl(els.downloadMix)) event.preventDefault()
    return
  }
})

applyKeyboardShortcutTooltips()
updateHelpShortcutsVisibility()
updateDeviceSettingsUi(supportsAudioSinkSelect())
void refreshAudioDeviceOptions()

{
  const initialDeck = deckViewFromUrl()
  applyDeckView(initialDeck)
  history.replaceState(
    { polyrecorderDeck: initialDeck } satisfies DeckHistoryState,
    '',
    deckViewUrl(initialDeck),
  )
}

window.addEventListener('popstate', (event) => {
  syncDeckViewFromHistory(event.state)
})

setUi()
updateCalageDisplay()
void ensureAudioContext()
  .then((ctx) => {
    lastReportedLatencyMs = Math.round(getReportedLatencyMs(ctx))
    updateCalageDisplay()
  })
  .catch(() => {
    updateCalageDisplay()
  })
