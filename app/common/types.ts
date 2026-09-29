export type AppState = 'idle' | 'recording' | 'playing'

export type TrackCloudStatus = 'local' | 'uploading' | 'synced' | 'error'

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
  /**
   * Non-destructive mute windows in buffer-local ms (survive offset re-align).
   * S3 blob unchanged; playback/export skip or zero these ranges.
   */
  muteRanges?: Array<{ startMs: number; endMs: number }>
  /** Cloud sync state for authenticated users. */
  cloudStatus?: TrackCloudStatus
  /** Server TrackAsset id once reserved / synced. */
  cloudTrackId?: string
  /** True when the current user uploaded this cloud take (owner or collaborator). */
  cloudOwnedByMe?: boolean
  /** Uploader display name (no @); set for shared / collaborative cloud takes. */
  uploadedByPseudo?: string | null
  /** Synthetic click track (not uploaded); session tempo is stored separately. */
  isMetronome?: boolean
  /** Created by découpage merge — keep a trash control even in cut mode. */
  fromCutMerge?: boolean
}

/** Work segment in cut mode (mix-timeline ms). */
export type CutWorkSegment = {
  id: string
  startMs: number
  endMs: number
  selected: boolean
}


export type AudioSinkMode = 'monitor' | 'playback'

export type AudioContextWithSink = AudioContext & {
  setSinkId: (sinkId: string) => Promise<void>
  readonly sinkId?: string
}

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

