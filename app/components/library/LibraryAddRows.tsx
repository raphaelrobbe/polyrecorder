import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { LIBRARY_TITLE_MAX_LEN } from '../../lib/format'
import { cn } from '../../lib/utils'

export const accordionControlClass = cn(
  'm-0 grid h-[2.05rem] w-[2.05rem] shrink-0 place-items-center rounded-[10px] border border-ink/12 bg-transparent p-0',
  'text-ink/55 transition-[transform,background,color,border-color] duration-160',
  'cursor-pointer hover:border-ink/22 hover:bg-ink/6 hover:text-ink',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-40',
  '[&_svg]:size-[1.15rem]',
)

export function AddNodeRow({
  defaultLabel,
  levelLabel,
  levelLabelClassName,
  inputClassName,
  create,
  onCreated,
  onError,
  className,
  dragGutter = true,
}: {
  defaultLabel: string
  levelLabel: string
  levelLabelClassName?: string
  inputClassName?: string
  create: (
    name: string,
  ) => Promise<{ ok: boolean; reason?: string; id?: string }>
  onCreated: (id: string) => void
  onError: () => void
  className?: string
  dragGutter?: boolean
}) {
  useLocale()
  const [draft, setDraft] = useState(defaultLabel)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isDefault = draft.trim() === defaultLabel

  useEffect(() => {
    setDraft(defaultLabel)
  }, [defaultLabel])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  const focusAndSelect = () => {
    const el = inputRef.current
    if (!el || busy) return
    el.focus()
    el.select()
  }

  const commit = () => {
    const name = draft.trim()
    if (!name || name === defaultLabel || busy) {
      setDraft(defaultLabel)
      return
    }
    setBusy(true)
    void create(name)
      .then((r) => {
        if (!r.ok || !r.id) {
          onError()
          setDraft(defaultLabel)
          return
        }
        setDraft(defaultLabel)
        onCreated(r.id)
      })
      .finally(() => {
        setBusy(false)
      })
  }

  return (
    <li className={className}>
      <div className="flex items-start gap-1.5">
        {dragGutter ? (
          <span className="w-[1.1rem] shrink-0" aria-hidden="true" />
        ) : null}
        <button
          type="button"
          aria-label={defaultLabel}
          title={defaultLabel}
          disabled={busy}
          onClick={focusAndSelect}
          className={cn(
            accordionControlClass,
            'mt-[1.15rem] text-[1.25rem] font-medium leading-none',
          )}
        >
          <span aria-hidden="true">+</span>
        </button>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'm-0 text-[0.62rem] font-bold uppercase tracking-[0.07em] text-ink-soft',
              levelLabelClassName,
            )}
          >
            {levelLabel}
          </p>
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            disabled={busy}
            aria-label={defaultLabel}
            maxLength={LIBRARY_TITLE_MAX_LEN}
            spellCheck={false}
            className={cn(
              'm-0 mt-0.5 w-full max-w-full min-w-[5.5ch] resize-none overflow-hidden break-words rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-0 pr-9 font-[inherit] leading-[1.25] field-sizing-content',
              'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
              'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
              'disabled:opacity-55',
              isDefault
                ? 'italic font-medium text-ink/45 [font-synthesis:style]'
                : 'text-ink',
              inputClassName,
            )}
            onChange={(event) =>
              setDraft(event.target.value.replace(/\n/g, ' '))
            }
            onFocus={(event) => {
              if (event.currentTarget.value.trim() !== defaultLabel) return
              event.currentTarget.select()
              event.currentTarget.addEventListener(
                'mouseup',
                (mouseupEvent) => {
                  mouseupEvent.preventDefault()
                  event.currentTarget.select()
                },
                { once: true },
              )
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.currentTarget.blur()
              }
              if (event.key === 'Escape') {
                setDraft(defaultLabel)
                event.currentTarget.blur()
              }
            }}
            onBlur={commit}
          />
        </div>
      </div>
    </li>
  )
}

