import { useTheme } from '../hooks/useTheme'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { IconMoon, IconSun } from './icons'

type ThemeToggleProps = {
  className?: string
}

/** Manual light/dark switch (system preference is the default until toggled). */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolved, preference, toggle, setPreference } = useTheme()
  const goingDark = resolved === 'light'

  return (
    <Button
      variant="utility"
      className={cn(className)}
      icon={goingDark ? <IconMoon /> : <IconSun />}
      aria-label={
        goingDark ? 'Passer en thème sombre' : 'Passer en thème clair'
      }
      title={
        preference === 'system'
          ? goingDark
            ? 'Thème sombre (actuellement auto)'
            : 'Thème clair (actuellement auto)'
          : goingDark
            ? 'Thème sombre'
            : 'Thème clair'
      }
      onClick={() => toggle()}
      onContextMenu={(event) => {
        event.preventDefault()
        setPreference('system')
      }}
    />
  )
}
