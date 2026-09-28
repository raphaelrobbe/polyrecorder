import { useLocale } from '../hooks/useLocale'
import { usePwaInstall } from '../hooks/usePwaInstall.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { IconClose } from './icons'

type PwaInstallBannerProps = {
  className?: string
  /** Hide while recording so the invite never covers the capture UI. */
  hidden?: boolean
}

/**
 * Soft, occasional invite to install the PWA (Chromium prompt or iOS howto).
 */
export function PwaInstallBanner({ className, hidden }: PwaInstallBannerProps) {
  useLocale()
  const { visible, mode, iosHelpOpen, install, dismiss } = usePwaInstall()

  if (hidden || !visible || !mode) return null

  return (
    <div
      className={cn(
        'relative rounded-[14px] border border-ink/14 bg-ink/[0.04] px-[0.95rem] py-[0.85rem] text-center animate-rise',
        className,
      )}
      role="status"
    >
      <button
        type="button"
        className="absolute top-[0.35rem] right-[0.4rem] m-0 inline-flex h-[1.6rem] w-[1.6rem] cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-ink-soft hover:bg-ink/8 hover:text-ink"
        aria-label={t('pwa.install.dismiss')}
        title={t('pwa.install.dismiss')}
        onClick={dismiss}
      >
        <IconClose />
      </button>
      <p className="m-0 pr-[1.4rem] text-[0.9rem] font-medium leading-[1.4] text-ink">
        {t('pwa.install.body')}
      </p>
      {mode === 'ios' && iosHelpOpen ? (
        <p className="mt-[0.55rem] mb-0 pr-[1.4rem] text-[0.84rem] leading-[1.4] text-ink-soft">
          {t('pwa.install.ios.howto')}
        </p>
      ) : null}
      <div className="mt-[0.7rem] flex flex-wrap items-center justify-center gap-2">
        {mode === 'ios' && iosHelpOpen ? (
          <Button
            variant="default"
            className="bg-ink px-[1rem] py-[0.65rem] text-[0.86rem] text-on-ink"
            onClick={dismiss}
          >
            {t('pwa.install.ios.gotIt')}
          </Button>
        ) : (
          <Button
            variant="default"
            className="bg-ink px-[1rem] py-[0.65rem] text-[0.86rem] text-on-ink"
            onClick={() => void install()}
          >
            {t('pwa.install.cta')}
          </Button>
        )}
        <Button
          variant="trim"
          className="px-[0.85rem] py-[0.55rem] text-[0.86rem]"
          onClick={dismiss}
        >
          {t('pwa.install.later')}
        </Button>
      </div>
    </div>
  )
}
