import {
  createOrUpdateMetronome,
  setDeckMode,
  type DeckWorkMode,
} from '../lib/sessionActions.client'
import { DEFAULT_METRONOME_BPM } from '../lib/audio/metronome.client'
import { warmPianoSampleBank } from '../lib/audio/piano.client'
import { ensureAudioContext } from '../lib/audio/runtime.client'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import { useLocale } from '../hooks/useLocale'
import { useSessionStore } from '../store/sessionStore'
import { IconAutoAlign, IconFaders } from './icons'

type ModeToolsProps = {
  className?: string
  pianoOpen: boolean
  onPianoOpenChange: (open: boolean) => void
  /** Same visibility rules as the former metronome text link. */
  showMetronomeAdd?: boolean
}

type ModeOption = {
  id: DeckWorkMode
  labelKey: 'mode.simple' | 'mode.mix' | 'mode.align'
  hintKey: 'mode.simple.hint' | 'mode.mix.hint' | 'mode.align.hint'
  icon?: 'mix' | 'align'
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'simple',
    labelKey: 'mode.simple',
    hintKey: 'mode.simple.hint',
  },
  {
    id: 'mix',
    labelKey: 'mode.mix',
    hintKey: 'mode.mix.hint',
    icon: 'mix',
  },
  {
    id: 'align',
    labelKey: 'mode.align',
    hintKey: 'mode.align.hint',
    icon: 'align',
  },
]

const toolBtnClass = (active: boolean) =>
  cn(
    'inline-flex items-center justify-center rounded-full px-[0.78rem] py-[0.42rem]',
    'border-[1.5px] font-[inherit] text-[0.82rem] font-bold tracking-[0.01em]',
    'transition-[background,color,border-color,box-shadow,transform] duration-160',
    'cursor-pointer active:scale-[0.98]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
    active
      ? 'border-ink bg-ink text-on-ink shadow-[0_4px_12px_color-mix(in_srgb,var(--ink)_22%,transparent)]'
      : 'border-line bg-surface text-ink-soft hover:text-ink',
  )

type DeckModesProps = {
  className?: string
}

/** Simple / Mix / Align — above the deck card, right-aligned when tracks exist. */
export function DeckModes({ className }: DeckModesProps) {
  useLocale()
  const tracks = useSessionStore((s) => s.tracks)
  const calageMode = useSessionStore((s) => s.calageMode)
  const mixMode = useSessionStore((s) => s.mixMode)

  if (tracks.length === 0) return null

  const active: DeckWorkMode = calageMode
    ? 'align'
    : mixMode
      ? 'mix'
      : 'simple'

  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-center justify-end gap-x-[0.45rem] gap-y-[0.35rem]',
        className,
      )}
    >
      <span className="shrink-0 text-[0.82rem] font-semibold tracking-[0.02em] text-ink-soft">
        {t('mode.label')}
      </span>
      <div
        role="radiogroup"
        aria-label={t('mode.groupAria')}
        className={cn(
          'inline-flex items-stretch rounded-full border-[1.5px] border-line bg-surface p-[0.18rem]',
          'shadow-[inset_0_1px_0_color-mix(in_srgb,var(--ink)_4%,transparent)]',
        )}
      >
        {MODE_OPTIONS.map((option) => {
          const selected = active === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={t(option.hintKey)}
              onClick={() => setDeckMode(option.id)}
              style={
                option.icon === 'mix'
                  ? {
                      ['--fader-knob-fill' as string]: selected
                        ? 'var(--on-ink)'
                        : 'var(--surface)',
                    }
                  : undefined
              }
              className={cn(
                'inline-flex items-center justify-center gap-[0.3rem] rounded-full px-[0.72rem] py-[0.42rem]',
                'font-[inherit] text-[0.82rem] font-bold tracking-[0.01em] transition-[background,color,box-shadow,transform] duration-160',
                'cursor-pointer active:scale-[0.98]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
                selected
                  ? 'bg-ink text-on-ink shadow-[0_4px_12px_color-mix(in_srgb,var(--ink)_22%,transparent)]'
                  : 'bg-transparent text-ink-soft hover:text-ink',
              )}
            >
              {option.icon === 'mix' ? (
                <IconFaders className="size-[0.95rem]" />
              ) : null}
              {option.icon === 'align' ? (
                <IconAutoAlign className="size-[0.95rem]" />
              ) : null}
              {t(option.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Below the deck: Piano (+ optional Metronome) tool pills.
 * The keyboard itself is rendered under the capture bar by DeckMain.
 */
export function ModeTools({
  className,
  pianoOpen,
  onPianoOpenChange,
  showMetronomeAdd = false,
}: ModeToolsProps) {
  useLocale()

  const togglePiano = () => {
    const next = !pianoOpen
    onPianoOpenChange(next)
    if (next) {
      void ensureAudioContext()
        .then(() => warmPianoSampleBank())
        .catch(() => {})
    }
  }

  const addMetronome = () => {
    void ensureAudioContext().catch(() => {})
    void createOrUpdateMetronome(DEFAULT_METRONOME_BPM)
  }

  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-center justify-start gap-x-[0.45rem] gap-y-[0.45rem]',
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={pianoOpen}
        title={pianoOpen ? t('piano.toggle.hide') : t('piano.toggle.show')}
        aria-label={
          pianoOpen ? t('piano.toggle.hide') : t('piano.toggle.show')
        }
        onClick={togglePiano}
        className={toolBtnClass(pianoOpen)}
      >
        {t('piano.toggle')}
      </button>

      {showMetronomeAdd ? (
        <button
          type="button"
          title={t('deck.metronome.add')}
          aria-label={t('deck.metronome.add')}
          onClick={addMetronome}
          className={toolBtnClass(false)}
        >
          {t('deck.metronome')}
        </button>
      ) : null}
    </div>
  )
}
