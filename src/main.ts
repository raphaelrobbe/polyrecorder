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
      <p>Enregistre, superpose, écoute. Piste suivante = lecture + nouvelle prise.</p>
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
        <div class="tracks-header">
          <h2>Pistes</h2>
          <div class="tracks-actions">
            <button type="button" class="btn btn-select" data-select-all>
              Sélectionner tout
            </button>
            <button type="button" class="btn btn-listen" data-listen-selected>
              Écouter les pistes sélectionnées
            </button>
          </div>
        </div>
        <ul data-tracks></ul>
      </div>

      <p class="error" data-error hidden></p>
    </section>

    <p class="hint" data-hint>
      Appuie sur Enregistrer pour commencer. Piste suivante rejoue et enregistre en même temps.
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
  selectAll: app.querySelector<HTMLButtonElement>('[data-select-all]')!,
  listenSelected: app.querySelector<HTMLButtonElement>('[data-listen-selected]')!,
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
let meterSource: MediaStreamAudioSourceNode | null = null
let meterRaf: number | null = null
let playbackAudios: HTMLAudioElement[] = []
let playingTrackIds = new Set<number>()
let enabledTrackIds = new Set<number>()
let mixListenActive = false
let playWaiters: Array<() => void> = []
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

function startMeter(stream: MediaStream) {
  stopMeter(false)

  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  // Clone tracks so the analyser never touches the MediaRecorder input.
  const meterStream = new MediaStream(
    stream.getAudioTracks().map((track) => track.clone()),
  )
  meterSource = audioContext.createMediaStreamSource(meterStream)
  analyser = audioContext.createAnalyser()
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

function stopMeter(closeContext = true) {
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

  if (closeContext && audioContext) {
    void audioContext.close()
    audioContext = null
  }
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

function stopPlayback() {
  for (const audio of playbackAudios) {
    audio.onended = null
    audio.onerror = null
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }
  playbackAudios = []
  playingTrackIds.clear()
  mixListenActive = false
  settlePlayWaiters()
  renderTracks()
  updateMixButtons()
}

function selectedTracks(): Track[] {
  return tracks.filter((track) => enabledTrackIds.has(track.id))
}

function updateMixButtons() {
  const selectedCount = selectedTracks().length
  const allSelected =
    tracks.length > 0 && selectedCount === tracks.length

  els.selectAll.disabled = tracks.length === 0
  els.selectAll.textContent = allSelected
    ? 'Désélectionner tout'
    : 'Sélectionner tout'

  els.listenSelected.disabled = tracks.length === 0 || selectedCount === 0
  els.listenSelected.textContent = mixListenActive
    ? 'Arrêter'
    : 'Écouter les pistes sélectionnées'
  els.listenSelected.setAttribute(
    'aria-pressed',
    mixListenActive ? 'true' : 'false',
  )
}

function renderTracks() {
  if (tracks.length === 0) {
    els.tracksPanel.hidden = true
    els.tracks.innerHTML = ''
    updateMixButtons()
    return
  }

  els.tracksPanel.hidden = false
  els.tracks.innerHTML = tracks
    .map((track, index) => {
      const isPlaying = playingTrackIds.has(track.id)
      const isEnabled = enabledTrackIds.has(track.id)
      return `
      <li class="track-row${isEnabled ? '' : ' is-muted'}">
        <label class="track-arm" title="${isEnabled ? 'Inclure dans le mix' : 'Exclure du mix'}">
          <input
            type="checkbox"
            data-toggle-track="${track.id}"
            ${isEnabled ? 'checked' : ''}
            aria-label="Inclure la piste ${index + 1} dans le mix"
          />
          <span class="track-arm-box" aria-hidden="true"></span>
        </label>
        <button
          type="button"
          class="track-btn${isPlaying ? ' is-playing' : ''}"
          data-play-track="${track.id}"
          aria-pressed="${isPlaying ? 'true' : 'false'}"
        >
          <span class="track-btn-label">
            <span class="track-btn-icon" aria-hidden="true">${isPlaying ? '■' : '▶'}</span>
            Piste ${index + 1}
          </span>
          <small>${formatTime(track.durationMs)}</small>
        </button>
      </li>
    `
    })
    .join('')
  updateMixButtons()
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
      'Appuie sur Enregistrer pour commencer. Sélectionne les voix, puis écoute la sélection.'
  } else if (state === 'recording') {
    const layer = tracks.length
    els.status.textContent =
      layer === 0
        ? 'Enregistrement · piste 1'
        : `Enregistrement · piste ${layer + 1} (polyphonie)`
    els.hint.textContent =
      layer === 0
        ? 'Piste suivante : rejoue cette prise et enregistre la suivante en même temps.'
        : 'Casque recommandé. Les pistes précédentes passent pendant que tu enregistres.'
  } else {
    els.status.textContent = 'Lecture…'
    els.hint.textContent = 'Écoute en cours.'
  }
}

function stopRecorderToBlob(recorder: MediaRecorder): Promise<Blob> {
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

    try {
      recorder.stop()
    } catch (error) {
      recorder.removeEventListener('stop', onStop)
      recorder.removeEventListener('error', onError)
      reject(error instanceof Error ? error : new Error("L'enregistrement a échoué."))
    }
  })
}

