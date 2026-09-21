import './style.css'

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
      <p>Enregistre, superpose, écoute.</p>
    </header>

    <section class="deck" aria-label="Enregistreur">
      <div class="status">
        <div class="status-label">
          <span class="pulse" data-pulse aria-hidden="true"></span>
          <span data-status>Prêt</span>
        </div>
        <div class="timer" data-timer>00:00</div>
      </div>

      <div class="capture-bar">
        <div class="meter" aria-hidden="true"><span data-meter></span></div>
        <div class="capture-actions" data-controls>
          <button
            type="button"
            class="btn btn-transport btn-next"
            data-next
            hidden
            disabled
            aria-label="Piste suivante"
            title="Piste suivante"
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M5.5 5.5v13l9.5-6.5-9.5-6.5zm11 0h2.5v13H16.5V5.5z"/>
            </svg>
          </button>
          <button
            type="button"
            class="btn btn-transport btn-record"
            data-record
            aria-label="Enregistrer"
            title="Enregistrer"
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
          >
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="7" y="7" width="10" height="10" rx="1.75" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="calage" data-calage hidden>
        <div class="calage-top">
          <div class="calage-heading">
            <span class="calage-title">Calage monitoring</span>
            <button
              type="button"
              class="btn-info"
              data-calage-info
              aria-expanded="false"
              aria-controls="calage-info-tip"
              title="À propos du calage monitoring"
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

      <div class="tracks" data-tracks-panel hidden>
        <p class="ref-peaks" data-ref-peaks hidden></p>
        <div class="mix-transport">
          <button type="button" class="btn btn-restart" data-restart-mix disabled aria-label="Revenir au début" title="Revenir au début">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" fill="currentColor"/>
            </svg>
          </button>
          <button type="button" class="btn btn-play" data-play-mix disabled aria-label="Lecture">
            <svg class="icon icon-play" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" fill="currentColor"/>
            </svg>
            <svg class="icon icon-pause" viewBox="0 0 24 24" aria-hidden="true" hidden>
              <path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor"/>
            </svg>
          </button>
          <span class="mix-transport-balance" aria-hidden="true"></span>
        </div>
        <p class="mix-clock" data-mix-clock>00:00.00</p>
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
        <div class="tracks-master-row">
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
          <span class="tracks-master-spacer" aria-hidden="true"></span>
          <label class="track-check track-check-align" data-align-header hidden title="Activer / désactiver le calage auto (sauf piste 1)">
            <input type="checkbox" data-align-all aria-label="Calage auto sur toutes les pistes" />
            <span class="track-check-box" aria-hidden="true"></span>
          </label>
          <span class="tracks-master-nudge" data-align-nudge-spacer hidden aria-hidden="true"></span>
        </div>
        <ul data-tracks></ul>
      </div>

      <div class="skew-warning" data-skew-warning hidden title="Un calage auto supérieur à 300 ms indique souvent un problème de sync (marquages peu clairs, latence, etc.). Ouvre le mode avancé pour inspecter et ajuster.">
        <button type="button" class="btn-skew-close" data-dismiss-skew aria-label="Fermer" title="Fermer">×</button>
        <strong>Attention</strong>
        <span data-skew-warning-text></span>
        <button type="button" class="btn btn-skew" data-open-advanced>Ouvrir le mode avancé</button>
      </div>

      <p class="error" data-error hidden></p>

      <p class="marking-help" data-marking-help>
        Piste 1 : quatre marquages (« 1 2 3 4 » ou 4 claquements).<br />
        Pistes suivantes : marquage synchronisé sur les 3ème et 4ème.
      </p>

      <div class="mode-row">
        <label class="mode-toggle">
          <input type="checkbox" data-calage-mode />
          <span>Mode avancé</span>
        </label>
      </div>
    </section>

    <p class="hint" data-hint></p>
  </main>
