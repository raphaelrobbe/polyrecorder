import { cn } from '../lib/utils'

type BrandProps = {
  className?: string
}

export function Brand({ className }: BrandProps) {
  return (
    <header className={cn('text-center', className)}>
      <h1 className="font-display m-0 font-bold text-[clamp(2.4rem,8vw,3.2rem)] tracking-[-0.03em] leading-[1.05]">
        PolyRecorder
      </h1>
      <p className="mt-[0.65rem] mb-0 text-ink-soft text-base leading-[1.45]">
        Enregistre, superpose, écoute, télécharge.
      </p>
    </header>
  )
}
