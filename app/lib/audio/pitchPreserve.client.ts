/**
 * Pitch-preserving slowdown for découpage preview (YouTube-like).
 * Lazy-loads @soundtouchjs/audio-worklet only when rate !== 1.
 */

let registeredContext: BaseAudioContext | null = null
let activeNode: AudioNode | null = null

/** Disconnect any active SoundTouch bus node. */
export function disconnectPitchPreserveNode(): void {
  if (!activeNode) return
  try {
    activeNode.disconnect()
  } catch {
    // already disconnected
  }
  activeNode = null
}

/**
 * Connect `from` → destination, inserting SoundTouch when playbackRate !== 1
 * so tempo slows without dropping pitch. Falls back to a direct connect if
 * the worklet fails to load.
 */
export async function connectPlaybackBus(
  ctx: AudioContext,
  from: AudioNode,
  destination: AudioNode,
  playbackRate: number,
): Promise<void> {
  disconnectPitchPreserveNode()
  const rate = Math.max(0.05, playbackRate)
  if (rate === 1) {
    from.connect(destination)
    return
  }

  try {
    const [{ SoundTouchNode }, processorMod] = await Promise.all([
      import('@soundtouchjs/audio-worklet'),
      import('@soundtouchjs/audio-worklet/processor?url'),
    ])
    const processorUrl = String(
      (processorMod as { default: string }).default,
    )
    if (registeredContext !== ctx) {
      await SoundTouchNode.register(ctx, processorUrl)
      registeredContext = ctx
    }
    const node = new SoundTouchNode({ context: ctx })
    node.playbackRate.value = rate
    node.pitch.value = 1
    from.connect(node)
    node.connect(destination)
    activeNode = node
  } catch (error) {
    console.error('[pitchPreserve] SoundTouch unavailable, pitch will shift', error)
    from.connect(destination)
  }
}

/** Call when the AudioContext is closed so the next open re-registers. */
export function resetPitchPreserveRegistration(): void {
  disconnectPitchPreserveNode()
  registeredContext = null
}
