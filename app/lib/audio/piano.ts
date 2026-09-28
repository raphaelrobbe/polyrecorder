/** Two octaves inclusive: C3 … C5 (25 keys). */
export const PIANO_MIDI_LOW = 48
export const PIANO_MIDI_HIGH = 72

const NOTE_NAMES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B',
] as const

export type PianoKey = {
  midi: number
  name: string
  octave: number
  isBlack: boolean
}

/** Build the 25-key layout (white + black) from low to high. */
export function pianoKeys(): PianoKey[] {
  const keys: PianoKey[] = []
  for (let midi = PIANO_MIDI_LOW; midi <= PIANO_MIDI_HIGH; midi++) {
    const pc = midi % 12
    keys.push({
      midi,
      name: NOTE_NAMES[pc]!,
      octave: Math.floor(midi / 12) - 1,
      isBlack: [1, 3, 6, 8, 10].includes(pc),
    })
  }
  return keys
}

export function pianoKeyLabel(key: PianoKey): string {
  return `${key.name}${key.octave}`
}
