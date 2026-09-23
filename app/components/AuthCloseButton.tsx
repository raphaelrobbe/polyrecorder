import { useNavigate } from '@remix-run/react'
import { useLocale } from '~/hooks/useLocale'
import { t } from '~/lib/i18n'

/** Top-right × — same affordance as Paramètres / Aide. */
export function AuthCloseButton() {
  useLocale()
  const navigate = useNavigate()
  const closeLabel = t('common.close')

  return (
    <button
      type="button"
      className="absolute top-[0.35rem] right-[0.35rem] z-[2] grid h-[2.9rem] w-[2.9rem] place-items-center rounded-[14px] border-0 bg-transparent p-0 text-[2.15rem] font-normal leading-none text-ink-soft cursor-pointer transition-[background,color] duration-[160ms] ease-in-out hover:bg-ink/8 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2"
      aria-label={closeLabel}
      title={closeLabel}
      onClick={() => navigate('/')}
    >
      ×
    </button>
  )
}
