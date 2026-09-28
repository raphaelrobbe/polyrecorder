import { ensureAudioContext } from './runtime.client'
import { PIANO_MIDI_HIGH, PIANO_MIDI_LOW } from './piano'

/** In-memory sample bank (one AudioBuffer per MIDI note). */
const sampleBank = new Map<number, AudioBuffer>()

/** Soft piano / pad: warm low partials, gentle attack, short ring (~1 s). */
const PARTIALS = [1, 0.32, 0.12, 0.05, 0.02, 0.008] as const
const SAMPLE_DURATION_S = 1

/**
 * Soft piano-like strike: muted hammer, rounded tone, capped at ~1 s.
 */
function synthesizePianoSample(ctx: AudioContext, midi: number): AudioBuffer {
  const sr = ctx.sampleRate
  const length = Math.max(1, Math.floor(sr * SAMPLE_DURATION_S))
  const buffer = ctx.createBuffer(1, length, sr)
  const data = buffer.getChannelData(0)
  const f0 = 440 * 2 ** ((midi - 69) / 12)
  // Fast enough that the note is effectively gone by 1 s.
  const decay = 4.2 + (midi - PIANO_MIDI_LOW) * 0.05
  const brightness = Math.max(0.2, 0.55 - (midi - PIANO_MIDI_LOW) * 0.012)

  for (let i = 0; i < length; i++) {
    const t = i / sr
    // Very short clean attack (~4 ms), no noise hammer.
    const attack = Math.min(1, t / 0.004)
    const endFade = Math.max(0, 1 - t / SAMPLE_DURATION_S)
    const env = attack * Math.exp(-t * decay) * endFade * endFade
    let sample = 0
    for (let p = 0; p < PARTIALS.length; p++) {
      const amp = PARTIALS[p]! * (p === 0 ? 1 : brightness)
      // Very mild inharmonicity — keep it rounded, not clangy.
      const fn = f0 * (p + 1) * (1 + 0.00015 * p * p)
      sample += amp * Math.sin(2 * Math.PI * fn * t)
    }
    data[i] = sample * env * 0.5
  }

  return buffer
}

async function getSample(midi: number): Promise<AudioBuffer> {
  const cached = sampleBank.get(midi)
  if (cached) return cached
  const ctx = await ensureAudioContext()
  const buffer = synthesizePianoSample(ctx, midi)
  sampleBank.set(midi, buffer)
  return buffer
}

/** Warm the full 25-note bank (call when opening the keyboard). */
export async function warmPianoSampleBank(): Promise<void> {
  sampleBank.clear()
  const ctx = await ensureAudioContext()
  for (let midi = PIANO_MIDI_LOW; midi <= PIANO_MIDI_HIGH; midi++) {
    sampleBank.set(midi, synthesizePianoSample(ctx, midi))
  }
}

/**
 * Play one note from the in-memory bank.
 * @param volume 0…1 gain scale (typically master volume).
 */
export async function playPianoNote(
  midi: number,
  volume = 0.75,
): Promise<void> {
  if (midi < PIANO_MIDI_LOW || midi > PIANO_MIDI_HIGH) return
  const ctx = await ensureAudioContext()
  const buffer = await getSample(midi)
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()
  source.buffer = buffer
  const level = Math.max(0, Math.min(1, volume)) * 0.9
  gain.gain.setValueAtTime(level, ctx.currentTime)
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()
}
