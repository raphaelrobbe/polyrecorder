export type AppState = 'idle' | 'recording' | 'playing'

export type Track = {
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

export type AudioSinkMode = 'monitor' | 'playback'

export type AudioContextWithSink = AudioContext & {
  setSinkId: (sinkId: string) => Promise<void>
  readonly sinkId?: string
}

export type DeckView = 'main' | 'settings' | 'help'

export type DeckHistoryState = { polyrecorderDeck: DeckView }

export type BeatAssessment =
  | { ok: true; peaks: number[] }
  | { ok: false; reason: 'missing' | 'irregular'; peaks: number[] }

export type ActiveRecording = {
  recorder: MediaRecorder
  chunks: BlobPart[]
  onData: (event: BlobEvent) => void
}

export type TrackPlayhead = {
  when: number
  skipS: number
  lengthS: number
}

export type TrackAlignDetail = {
  delta3Ms: number
  delta4Ms: number
}

export type ReferenceBeatWarning = {
  key: string
  message: string
  reason: 'missing' | 'irregular' | 'error'
}

export type TouchReorderState = {
  pointerId: number
  trackId: number
  startY: number
  active: boolean
}

export function isDeckView(value: unknown): value is DeckView {
  return value === 'main' || value === 'settings' || value === 'help'
}
