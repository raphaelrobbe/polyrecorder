/**
 * Smoke: encode 1s stereo silence → WebM/Opus offline (no Web Audio).
 * Run: bun ./scripts/smoke-opus-webm.ts
 */
import {
  Application,
  Signal,
  createEncoder,
} from 'libopus-wasm'
import { ArrayBufferTarget, Muxer } from 'webm-muxer'

const RATE = 48000
const CHANNELS = 2 as const
const FRAME = 960
const FRAMES = 50 // 1 second

function opusHead(preSkip: number): Uint8Array {
  const head = new Uint8Array(19)
  head.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], 0)
  head[8] = 1
  head[9] = CHANNELS
  const view = new DataView(head.buffer)
  view.setUint16(10, preSkip, true)
  view.setUint32(12, RATE, true)
  view.setInt16(16, 0, true)
  head[18] = 0
  return head
}

const t0 = performance.now()
const encoder = await createEncoder({
  sampleRate: RATE,
  channels: CHANNELS,
  application: Application.Audio,
  signal: Signal.Music,
  bitrate: 128_000,
  vbr: true,
  frameSize: FRAME,
})

const target = new ArrayBufferTarget()
const muxer = new Muxer({
  target,
  type: 'webm',
  audio: {
    codec: 'A_OPUS',
    numberOfChannels: CHANNELS,
    sampleRate: RATE,
  },
})

const silence = new Float32Array(FRAME * CHANNELS)
let ts = 0
const durUs = Math.round((FRAME / RATE) * 1_000_000)
const head = opusHead(encoder.getLookahead())

for (let i = 0; i < FRAMES; i++) {
  const packet = encoder.encodeFloat(silence)
  muxer.addAudioChunkRaw(
    packet,
    'key',
    ts,
    i === 0
      ? {
          decoderConfig: {
            codec: 'opus',
            numberOfChannels: CHANNELS,
            sampleRate: RATE,
            description: head,
          },
        }
      : undefined,
  )
  ts += durUs
}

muxer.finalize()
encoder.free()

const ms = performance.now() - t0
const bytes = target.buffer?.byteLength ?? 0
console.log(
  JSON.stringify({
    ok: bytes > 0,
    bytes,
    encodeMs: Math.round(ms),
    realtimeFactor: Number((1000 / ms).toFixed(1)),
  }),
)