function playTracks(
  tracksToPlay: Track[],
  options?: { awaitEnd?: boolean; asMix?: boolean },
): Promise<void> {
  const playable = tracksToPlay.filter((track) => track.blob.size > 0)
  if (playable.length === 0) {
    return Promise.reject(new Error('Piste vide, rien à lire.'))
  }

  stopPlayback()
  mixListenActive = Boolean(options?.asMix)
  updateMixButtons()

  const audios = playable.map((track) => {
    const audio = new Audio(track.url)
    // Keep monitor below unity to reduce speaker bleed into the mic.
    audio.volume = 0.85
    playingTrackIds.add(track.id)
    return audio
  })
  playbackAudios = audios
  renderTracks()

  const awaitEnd = options?.awaitEnd ?? true

  return new Promise<void>((resolve, reject) => {
    let settled = false
    let remaining = audios.length
    let failed = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      playWaiters = playWaiters.filter((waiter) => waiter !== resolveAsDone)
      fn()
    }

    const clearPlayingUi = () => {
      playingTrackIds.clear()
      playbackAudios = []
      mixListenActive = false
      renderTracks()
      updateMixButtons()
    }

    const resolveAsDone = () => {
      finish(() => {
        clearPlayingUi()
        resolve()
      })
    }

    if (awaitEnd) {
      playWaiters.push(resolveAsDone)
    }

    for (const audio of audios) {
      audio.onended = () => {
        remaining -= 1
        if (remaining > 0 || failed) return

        if (awaitEnd) {
          resolveAsDone()
          return
        }

        clearPlayingUi()
      }
      audio.onerror = () => {
        failed = true
        finish(() => {
          clearPlayingUi()
          reject(new Error('Lecture impossible.'))
        })
      }
    }

    void Promise.all(audios.map((audio) => audio.play())).then(
      () => {
        if (!awaitEnd) {
          finish(() => resolve())
        }
      },
      (error) => {
        finish(() => {
          clearPlayingUi()
          reject(error instanceof Error ? error : new Error('Lecture impossible.'))
        })
      },
    )
  })
}

function playTrack(track: Track): Promise<void> {
  return playTracks([track], { awaitEnd: true })
}

async function beginRecording() {
  setError(null)
  const stream = await ensureMic()
  preferMimeType = pickMimeType()
  chunks = []

  const recorder = preferMimeType
    ? new MediaRecorder(stream, { mimeType: preferMimeType })
    : new MediaRecorder(stream)

  recorder.addEventListener('dataavailable', (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  })

  mediaRecorder = recorder
  // No timeslice: one complete blob on stop (avoids truncated / broken webm).
  recorder.start()
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
  const recorder = mediaRecorder
  mediaRecorder = null

  // Stop recorder before tearing down the meter so the mic stream stays live.
  const blob = await stopRecorderToBlob(recorder)
  stopMeter(false)

  if (blob.size === 0) {
    throw new Error("Aucune donnée audio capturée. Réessaie l'enregistrement.")
  }

  trackCounter += 1
  const track: Track = {
    id: trackCounter,
    blob,
    url: URL.createObjectURL(blob),
    // Chronometer is the source of truth: browser metadata for webm is often wrong.
    durationMs,
  }
  tracks.push(track)
  enabledTrackIds.add(track.id)
  renderTracks()
  return track
}

async function startSession() {
  try {
    stopPlayback()
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
    await finalizeCurrentTake()

    // Polyphony: replay selected previous takes while the next take records.
    const monitor = selectedTracks()
    try {
      if (monitor.length > 0) {
        await playTracks(monitor, { awaitEnd: false })
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? `${error.message} Enregistrement lancé sans lecture.`
          : 'Lecture impossible. Enregistrement lancé sans lecture.',
      )
    }

    await beginRecording()
  } catch (error) {
    setError(
      error instanceof Error
        ? error.message
        : 'Impossible de passer à la piste suivante.',
    )
    stopMeter()
    stopTimer()
    state = 'idle'
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
        ? `${tracks.length} piste${tracks.length > 1 ? 's' : ''} capturée${tracks.length > 1 ? 's' : ''}. Sélectionne les voix, puis écoute la sélection.`
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

els.selectAll.addEventListener('click', () => {
  const allSelected =
    tracks.length > 0 && selectedTracks().length === tracks.length

  if (allSelected) {
    enabledTrackIds.clear()
  } else {
    for (const track of tracks) enabledTrackIds.add(track.id)
  }

  renderTracks()
})

els.listenSelected.addEventListener('click', () => {
  if (mixListenActive) {
    stopPlayback()
    return
  }

  const mix = selectedTracks()
  if (mix.length === 0) {
    setError('Sélectionne au moins une piste à écouter.')
    return
  }

  setError(null)
  void playTracks(mix, { awaitEnd: true, asMix: true }).catch((error) => {
    setError(error instanceof Error ? error.message : 'Lecture impossible.')
  })
})

els.tracks.addEventListener('change', (event) => {
  const target = event.target
  if (!(target instanceof HTMLInputElement) || !target.matches('[data-toggle-track]')) {
    return
  }

  const id = Number(target.dataset.toggleTrack)
  if (!Number.isFinite(id)) return

  if (target.checked) {
    enabledTrackIds.add(id)
  } else {
    enabledTrackIds.delete(id)
  }

  // If a muted track is currently playing in the mix, stop that voice only is complex;
  // refresh row styles and disable listen-all when nothing is selected.
  renderTracks()
})

els.tracks.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('[data-toggle-track], .track-arm')) return

  const button = target.closest<HTMLButtonElement>('[data-play-track]')
  if (!button) return

  const id = Number(button.dataset.playTrack)
  const track = tracks.find((item) => item.id === id)
  if (!track) return

  // Toggle: clicking the playing track stops it.
  if (playingTrackIds.has(track.id) && playingTrackIds.size === 1) {
    stopPlayback()
    return
  }

  mixListenActive = false
  void playTrack(track).catch((error) => {
    setError(error instanceof Error ? error.message : 'Lecture impossible.')
  })
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
