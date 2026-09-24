/**
 * Audio open/save pickers with Chromium folder memory.
 *
 * Chromium remembers the last directory per origin + picker `id`. Passing a
 * broken `startIn` handle overrides that memory — and retrying the picker
 * after a failed `startIn` loses the user gesture, which made us fall back to
 * `<input type="file">` (always Documents). So: shared `id`, no `startIn`.
 */

/** Shared so import and MP3 export reopen the same last folder. */
const PICKER_ID = 'polyrecorder-audio'

export function canUseOpenFilePicker(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

export function canUseSaveFilePicker(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

/** No-op kept for RecorderApp boot (API memory is browser-side via `id`). */
export function hydrateFileSystemMemory(): Promise<void> {
  return Promise.resolve()
}

const AUDIO_PICKER_TYPES: FilePickerAcceptType[] = [
  {
    description: 'Audio',
    accept: {
      'audio/*': [
        '.mp3',
        '.wav',
        '.ogg',
        '.m4a',
        '.aac',
        '.flac',
        '.webm',
        '.aiff',
        '.aif',
      ],
    },
  },
]

/**
 * Open-file picker; Chromium restores the last folder for `PICKER_ID`.
 * Returns `null` if unsupported, `[]` if cancelled.
 */
export async function pickAudioFilesWithMemory(): Promise<File[] | null> {
  if (!canUseOpenFilePicker()) return null

  try {
    const handles = await window.showOpenFilePicker({
      id: PICKER_ID,
      multiple: true,
      types: AUDIO_PICKER_TYPES,
      excludeAcceptAllOption: false,
    })
    const files: File[] = []
    for (const handle of handles) {
      files.push(await handle.getFile())
    }
    return files
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return []
    }
    console.error('[fs] showOpenFilePicker failed', error)
    return null
  }
}

export type SaveTarget =
  | { kind: 'handle'; handle: FileSystemFileHandle }
  | { kind: 'legacy' }
  | { kind: 'cancelled' }

/**
 * Open the save picker immediately (must run in a user gesture), before any
 * heavy work like MP3 encoding.
 */
export async function beginSaveWithMemory(
  filename: string,
): Promise<SaveTarget> {
  if (!canUseSaveFilePicker()) return { kind: 'legacy' }

  try {
    const handle = await window.showSaveFilePicker({
      id: PICKER_ID,
      suggestedName: filename,
      types: [
        {
          description: 'MP3',
          accept: { 'audio/mpeg': ['.mp3'] },
        },
      ],
    })
    return { kind: 'handle', handle }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { kind: 'cancelled' }
    }
    console.error('[fs] showSaveFilePicker failed', error)
    return { kind: 'legacy' }
  }
}

export async function writeSaveTarget(
  target: Extract<SaveTarget, { kind: 'handle' }>,
  blob: Blob,
): Promise<void> {
  const writable = await target.handle.createWritable()
  await writable.write(blob)
  await writable.close()
}

/** Legacy `<a download>` fallback (browser Downloads folder). */
export function downloadBlobLegacy(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}
