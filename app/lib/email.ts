/** Practical email shape check (not full RFC). */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim()
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 254
  )
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
