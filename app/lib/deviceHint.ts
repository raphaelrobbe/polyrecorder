/** Whether the UI should prefer the mobile headphones note over device pickers. */
export function prefersHeadphonesHint(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  )
}
