import { useId } from 'react'
import { useNavigate } from '@remix-run/react'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { clearLocalDeckSession } from '../lib/sessionActions.client'
import { cn } from '../lib/utils'

/** CSS vars for “recorder” letters (poly stays --brand-poly). */
const RECORDER_LETTER_VARS = [
  'var(--brand-1)',
  'var(--brand-2)',
  'var(--brand-3)',
  'var(--brand-4)',
  'var(--brand-5)',
  'var(--brand-6)',
  'var(--brand-7)',
  'var(--brand-8)',
] as const

type BrandWordmarkProps = {
  className?: string
}

export function BrandWordmark({ className }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        'font-brand inline-block font-extrabold lowercase leading-[1.05] tracking-[-0.03em]',
        className,
      )}
      style={{ fontWeight: 800 }}
      aria-label="polyrecorder"
    >
      <span style={{ color: 'var(--brand-poly)' }}>poly</span>
      {'recorder'.split('').map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          style={{ color: RECORDER_LETTER_VARS[index] }}
        >
          {letter}
        </span>
      ))}
    </span>
  )
}

export type BrandVariant = 'default' | 'hero' | 'compact'

type BrandProps = {
  className?: string
  /**
   * default — centered wordmark (library / help chrome)
   * hero — empty recorder: large mic above title
   * compact — tracks present: mic beside small title, top-right of column
   */
  variant?: BrandVariant
}

type BrandMicMarkProps = {
  className?: string
}

/** Spectrum mic mark without the black tile (inline so masks always work). */
function BrandMicMark({ className }: BrandMicMarkProps) {
  const reactId = useId().replace(/:/g, '')
  const maskId = `brand-mic-mask-${reactId}`
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('block overflow-visible', className)}
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="32"
          height="32"
        >
          <rect width="32" height="32" fill="#000000" />
          <rect x="11" y="2.75" width="10" height="16" rx="5" fill="#ffffff" />
          <path
            d="M8.125 13.75 A7.875 7.875 0 0 0 23.875 13.75"
            stroke="#ffffff"
            strokeWidth="2.75"
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1="16"
            y1="21.625"
            x2="16"
            y2="27.125"
            stroke="#ffffff"
            strokeWidth="2.75"
            strokeLinecap="round"
          />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <rect x="0" y="2.75" width="32" height="3.5" fill="#FDAC35" />
        <rect x="0" y="6" width="32" height="3.5" fill="#FEA43B" />
        <rect x="0" y="9.25" width="32" height="3.5" fill="#FD656B" />
        <rect x="0" y="12.5" width="32" height="3.5" fill="#EB46B0" />
        <rect x="0" y="15.75" width="32" height="3.5" fill="#D849D9" />
        <rect x="0" y="19" width="32" height="3.5" fill="#A346F3" />
        <rect x="0" y="22.25" width="32" height="3.5" fill="#5265FC" />
        <rect x="0" y="25.5" width="32" height="3.5" fill="#3694FF" />
      </g>
    </svg>
  )
}

export function Brand({ className, variant = 'default' }: BrandProps) {
  useLocale()
  const navigate = useNavigate()
  const compact = variant === 'compact'
  const hero = variant === 'hero'
  const showLogo = hero || compact

  const goHome = () => {
    clearLocalDeckSession()
    // Client-side Remix navigation needs the network; offline, reload `/`
    // so the service worker can serve the cached shell.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      window.location.assign('/')
      return
    }
    navigate('/')
  }

  return (
    <header
      className={cn(
        'flex',
        'transition-[flex-direction,align-items,justify-content,gap,margin,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        compact
          ? 'w-full min-w-0 flex-row items-center justify-start gap-[0.35rem]'
          : 'w-full flex-col items-center justify-center gap-[0.85rem] text-center',
        hero && 'gap-0',
        className,
      )}
    >
      {compact ? (
        <button
          type="button"
          className={cn(
            'm-0 inline-flex min-w-0 w-full max-w-full appearance-none flex-col items-stretch gap-[0.12rem] border-0 bg-transparent p-0 text-inherit',
            'cursor-pointer rounded-lg',
            'transition-[opacity,transform] duration-160',
            'hover:opacity-85 active:scale-[0.99]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          )}
          aria-label={t('brand.homeAria')}
          title={t('brand.homeAria')}
          onClick={goHome}
        >
          <div className="flex min-w-0 items-end justify-start gap-[0.35rem]">
            <h1 className="m-0 min-w-0 truncate text-[1.25rem] leading-none max-sm:text-[1.1rem]">
              <BrandWordmark />
            </h1>
            <BrandMicMark className="h-[1.75rem] w-[1.75rem] shrink-0" />
          </div>
          <p className="m-0 w-full truncate text-left text-[0.5rem] leading-none text-ink-soft max-sm:text-[0.48rem]">
            {t('brand.tagline')}
          </p>
        </button>
      ) : (
        <>
          <div
            className={cn(
              'flex min-w-0 flex-col justify-center',
              'transition-[text-align] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
              'text-center',
            )}
          >
            <h1
              className={cn(
                'm-0 transition-[font-size,line-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'text-[clamp(2.4rem,8vw,3.2rem)] leading-[1.05]',
              )}
            >
              <BrandWordmark />
            </h1>
            <p
              className={cn(
                'mb-0 text-ink-soft transition-[font-size,margin,line-height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'mt-[0.25rem] text-base leading-[1.45]',
              )}
            >
              {t('brand.tagline')}
            </p>
          </div>
          {showLogo ? (
            <BrandMicMark
              className={cn(
                'shrink-0 order-first',
                'transition-[width,height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'h-[min(7.5rem,28vw)] w-[min(7.5rem,28vw)]',
              )}
            />
          ) : null}
        </>
      )}
    </header>
  )
}