`

const els = {
  status: app.querySelector<HTMLElement>('[data-status]')!,
  pulse: app.querySelector<HTMLElement>('[data-pulse]')!,
  timer: app.querySelector<HTMLElement>('[data-timer]')!,
  meter: app.querySelector<HTMLElement>('[data-meter]')!,
  controls: app.querySelector<HTMLElement>('[data-controls]')!,
  record: app.querySelector<HTMLButtonElement>('[data-record]')!,
  next: app.querySelector<HTMLButtonElement>('[data-next]')!,
  stop: app.querySelector<HTMLButtonElement>('[data-stop]')!,
  tracksPanel: app.querySelector<HTMLElement>('[data-tracks-panel]')!,
  tracks: app.querySelector<HTMLUListElement>('[data-tracks]')!,
  selectAll: app.querySelector<HTMLInputElement>('[data-select-all]')!,
  playMix: app.querySelector<HTMLButtonElement>('[data-play-mix]')!,
  restartMix: app.querySelector<HTMLButtonElement>('[data-restart-mix]')!,
  playIcon: app.querySelector<SVGElement>('.icon-play')!,
  pauseIcon: app.querySelector<SVGElement>('.icon-pause')!,
  mixClock: app.querySelector<HTMLElement>('[data-mix-clock]')!,
  mixSeek: app.querySelector<HTMLElement>('[data-mix-seek]')!,
  mixSeekFill: app.querySelector<HTMLElement>('[data-mix-seek-fill]')!,
  calageMode: app.querySelector<HTMLInputElement>('[data-calage-mode]')!,
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
  error: app.querySelector<HTMLElement>('[data-error]')!,
  hint: app.querySelector<HTMLElement>('[data-hint]')!,
}

const MIX_LOOKAHEAD_S = 0.12
/** Fallback when the browser reports no output latency (seconds). */
const DEFAULT_MONITOR_LATENCY_S = 0.045
const LATENCY_TRIM_KEY = 'polyrecorder.latencyTrimMs'
const OFFSET_WARN_MS = 300

let state: AppState = 'idle'
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
let trackGains = new Map<number, GainNode>()
let calageMode = false
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
let lastReportedLatencyMs = Math.round(DEFAULT_MONITOR_LATENCY_S * 1000)
let skewWarningDismissedKey = ''
let refPeaksLabel = ''
let trackAlignDetails = new Map<number, { delta3Ms: number; delta4Ms: number }>()
/** Remembered mix playhead when playback is stopped. */
let mixSeekMs = 0
let seekDragActive = false

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

function formatSignedMs(ms: number): string {
  const rounded = Math.round(ms)
  if (rounded > 0) return `+${rounded} ms`
  return `${rounded} ms`
}

function updateCalageDisplay() {
  const total = Math.max(0, lastReportedLatencyMs + latencyTrimMs)
  const trimLabel =
    latencyTrimMs === 0 ? 'sans correctif' : `correctif ${formatSignedMs(latencyTrimMs)}`
  els.trimValue.textContent = `${total} ms (${trimLabel})`
}

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatCentis(ms: number): string {
  const cs = Math.max(0, Math.floor(ms / 10))
  const m = Math.floor(cs / 6000)
  const s = Math.floor((cs % 6000) / 100)
  const c = cs % 100
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`
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

function setError(message: string | null) {
  if (!message) {
    els.error.hidden = true
    els.error.textContent = ''
    return
  }
  els.error.hidden = false
  els.error.textContent = message
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
  els.calagePanel.hidden = !on
  els.alignHeader.hidden = !on || tracks.length < 2
  els.alignNudgeSpacer.hidden = !on || tracks.length < 2
  els.openAdvanced.hidden = on
  if (!on) setCalageTipOpen(false)
  updateRefPeaksDisplay()
  renderTracks()
  updateMixButtons()
}

function alignableTracks(): Track[] {
  return tracks.slice(1)
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
  if (mediaStream) {
    const live = mediaStream.getAudioTracks().some((track) => track.readyState === 'live')
    if (live) return mediaStream
    mediaStream = null
  }

  // Disable browser voice processing: with monitor playback, echoCancellation
  // and noiseSuppression make the next take metallic and very quiet.
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      channelCount: 1,
    },
  })
  return mediaStream
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
  els.timer.textContent = '00:00'
  if (timerId !== null) window.clearInterval(timerId)
  timerId = window.setInterval(() => {
    els.timer.textContent = formatTime(performance.now() - startedAt)
  }, 200)
}

function stopTimer(): number {
  const elapsed = startedAt > 0 ? performance.now() - startedAt : 0
  startedAt = 0
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
  els.timer.textContent = formatTime(elapsed)
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
  renderTracks()
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
  const skewed = tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track, index }) => index > 0 && Math.abs(track.offsetMs) > OFFSET_WARN_MS)

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
    : `Calage auto élevé sur ${names}. Vérifie le sync en mode avancé.`
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

  els.alignHeader.hidden = !calageMode || alignable.length === 0
  els.alignNudgeSpacer.hidden = !calageMode || alignable.length === 0
  els.alignAll.disabled = alignable.length === 0 || !calageMode
  els.alignAll.checked = allAutoAlign
  els.alignAll.indeterminate =
    alignable.some((track) => autoAlignTrackIds.has(track.id)) && !allAutoAlign

  els.playMix.disabled = tracks.length === 0
  els.playMix.setAttribute('aria-label', isPausedOrIdle ? 'Lecture' : 'Pause')
  els.playMix.setAttribute('aria-pressed', isPausedOrIdle ? 'false' : 'true')
  els.playIcon.toggleAttribute('hidden', !isPausedOrIdle)
  els.pauseIcon.toggleAttribute('hidden', isPausedOrIdle)
  els.restartMix.disabled = tracks.length === 0

  updateSkewWarning()
}

