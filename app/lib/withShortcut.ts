/** Append shortcut hint to a title when keyboard hints are enabled. */
export function withShortcut(
  label: string,
  shortcut: string,
  enabled: boolean,
): string {
  return enabled ? `${label} (${shortcut})` : label
}
