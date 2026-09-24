/** Best-effort audio title from file metadata, else filename without extension. */

const TRACK_NAME_MAX = 40

export function filenameWithoutExtension(filename: string): string {
  const base = filename.trim().split(/[/\\]/).pop() ?? filename.trim()
  const trimmed = base.replace(/\.[^.]+$/u, '').trim()
  return trimmed || base || 'audio'
}

function truncateTrackName(name: string): string {
  const cleaned = name.replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned.slice(0, TRACK_NAME_MAX)
}

function decodeId3Text(encoding: number, bytes: Uint8Array): string {
  if (bytes.length === 0) return ''
  try {
    if (encoding === 0) {
      return new TextDecoder('latin1').decode(bytes).replace(/\0/g, '').trim()
    }
    if (encoding === 3) {
      return new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim()
    }
    if (encoding === 1 || encoding === 2) {
      // UTF-16 with BOM (1) or UTF-16BE (2)
      const hasBom =
        bytes.length >= 2 &&
        ((bytes[0] === 0xff && bytes[1] === 0xfe) ||
          (bytes[0] === 0xfe && bytes[1] === 0xff))
      const order =
        encoding === 2
          ? 'utf-16be'
          : hasBom && bytes[0] === 0xff
            ? 'utf-16le'
            : 'utf-16be'
      const start = hasBom ? 2 : 0
      return new TextDecoder(order)
        .decode(bytes.subarray(start))
        .replace(/\0/g, '')
        .trim()
    }
  } catch {
    // Fall through.
  }
  return new TextDecoder('latin1').decode(bytes).replace(/\0/g, '').trim()
}

function readId3v2Title(bytes: Uint8Array): string | null {
  if (bytes.length < 10) return null
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null
  const major = bytes[3]
  const flags = bytes[5]
  // unsynchronisation / extended header — keep parser simple; skip if exotic.
  if (flags & 0b1000_0000) return null

  const size =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f)
  let offset = 10
  if (flags & 0b0100_0000) {
    // Extended header — skip its size (synchsafe in v2.4, plain in v2.3).
    if (bytes.length < offset + 4) return null
    const extSize =
      major >= 4
        ? ((bytes[offset] & 0x7f) << 21) |
          ((bytes[offset + 1] & 0x7f) << 14) |
          ((bytes[offset + 2] & 0x7f) << 7) |
          (bytes[offset + 3] & 0x7f)
        : (bytes[offset] << 24) |
          (bytes[offset + 1] << 16) |
          (bytes[offset + 2] << 8) |
          bytes[offset + 3]
    offset += 4 + extSize
  }

  const end = Math.min(bytes.length, 10 + size)
  while (offset + 10 <= end) {
    const id = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3],
    )
    if (id === '\0\0\0\0') break
    const frameSize =
      major >= 4
        ? ((bytes[offset + 4] & 0x7f) << 21) |
          ((bytes[offset + 5] & 0x7f) << 14) |
          ((bytes[offset + 6] & 0x7f) << 7) |
          (bytes[offset + 7] & 0x7f)
        : (bytes[offset + 4] << 24) |
          (bytes[offset + 5] << 16) |
          (bytes[offset + 6] << 8) |
          bytes[offset + 7]
    const frameStart = offset + 10
    const frameEnd = frameStart + frameSize
    if (frameSize <= 0 || frameEnd > end) break
    if ((id === 'TIT2' || id === 'TT2') && frameSize > 1) {
      const encoding = bytes[frameStart]
      const text = decodeId3Text(
        encoding,
        bytes.subarray(frameStart + 1, frameEnd),
      )
      if (text) return text
    }
    offset = frameEnd
  }
  return null
}

function readId3v1Title(bytes: Uint8Array): string | null {
  if (bytes.length < 128) return null
  const tag = bytes.subarray(bytes.length - 128)
  if (tag[0] !== 0x54 || tag[1] !== 0x41 || tag[2] !== 0x47) return null
  const title = new TextDecoder('latin1')
    .decode(tag.subarray(3, 33))
    .replace(/\0/g, '')
    .trim()
  return title || null
}

/** Quick scan for MP4/M4A `©nam` text atom (best-effort). */
function readMp4Title(bytes: Uint8Array): string | null {
  // Search for '©nam' (0xA9 n a m)
  for (let i = 0; i + 16 < bytes.length && i < 2_000_000; i += 1) {
    if (
      bytes[i] === 0xa9 &&
      bytes[i + 1] === 0x6e &&
      bytes[i + 2] === 0x61 &&
      bytes[i + 3] === 0x6d
    ) {
      // Atom layout: [size:4][©nam:4][data:4][type:4][locale:4][text…]
      const atomStart = i - 4
      if (atomStart < 0) continue
      const atomSize =
        (bytes[atomStart] << 24) |
        (bytes[atomStart + 1] << 16) |
        (bytes[atomStart + 2] << 8) |
        bytes[atomStart + 3]
      if (atomSize < 24 || atomStart + atomSize > bytes.length) continue
      const textStart = atomStart + 16
      const textEnd = atomStart + atomSize
      const text = new TextDecoder('utf-8')
        .decode(bytes.subarray(textStart, textEnd))
        .replace(/\0/g, '')
        .trim()
      if (text) return text
    }
  }
  return null
}

async function readEmbeddedTitle(file: Blob): Promise<string | null> {
  try {
    // Only need the header (and ID3v1 footer) — cap read size.
    const headSize = Math.min(file.size, 512 * 1024)
    const head = new Uint8Array(await file.slice(0, headSize).arrayBuffer())
    const id3v2 = readId3v2Title(head)
    if (id3v2) return id3v2

    const mp4 = readMp4Title(head)
    if (mp4) return mp4

    if (file.size >= 128) {
      const tail = new Uint8Array(
        await file.slice(file.size - 128).arrayBuffer(),
      )
      const id3v1 = readId3v1Title(tail)
      if (id3v1) return id3v1
    }
  } catch {
    // Ignore metadata failures.
  }
  return null
}

/** Display name for an imported audio file (metadata title ▸ basename). */
export async function resolveImportTrackName(file: File): Promise<string> {
  const fromMeta = truncateTrackName((await readEmbeddedTitle(file)) ?? '')
  if (fromMeta) return fromMeta
  const fromFile = truncateTrackName(filenameWithoutExtension(file.name))
  return fromFile || 'audio'
}