function renderTracks() {
  if (tracks.length === 0) {
    els.tracksPanel.hidden = true
    els.tracks.innerHTML = ''
    refPeaksLabel = ''
    trackAlignDetails.clear()
    updateRefPeaksDisplay()
    updateMixButtons()
    return
  }

  els.tracksPanel.hidden = false
  updateRefPeaksDisplay()
  els.tracks.innerHTML = tracks
    .map((track, index) => {
      const isEnabled = enabledTrackIds.has(track.id)
      const autoAlign = autoAlignTrackIds.has(track.id)
      const clock = formatCentis(getTrackPositionMs(track.id))
      const isReference = index === 0
      const alignDetail = trackAlignDetails.get(track.id)
      const alignDetailText =
        alignDetail && !isReference
          ? formatAlignDetail(track.offsetMs, alignDetail)
          : ''
      const calageControls = calageMode
        ? `
        ${
          isReference
            ? `<span class="track-check-spacer" aria-hidden="true"></span>`
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
          <small class="track-offset" data-track-offset="${track.id}">${formatSignedMs(track.offsetMs)}</small>
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
      <li class="track-row${calageMode ? ' is-advanced' : ''}${isEnabled ? '' : ' is-muted'}">
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
              class="track-name"
              data-rename-track="${track.id}"
              value="${escapeHtml(track.name)}"
              aria-label="Nom de la piste"
              maxlength="40"
            />
            <span class="track-meta">
              ${
                calageMode
                  ? `<small class="track-clock" data-track-clock="${track.id}">${clock}</small>`
                  : ''
              }
              <small class="track-duration">${formatTime(track.durationMs)}</small>
            </span>
          </div>
          <button
            type="button"
            class="btn btn-trash"
            data-delete-track="${track.id}"
            aria-label="Supprimer ${escapeHtml(track.name)}"
            title="Supprimer"
          >
            ×
          </button>
        </div>
        ${calageControls}
      </li>
    `
    })
    .join('')
  updateMixButtons()
  updateClockDisplays()
}

