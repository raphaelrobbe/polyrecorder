/**
 * Offline Opus → WebM encode (WASM), for merge takes.
 * Lazy-loaded only when Fusionner runs — not on first paint.
 */

import {
  Application,
  Signal,
  createEncoder,
  type SampleRate,
} from 'libopus-wasm'
import { ArrayBufferTarget, Muxer } from 'webm-muxer'

const OPUS_RATE = 48000 as const satisfies SampleRate
const TARGET_BITRATE = 128_000

function buildOpusHead(options: {
  channels: 1 | 2
  preSkip: number
  inputSampleRate: number
}): Uint8Array {
  const head = new Uint8Array(19)
  head.set([0x4f, 0x70, 0x75, 0x73, 0x48, 0x65, 0x61, 0x64], 0) // OpusHead
  head[8] = 1
  head[9] = options.channels
  const view = new DataView(head.buffer)
  view.setUint16(10, Math.max(0, Math.min(0xffff, options.preSkip)), true)
  view.setUint32(12, Math.max(0, options.inputSampleRate | 0), true)
  view.setInt16(16, 0, true) // output gain
  head[18] = 0 // mapping family 0 (mono/stereo)
  return head
}

async function resampleToOpusRate(buffer: AudioBuffer): Promise<AudioBuffer> {
  const channels = Math.min(2, Math.max(1, buffer.numberOfChannels)) as 1 | 2
  if (buffer.sampleRate === OPUS_RATE && buffer.numberOfChannels === channels) {
    return buffer
  }
  const length = Math.max(1, Math.ceil(buffer.duration * OPUS_RATE))
  const offline = new OfflineAudioContext(channels, length, OPUS_RATE)
  const source = offline.createBufferSource()
  source.buffer = buffer
  source.connect(offline.destination)
  source.start(0)
  return offline.startRendering()
}

function interleavedFloatFrame(
  left: Float32Array,
  right: Float32Array,
  start: number,
  frameSize: number,
  channels: 1 | 2,
): Float32Array {
  const out = new Float32Array(frameSize * channels)
  for (let i = 0; i < frameSize; i++) {
    const idx = start + i
    const l = idx < left.length ? (left[idx] ?? 0) : 0
    if (channels === 1) {
      out[i] = l
    } else {
      const r = idx < right.length ? (right[idx] ?? 0) : 0
      out[i * 2] = l
      out[i * 2 + 1] = r
    }
  }
  return out
}

/** Encode an AudioBuffer to audio/webm;codecs=opus offline (WASM). */
export async function encodeAudioBufferToWebmOpusOffline(
  source: AudioBuffer,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const inputSampleRate = source.sampleRate
  const buffer = await resampleToOpusRate(source)
  const channels = Math.min(2, Math.max(1, buffer.numberOfChannels)) as 1 | 2
  const left = buffer.getChannelData(0)
  const right =
    channels > 1 && buffer.numberOfChannels > 1
      ? buffer.getChannelData(1)
      : left

  const encoder = await createEncoder({
    sampleRate: OPUS_RATE,
    channels,
    application: Application.Audio,
    signal: Signal.Music,
    bitrate: TARGET_BITRATE,
    vbr: true,
    frameSize: 960, // 20 ms @ 48 kHz
  })

  try {
    const frameSize = encoder.frameSize
    const totalSamples = left.length
    const frameCount = Math.max(1, Math.ceil(totalSamples / frameSize))
    const frameDurationUs = Math.round((frameSize / OPUS_RATE) * 1_000_000)
    const opusHead = buildOpusHead({
      channels,
      preSkip: encoder.getLookahead(),
      inputSampleRate,
    })

    const target = new ArrayBufferTarget()
    const muxer = new Muxer({
      target,
      type: 'webm',
      audio: {
        codec: 'A_OPUS',
        numberOfChannels: channels,
        sampleRate: OPUS_RATE,
      },
    })

    let timestampUs = 0
    let lastYield = 0
    const yieldEvery = Math.max(40, Math.floor(frameCount / 20))
    for (let f = 0; f < frameCount; f++) {
      const start = f * frameSize
      const pcm = interleavedFloatFrame(
        left,
        right,
        start,
        frameSize,
        channels,
      )
      const packet = encoder.encodeFloat(pcm)
      const meta =
        f === 0
          ? {
              decoderConfig: {
                codec: 'opus',
                numberOfChannels: channels,
                sampleRate: OPUS_RATE,
                description: opusHead,
              },
            }
          : undefined
      muxer.addAudioChunkRaw(packet, 'key', timestampUs, meta)
      timestampUs += frameDurationUs

      if (onProgress && f - lastYield >= yieldEvery) {
        lastYield = f
        onProgress(Math.min(1, (f + 1) / frameCount))
        await new Promise<void>((resolve) => setTimeout(resolve, 0))
      }
    }

    muxer.finalize()
    onProgress?.(1)

    const bytes = target.buffer
    if (!bytes || bytes.byteLength === 0) {
      throw new Error('empty webm')
    }
    return new Blob([bytes], { type: 'audio/webm;codecs=opus' })
  } finally {
    encoder.free()
  }
}
