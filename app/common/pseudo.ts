/** Letters, digits, single underscores — not at ends, no `__`, no other chars. */
export function hasValidPseudoChars(pseudo: string): boolean {
  return (
    /^[a-zA-Z0-9]+(?:_[a-zA-Z0-9]+)*$/.test(pseudo) &&
    !pseudo.includes('__')
  )
}

export function hasDoubleUnderscore(pseudo: string): boolean {
  return pseudo.includes('__')
}

export function hasEdgeUnderscore(pseudo: string): boolean {
  return pseudo.startsWith('_') || pseudo.endsWith('_')
}