function setUi() {
  const recording = state === 'recording'

  els.pulse.classList.toggle('live', recording)
  els.controls.classList.toggle('recording', recording)
  els.record.hidden = recording
  els.record.disabled = recording
  els.next.hidden = !recording
  els.stop.hidden = !recording
  els.next.disabled = !recording
  els.stop.disabled = !recording

  if (state === 'idle') {
    els.status.textContent = 'Prêt'
    els.hint.textContent = ''
  } else if (state === 'recording') {
    const layer = tracks.length
    els.status.textContent =
      layer === 0
        ? 'Enregistrement · piste 1'
        : `Enregistrement · piste ${layer + 1}`
    els.hint.textContent =
      layer === 0
        ? 'Piste suivante : rejoue cette prise et enregistre la suivante en même temps.'
        : 'Casque recommandé. Monitoring compensé pour la latence audio.'
  } else {
    els.status.textContent = 'Lecture…'
    els.hint.textContent = 'Écoute en cours.'
  }

  updateMixButtons()
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

/**
 * Align later takes on track 1 using shared "3-4" counts.
 * Track 1 must contain 1-2-3-4; later tracks should contain 3-4 in sync with what was heard.
 */
async function autoAlignTracksFromCounts(): Promise<void> {
  if (tracks.length < 2) {
    throw new Error('Il faut au moins deux pistes pour caler.')
  }

  const reference = tracks[0]
  if (!reference) {
    throw new Error('Piste de référence manquante.')
  }

  const refBuffer = await decodeTrack(reference)
  const refPeaks = findVolumePeaks(refBuffer, 4)
  if (refPeaks.length < 4) {
    throw new Error(
      `Piste 1 : ${refPeaks.length}/4 attaques trouvées. Fais 4 sons bien espacés (voix ou claquements).`,
    )
  }

  const refThree = refPeaks[2]!
  const refFour = refPeaks[3]!
  refPeaksLabel = `Réf. pics 3–4 : ${formatCentis(refThree * 1000)} / ${formatCentis(refFour * 1000)}`
  updateRefPeaksDisplay()

  for (let index = 1; index < tracks.length; index++) {
    const track = tracks[index]
    if (!track) continue
    if (!autoAlignTrackIds.has(track.id)) continue

    const buffer = await decodeTrack(track)
    const peaks = findVolumePeaks(buffer, 2)
    if (peaks.length < 2) {
      throw new Error(
        `Piste ${index + 1} : ${peaks.length}/2 attaques trouvées. Fais 2 sons nets pour « 3 4 » (voix ou claquements).`,
      )
    }

    const takeThree = peaks[0]!
    const takeFour = peaks[1]!

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
  const hasTargets = tracks
    .slice(1)
    .some((track) => autoAlignTrackIds.has(track.id))
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

  const startAtMs = Math.max(0, options?.startAtMs ?? 0)
  stopPlayback({ resetSeek: false })
  mixSeekMs = startAtMs
  mixListenActive = asMix
  updateMixButtons()

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

  renderTracks()
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
      els.mixClock.textContent = '00:00.00'
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
  // Reference track (first) is never auto-aligned; later takes are by default.
  if (tracks.length > 1) {
    autoAlignTrackIds.add(track.id)
  }
  renderTracks()
  await maybeAutoAlignAfterTake()
  return track
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
  els.next.disabled = true
  els.stop.disabled = true
  discardPendingRecording()
  stopPlayback({ resetSeek: true })

  try {
    if (activeRecording && activeRecording.recorder.state !== 'inactive') {
      await finalizeCurrentTake()
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
    setUi()
    els.timer.textContent = '00:00'
    els.mixClock.textContent = '00:00.00'
    updateSeekBar(0)
    els.hint.textContent =
      tracks.length > 0
        ? `${tracks.length} piste${tracks.length > 1 ? 's' : ''} capturée${tracks.length > 1 ? 's' : ''}.`
        : ''
  }
}

els.record.addEventListener('click', () => {
  void startSession()
})
els.next.addEventListener('click', () => {
  void nextTrack()
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

function setCalageTipOpen(open: boolean) {
  els.calageTip.hidden = !open
  els.calageInfo.setAttribute('aria-expanded', open ? 'true' : 'false')
}

els.calageInfo.addEventListener('click', (event) => {
  event.stopPropagation()
  setCalageTipOpen(Boolean(els.calageTip.hidden))
})

document.addEventListener('click', (event) => {
  if (els.calageTip.hidden) return
  const target = event.target
  if (!(target instanceof Node)) return
  if (els.calagePanel.contains(target)) return
  setCalageTipOpen(false)
})

els.openAdvanced.addEventListener('click', () => {
  setCalageMode(true)
  els.calagePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
})

els.dismissSkew.addEventListener('click', () => {
  const skewed = tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track, index }) => index > 0 && Math.abs(track.offsetMs) > OFFSET_WARN_MS)
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

function seekRatioFromPointer(clientX: number): number {
  const rect = els.mixSeek.getBoundingClientRect()
  if (rect.width <= 0) return 0
  return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
}

async function seekMixTo(ms: number) {
  const duration = getMixDurationMs()
  const target = Math.max(0, Math.min(duration, ms))
  mixSeekMs = target
  updateClockDisplays()

  const hasPlayback = playbackSources.length > 0 || playingTrackIds.size > 0
  if (!hasPlayback) return

  const resumePaused = mixPaused
  try {
    await playTracks(tracks, {
      awaitEnd: true,
      asMix: true,
      applyOffsets: true,
      startAtMs: target,
    })
    if (resumePaused && audioContext) {
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
  if (tracks.length === 0) return
  event.preventDefault()
  seekDragActive = true
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

els.mixSeek.addEventListener('pointercancel', () => {
  seekDragActive = false
})

els.tracks.addEventListener('keydown', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  if (!target.matches('[data-rename-track]')) return
  if (event.key === 'Enter') {
    event.preventDefault()
    target.blur()
  }
})

els.tracks.addEventListener('focusout', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement)) return
  if (!target.matches('[data-rename-track]')) return
  const id = Number(target.dataset.renameTrack)
  const track = tracks.find((item) => item.id === id)
  if (!track || !Number.isFinite(id)) return
  const next = target.value.trim() || defaultTrackName(tracks.indexOf(track) + 1)
  if (track.name === next) {
    target.value = track.name
    return
  }
  track.name = next.slice(0, 40)
  target.value = track.name
  updateSkewWarning()
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
    const trackIndex = tracks.findIndex((item) => item.id === id)
    if (!track || trackIndex < 1 || !Number.isFinite(id)) return

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
    renderTracks()
  }
})

els.tracks.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (
    target.closest(
      '[data-toggle-track], .track-mute, .track-check, .track-name, [data-auto-align-track], [data-select-all], [data-align-all]',
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
    // The new first track becomes the reference: never auto-aligned.
    if (tracks[0]) {
      autoAlignTrackIds.delete(tracks[0].id)
      trackAlignDetails.delete(tracks[0].id)
    }
    if (tracks.length < 2) {
      refPeaksLabel = ''
      trackAlignDetails.clear()
    }
    renderTracks()
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
  }
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
