import { DeckMain } from './DeckMain'
import { RecorderApp } from './RecorderApp'

/** Client-only home recorder (Web Audio safe). */
export default function RecorderMain() {
  return (
    <RecorderApp showMarkingHelp>
      <DeckMain />
    </RecorderApp>
  )
}
