import { SettingsPanel } from './SettingsPanel'
import { RecorderApp } from './RecorderApp'

/** Client-only settings deck. */
export default function RecorderSettings() {
  return (
    <RecorderApp>
      <SettingsPanel />
    </RecorderApp>
  )
}
