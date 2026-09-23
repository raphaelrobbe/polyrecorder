import { parseOffsetMsInput } from '../lib/format'
import {
  NudgeValueEditor,
  type NudgeValueEditorProps,
} from './NudgeValueEditor'

export type MsOffsetEditorProps = Omit<
  NudgeValueEditorProps,
  'unit' | 'parseInput' | 'step'
> & {
  step?: number
}

/** Millisecond − / field / + editor (track calage, playback advance). */
export function MsOffsetEditor({
  step = 5,
  ...props
}: MsOffsetEditorProps) {
  return (
    <NudgeValueEditor
      {...props}
      step={step}
      unit="ms"
      parseInput={parseOffsetMsInput}
    />
  )
}
