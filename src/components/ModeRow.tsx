import { cn } from '../lib/utils'
import { useDeckStore } from '../store/deckStore'
import { Button } from './Button'
import { IconHelp, IconSettings } from './icons'
import { ThemeToggle } from './ThemeToggle'

type ModeRowProps = {
  className?: string
}

/** Footer utilities (theme, aide, paramètres). Mode toggles live in the deck. */
export function ModeRow({ className }: ModeRowProps) {
  const openDeckPanel = useDeckStore((s) => s.openDeckPanel)

  return (
    <div
      className={cn(
        'mt-[0.35rem] flex items-center justify-end gap-[0.35rem]',
        className,
      )}
    >
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
  )
}
