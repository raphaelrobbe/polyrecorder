import { setCalageMode } from '../lib/sessionActions'
import { cn } from '../lib/utils'
import { useDeckStore } from '../store/deckStore'
import { useSessionStore } from '../store/sessionStore'
import { Button } from './Button'
import { CheckboxOption } from './CheckboxOption'
import { IconHelp, IconSettings } from './icons'
import { ThemeToggle } from './ThemeToggle'

type ModeRowProps = {
  className?: string
}

export function ModeRow({ className }: ModeRowProps) {
  const tracks = useSessionStore((s) => s.tracks)
  const calageMode = useSessionStore((s) => s.calageMode)
  const view = useDeckStore((s) => s.view)
  const openDeckPanel = useDeckStore((s) => s.openDeckPanel)
  const showCalage = view === 'main' && tracks.length > 0

  return (
    <div
      className={cn(
        'mt-[0.35rem] flex items-center justify-between gap-3',
        className,
      )}
    >
      <CheckboxOption
        className="text-[0.9rem]"
        align="center"
        hidden={!showCalage}
        checked={calageMode}
        onCheckedChange={(on) => {
          setCalageMode(on)
          if (!on) {
            useSessionStore.getState().patch({ calageTipOpen: false })
          }
        }}
      >
        Mode calage
      </CheckboxOption>
      <div className="ml-auto flex items-center justify-end gap-[0.35rem]">
        <ThemeToggle />
        <Button
          variant="utility"
          icon={<IconHelp />}
          aria-label="Aide"
          title="Aide"
          onClick={() => openDeckPanel('help')}
        >
          Aide
        </Button>
        <Button
          variant="utility"
          icon={<IconSettings />}
          aria-label="Paramètres"
          title="Paramètres"
          onClick={() => openDeckPanel('settings')}
        >
          Paramètres
        </Button>
      </div>
    </div>
  )
}
