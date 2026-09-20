import './style.css'

type AppState = 'idle' | 'recording' | 'playing'

type Track = {
  id: number
  blob: Blob
  url: string
  durationMs: number
}

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('Missing #app root')
}

app.innerHTML = `
  <main class="stage">
    <header class="brand">
      <h1>PolyRecorder</h1>
      <p>Enregistre, passe à la piste suivante, écoute, recommence.</p>
    </header>

    <section class="deck" aria-label="Enregistreur">
      <div class="status">
        <div class="status-label">
          <span class="pulse" data-pulse aria-hidden="true"></span>
          <span data-status>Prêt</span>
        </div>
        <div class="timer" data-timer>00:00</div>
      </div>

      <div class="meter" aria-hidden="true"><span data-meter></span></div>

      <div class="controls" data-controls>
        <button type="button" class="btn btn-record" data-record>Enregistrer</button>
        <button type="button" class="btn btn-next" data-next hidden disabled>Piste suivante</button>
        <button type="button" class="btn btn-stop" data-stop hidden disabled>Stop</button>
      </div>

      <div class="tracks" data-tracks-panel hidden>
        <h2>Pistes</h2>
        <ul data-tracks></ul>
      </div>

      <p class="error" data-error hidden></p>
    </section>

    <p class="hint" data-hint>
      Appuie sur Enregistrer pour commencer. Piste suivante coupe, lit, puis relance.
    </p>
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
  error: app.querySelector<HTMLElement>('[data-error]')!,
  hint: app.querySelector<HTMLElement>('[data-hint]')!,
}

let state: AppState = 'idle'
let mediaStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let chunks: BlobPart[] = []
let tracks: Track[] = []
let trackCounter = 0
let startedAt = 0
let timerId: number | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let meterRaf: number | null = null
let playbackAudios: HTMLAudioElement[] = []
let preferMimeType = ''

function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

async function ensureMic(): Promise<MediaStream> {
  if (mediaStream) return mediaStream
  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  })
  return mediaStream
}

function startMeter(stream: MediaStream) {
  stopMeter()
  audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  analyser = audioContext.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)

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

function stopMeter() {
  if (meterRaf !== null) {
    cancelAnimationFrame(meterRaf)
    meterRaf = null
  }
  els.meter.style.width = '0%'
  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
  analyser = null
}

function startTimer() {
  startedAt = performance.now()
  els.timer.textContent = '00:00'
  if (timerId !== null) window.clearInterval(timerId)
  timerId = window.setInterval(() => {
    els.timer.textContent = formatTime(performance.now() - startedAt)
  }, 200)
}

function stopTimer(): number {
  const elapsed = performance.now() - startedAt
  if (timerId !== null) {
    window.clearInterval(timerId)
    timerId = null
  }
  els.timer.textContent = formatTime(elapsed)
  return elapsed
}

function stopPlayback() {
  for (const audio of playbackAudios) {
    audio.pause()
    audio.src = ''
  }
  playbackAudios = []
}

function renderTracks() {
  if (tracks.length === 0) {
    els.tracksPanel.hidden = true
    els.tracks.innerHTML = ''
    return
  }

  els.tracksPanel.hidden = false
  els.tracks.innerHTML = tracks
    .map(
      (track, index) => `
      <li>
        <span>Piste ${index + 1}</span>
        <small>${formatTime(track.durationMs)}</small>
      </li>
    `,
    )
    .join('')
}

function setUi() {
  const recording = state === 'recording'
  const active = state !== 'idle'

  els.pulse.classList.toggle('live', recording)
  els.controls.classList.toggle('armed', active)
  els.record.hidden = active
  els.next.hidden = !active
  els.stop.hidden = !active
  els.next.disabled = !recording
  els.stop.disabled = !active
  els.record.disabled = active

  if (state === 'idle') {
    els.status.textContent = 'Prêt'
    els.hint.textContent =
      'Appuie sur Enregistrer pour commencer. Piste suivante coupe, lit, puis relance.'
  } else if (state === 'recording') {
    els.status.textContent = `Enregistrement · piste ${tracks.length + 1}`
    els.hint.textContent =
      'Piste suivante : stoppe, lit la prise, puis démarre la suivante. Stop termine la session.'
  } else {
    els.status.textContent = 'Lecture…'
    els.hint.textContent = 'Lecture de la dernière piste, nouvel enregistrement à suivre.'
  }
}

function waitForRecorderStop(recorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const onStop = () => {
      recorder.removeEventListener('error', onError)
      const type = recorder.mimeType || preferMimeType || 'audio/webm'
      resolve(new Blob(chunks, { type }))
    }
    const onError = () => {
      recorder.removeEventListener('stop', onStop)
      reject(new Error("L'enregistrement a échoué."))
    }
    recorder.addEventListener('stop', onStop, { once: true })
    recorder.addEventListener('error', onError, { once: true })
    recorder.stop()
  })
}

async function playTrack(track: Track): Promise<void> {
  stopPlayback()
  const audio = new Audio(track.url)
  playbackAudios = [audio]
  await new Promise<void>((resolve, reject) => {
    audio.addEventListener('ended', () => resolve(), { once: true })
    audio.addEventListener(
      'error',
      () => reject(new Error('Lecture impossible.')),
      { once: true },
    )
    void audio.play().catch(reject)
  })
}

async function beginRecording() {
  setError(null)
  const stream = await ensureMic()
  preferMimeType = pickMimeType()
  chunks = []

  mediaRecorder = preferMimeType
    ? new MediaRecorder(stream, { mimeType: preferMimeType })
    : new MediaRecorder(stream)

  mediaRecorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })

  mediaRecorder.start(100)
  startMeter(stream)
  startTimer()
  state = 'recording'
  setUi()
}

async function finalizeCurrentTake(): Promise<Track> {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    throw new Error('Aucun enregistrement en cours.')
  }

  const durationMs = stopTimer()
  stopMeter()
  const blob = await waitForRecorderStop(mediaRecorder)
  mediaRecorder = null

  trackCounter += 1
  const track: Track = {
    id: trackCounter,
    blob,
    url: URL.createObjectURL(blob),
    durationMs,
  }
  tracks.push(track)
  renderTracks()
  return track
}

async function startSession() {
  try {
    await beginRecording()
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
    const track = await finalizeCurrentTake()
    state = 'playing'
    setUi()
    await playTrack(track)
    await beginRecording()
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Impossible de passer à la piste suivante.',
    )
    state = tracks.length > 0 ? 'idle' : 'idle'
    stopMeter()
    stopTimer()
    setUi()
  }
}

async function stopSession() {
  els.next.disabled = true
  els.stop.disabled = true
  stopPlayback()

  try {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      await finalizeCurrentTake()
    }
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : "Impossible d'arrêter proprement.",
    )
  } finally {
    stopMeter()
    if (timerId !== null) {
      window.clearInterval(timerId)
      timerId = null
    }
    if (mediaStream) {
      for (const track of mediaStream.getTracks()) track.stop()
      mediaStream = null
    }
    mediaRecorder = null
    state = 'idle'
    setUi()
    els.timer.textContent = '00:00'
    els.hint.textContent =
      tracks.length > 0
        ? `${tracks.length} piste${tracks.length > 1 ? 's' : ''} capturée${tracks.length > 1 ? 's' : ''}. Relance Enregistrer pour une nouvelle session.`
        : 'Appuie sur Enregistrer pour commencer. Piste suivante coupe, lit, puis relance.'
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

window.addEventListener('beforeunload', () => {
  stopPlayback()
  stopMeter()
  if (mediaStream) {
    for (const track of mediaStream.getTracks()) track.stop()
  }
  for (const track of tracks) URL.revokeObjectURL(track.url)
})

setUi()
