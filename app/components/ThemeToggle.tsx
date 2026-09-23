import { useLocale } from '../hooks/useLocale'
import { useTheme } from '../hooks/useTheme'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { IconMoon, IconSun } from './icons'

type ThemeToggleProps = {
  className?: string
}

/** Manual light/dark switch (system preference is the default until toggled). */
export function ThemeToggle({ className }: ThemeToggleProps) {
  useLocale()
  const { resolved, preference, toggle, setPreference } = useTheme()
  const goingDark = resolved === 'light'

  return (
    <Button
      variant="utility"
      className={cn(className)}
      icon={goingDark ? <IconMoon /> : <IconSun />}
      aria-label={
        goingDark ? t('theme.switchToDark') : t('theme.switchToLight')
      }
      title={
        preference === 'system'
          ? goingDark
            ? t('theme.darkSystem')
            : t('theme.lightSystem')
          : goingDark
            ? t('theme.dark')
            : t('theme.light')
      }
      onClick={() => toggle()}
      onContextMenu={(event) => {
        event.preventDefault()
        setPreference('system')
      }}
    />
  )
}
