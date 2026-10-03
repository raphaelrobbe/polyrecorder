import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { LIBRARY_TITLE_MAX_LEN } from '../../lib/format'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { Button } from '../Button'
import { IconDragDots, IconDuplicate, IconTrash } from '../icons'

export function DeleteIconButton({
  label,
  onClick,
  className,
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      variant="trash"
      className={cn(
        // Match library share / visibility action chips (songActionBtnClass).
        'relative z-[1] h-[1.65rem] w-[1.65rem] shrink-0 rounded-lg border-ink/18 p-0 text-ink/55',
        'max-sm:h-[1.65rem] max-sm:w-[1.65rem] max-sm:rounded-lg max-sm:text-[0.95rem]',
        '[&_svg]:size-[0.95rem]',
        className,
      )}
      icon={<IconTrash />}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    />
  )
}

export function DuplicateIconButton({
  label,
  onClick,
  className,
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <Button
      variant="trash"
      className={cn(
        'relative z-[1] h-[1.65rem] w-[1.65rem] shrink-0 rounded-lg border-ink/18 p-0 text-ink/55',
        'max-sm:h-[1.65rem] max-sm:w-[1.65rem] max-sm:rounded-lg max-sm:text-[0.95rem]',
        '[&_svg]:size-[0.95rem]',
        className,
      )}
      icon={<IconDuplicate />}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
    />
  )
}

/** Grab handle for library drag-reorder (mirrors the track handle). */
export function LibraryDragHandle({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  useLocale()
  const label = t('library.reorder', { name })
  return (
    <button
      type="button"
      draggable
      data-library-drag
      className={cn(
        'm-0 grid h-[1.75rem] w-[1.1rem] shrink-0 place-items-center rounded-md border-0 bg-transparent p-0',
        'cursor-grab text-ink-soft opacity-60 touch-none',
        'hover:bg-ink/6 hover:text-ink hover:opacity-100 active:cursor-grabbing',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
        className,
      )}
      aria-label={label}
      title={label}
      onClick={(event) => event.stopPropagation()}
    >
      <IconDragDots className="size-[1.2rem]" />
    </button>
  )
}

export function LibraryNameInput({
  value,
  ariaLabel,
  className,
  onCommit,
  placeholder,
  allowEmpty = false,
}: {
  value: string
  ariaLabel: string
  className?: string
  onCommit: (next: string) => void
  placeholder?: string
  allowEmpty?: boolean
}) {
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  const showPlaceholderStyle = allowEmpty && !draft.trim() && Boolean(placeholder)

  return (
    <textarea
      ref={ref}
      rows={1}
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      maxLength={LIBRARY_TITLE_MAX_LEN}
      spellCheck={false}
      className={cn(
        'relative z-[1] m-0 w-full max-w-full min-w-[5.5ch] resize-none overflow-hidden break-words rounded-[8px] border-0 bg-transparent py-[0.1rem] pl-[0.25rem] pr-9 font-[inherit] text-inherit leading-[1.25] field-sizing-content',
        'hover:bg-ink/6 focus:bg-ink/6 focus:outline-none',
        'focus:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--ink)_18%,transparent)]',
        className,
        showPlaceholderStyle &&
          'italic text-ink-soft [font-synthesis:style] placeholder:italic placeholder:text-ink-soft',
      )}
      onChange={(event) =>
        setDraft(event.target.value.replace(/\n/g, ' '))
      }
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          setDraft(value)
          event.currentTarget.blur()
        }
      }}
      onBlur={() => {
        const next = allowEmpty ? draft.trim() : draft.trim() || value
        setDraft(next)
        if (next !== value) onCommit(next)
      }}
    />
  )
}
