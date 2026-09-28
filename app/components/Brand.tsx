import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
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
      aria-label="PolyRecorder"
    >
      <span style={{ color: 'var(--brand-poly)' }}>poly</span>
      {'recorder'.split('').map((letter, index) => (
        <span key={`${letter}-${index}`} style={{ color: RECORDER_LETTER_VARS[index] }}>
          {letter}
        </span>
      ))}
    </span>
  )
}

type BrandProps = {
  className?: string
}

export function Brand({ className }: BrandProps) {
  useLocale()
  return (
    <header className={cn('text-center', className)}>
      <h1 className="m-0 text-[clamp(2.4rem,8vw,3.2rem)]">
        <BrandWordmark />
      </h1>
      <p className="mt-[0.65rem] mb-0 text-ink-soft text-base leading-[1.45]">
        {t('brand.tagline')}
      </p>
    </header>
  )
}