/** Leaf-level "+ name" row (songs and song parts). */
export function AddLeafRow({
  defaultLabel,
  create,
  onCreated,
  onError,
  allowEmptyDefault = false,
  alignWithRowFrame = false,
  dragGutter = true,
}: {
  defaultLabel: string
  create: (
    name: string,
  ) => Promise<{ ok: boolean; reason?: string; id?: string }>
  onCreated: (id: string) => void
  onError: () => void
  /** When true, confirming the default label creates an unnamed item. */
  allowEmptyDefault?: boolean
  /** Flush the + control with the left edge of sibling row frames. */
  alignWithRowFrame?: boolean
  /** Spacer matching sibling drag handles (off when those handles are hidden). */
  dragGutter?: boolean
}) {
  useLocale()
  const [draft, setDraft] = useState(defaultLabel)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isDefault = draft.trim() === defaultLabel

  useEffect(() => {
    setDraft(defaultLabel)
  }, [defaultLabel])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  const focusAndSelect = () => {
    const el = inputRef.current
    if (!el || busy) return
    el.focus()
    el.select()
  }

  const commit = () => {
    if (busy) return
    const name = draft.trim()
    const isEmptyOrDefault = !name || name === defaultLabel
    if (isEmptyOrDefault && !allowEmptyDefault) {
      setDraft(defaultLabel)
      return
    }
    const finalName = isEmptyOrDefault ? '' : name
    setBusy(true)
    void create(finalName)
      .then((r) => {
        if (!r.ok) {
          onError()
          setDraft(defaultLabel)
          return
        }
        setDraft(defaultLabel)
        onCreated(r.id ?? '')
      })
      .finally(() => {
        setBusy(false)
      })
  }

  const showDragGutter = dragGutter && !alignWithRowFrame

  return (
    <li
      className={cn(
        'rounded-[10px] py-1',
        alignWithRowFrame ? 'pr-1.5' : 'px-1.5',
      )}
    >
      <div className="flex min-w-0 items-start gap-1.5">
        {showDragGutter ? (
          <span className="w-[1.1rem] shrink-0" aria-hidden="true" />
        ) : null}
        <button
          type="button"
          aria-label={defaultLabel}
          title={defaultLabel}
          disabled={busy}
          onClick={focusAndSelect}
          className={cn(
            'm-0 grid h-[1.55rem] w-[1.55rem] shrink-0 place-items-center rounded-lg border border-ink/12 bg-transparent p-0',
            'text-[1.1rem] font-medium leading-none text-ink/45',
            'transition-[background,color,border-color] duration-150',
            'cursor-pointer hover:border-ink/22 hover:bg-ink/6 hover:text-ink',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <span aria-hidden="true">+</span>
        </button>
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          disabled={busy}
          aria-label={defaultLabel}
          maxLength={LIBRARY_TITLE_MAX_LEN}
          spellCheck={false}
          className={cn(
            'm-0 w-full max-w-full min-w-[5.5ch] resize-none overflow-hidden break-words rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-[0.15rem] pr-9 font-[inherit] leading-[1.25] field-sizing-content',
            'text-[0.9rem]',
            'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
            'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
            'disabled:opacity-55',
            isDefault
              ? 'italic font-medium text-ink/45 [font-synthesis:style]'
              : 'font-medium text-ink',
          )}
          onChange={(event) =>
            setDraft(event.target.value.replace(/\n/g, ' '))
          }
          onFocus={(event) => {
            if (event.currentTarget.value.trim() !== defaultLabel) return
            event.currentTarget.select()
            event.currentTarget.addEventListener(
              'mouseup',
              (mouseupEvent) => {
                mouseupEvent.preventDefault()
                event.currentTarget.select()
              },
              { once: true },
            )
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
            if (event.key === 'Escape') {
              setDraft(defaultLabel)
              event.currentTarget.blur()
            }
          }}
          onBlur={commit}
        />
      </div>
    </li>
  )
}
