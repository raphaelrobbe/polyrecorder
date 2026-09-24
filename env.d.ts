/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

/** File System Access API (Chromium) — not fully in default TS DOM lib yet. */
type WellKnownDirectory =
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'music'
  | 'pictures'
  | 'videos'

interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string | string[]>
}

interface FilePickerOptions {
  types?: FilePickerAcceptType[]
  excludeAcceptAllOption?: boolean
  multiple?: boolean
  /** Chromium remembers last folder per origin + this id. */
  id?: string
  startIn?: FileSystemHandle | WellKnownDirectory
}

interface OpenFilePickerOptions extends FilePickerOptions {
  multiple?: boolean
}

interface SaveFilePickerOptions extends FilePickerOptions {
  suggestedName?: string
}

interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite'
}

interface FileSystemHandle {
  readonly kind: 'file' | 'directory'
  readonly name: string
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor,
  ): Promise<PermissionState>
}

interface FileSystemFileHandle {
  getParent(): Promise<FileSystemDirectoryHandle>
}

interface Window {
  showOpenFilePicker(
    options?: OpenFilePickerOptions,
  ): Promise<FileSystemFileHandle[]>
  showSaveFilePicker(
    options?: SaveFilePickerOptions,
  ): Promise<FileSystemFileHandle>
}
