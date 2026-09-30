import { Mp3Encoder } from '@breezystack/lamejs'

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const sample = Math.max(-1, Math.min(1, input[i] ?? 0))
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  return output
}

/** Encode a rendered AudioBuffer to an MP3 Blob. */
export async function encodeAudioBufferToMp3(
  buffer: AudioBuffer,
  kbps = 128,
  onProgress?: (ratio: number) => void,
): Promise<Blob> {
  const channels = Math.min(2, Math.max(1, buffer.numberOfChannels))
  const sampleRate = buffer.sampleRate
  const left = floatTo16BitPCM(buffer.getChannelData(0))
  const right =
    channels > 1 ? floatTo16BitPCM(buffer.getChannelData(1)) : left

  const encoder = new Mp3Encoder(channels, sampleRate, kbps)
  const blockSize = 1152
  const parts: ArrayBuffer[] = []

  const pushEncoded = (encoded: Uint8Array) => {
    if (encoded.length === 0) return
    const copy = new Uint8Array(encoded.length)
    copy.set(encoded)
    parts.push(copy.buffer)
  }

  const total = left.length
  let lastYield = 0
  for (let i = 0; i < total; i += blockSize) {
    const leftChunk = left.subarray(i, Math.min(i + blockSize, total))
    const rightChunk = right.subarray(i, Math.min(i + blockSize, total))
    const encoded =
      channels > 1
        ? encoder.encodeBuffer(leftChunk, rightChunk)
        : encoder.encodeBuffer(leftChunk)
    pushEncoded(encoded)
    if (onProgress && i - lastYield > sampleRate * 0.25) {
      lastYield = i
      onProgress(Math.min(1, i / total))
      // Keep the UI responsive on long encodes.
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }

  pushEncoded(encoder.flush())
  onProgress?.(1)

  return new Blob(parts, { type: 'audio/mpeg' })
}
