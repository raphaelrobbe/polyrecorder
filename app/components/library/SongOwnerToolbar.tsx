import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../../hooks/useLocale'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { IconCollaborate, IconGlobe, IconShare } from '../icons'
import { postLibrary } from '../../lib/libraryApi.client'

const songActionBtnClass = cn(
  'm-0 grid h-[1.65rem] w-[1.65rem] shrink-0 place-items-center rounded-lg border border-ink/18 bg-transparent p-0',
  'text-ink/55 transition-[background,color,border-color] duration-150',
  'cursor-pointer hover:border-ink/28 hover:bg-ink/6 hover:text-ink',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-ink/18 disabled:hover:bg-transparent disabled:hover:text-ink/55',
  '[&_svg]:size-[0.95rem]',
)

export function SongVisibilityButton({
  songId,
  isPublic,
  onChanged,
  onError,
}: {
  songId: string
  isPublic: boolean
  onChanged: () => void
  onError: () => void
}) {
  useLocale()
  const label = isPublic ? t('library.private') : t('library.public')
  return (
    <button
      type="button"
      className={cn(
        songActionBtnClass,
        isPublic &&
          'border-ink/40 bg-ink text-on-ink hover:border-ink hover:bg-ink hover:text-on-ink',
      )}
      aria-label={label}
      title={isPublic ? t('library.public.on') : t('library.public.off')}
      aria-pressed={isPublic}
      onClick={(event) => {
        event.stopPropagation()
        void postLibrary({
          intent: 'setSongPublic',
          songId,
          isPublic: !isPublic,
        }).then((r) => {
          if (!r.ok) onError()
          else onChanged()
        })
      }}
    >
      <IconGlobe />
    </button>
  )
}

export function SongCollaborationButton({
  songId,
  allowsCollaboration,
  onChanged,
  onError,
}: {
  songId: string
  allowsCollaboration: boolean
  onChanged: () => void
  onError: () => void
}) {
  useLocale()
  const label = allowsCollaboration
    ? t('library.collaborate.disable')
    : t('library.collaborate.enable')
  return (
    <button
      type="button"
      className={cn(
        songActionBtnClass,
        allowsCollaboration &&
          'border-ink/40 bg-ink text-on-ink hover:border-ink hover:bg-ink hover:text-on-ink',
      )}
      aria-label={label}
      title={
        allowsCollaboration
          ? t('library.collaborate.on')
          : t('library.collaborate.off')
      }
      aria-pressed={allowsCollaboration}
      onClick={(event) => {
        event.stopPropagation()
        void postLibrary({
          intent: 'setSongCollaboration',
          songId,
          allowsCollaboration: !allowsCollaboration,
        }).then((r) => {
          if (!r.ok) onError()
          else onChanged()
        })
      }}
    >
      <IconCollaborate />
    </button>
  )
}

export function SongShareButton({
  songPartId,
  songName,
  isPublic,
}: {
  songPartId: string | null
  songName: string
  isPublic: boolean
}) {
  useLocale()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/session/${songPartId}`
      : `/session/${songPartId}`
  const shareable = isPublic && Boolean(songPartId)

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={songActionBtnClass}
        aria-label={t('library.share')}
        title={shareable ? t('library.share') : t('library.share.disabled')}
        disabled={!shareable}
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation()
          if (!shareable) return
          setOpen(!open)
          setCopied(false)
        }}
      >
        <IconShare />
      </button>
      {open && shareable ? (
        <div
          className="absolute right-0 top-[calc(100%+0.35rem)] z-50 min-w-[11.5rem] rounded-[12px] border border-line bg-surface p-2 shadow-[0_12px_28px_var(--shadow)]"
          role="dialog"
          aria-label={t('library.share.title', { name: songName })}
        >
          <p className="m-0 mb-1.5 px-1 text-[0.72rem] font-semibold text-ink-soft">
            {t('library.share.title', { name: songName })}
          </p>
          <button
            type="button"
            className="m-0 flex w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left text-[0.82rem] font-semibold text-ink hover:bg-ink/6"
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl).then(() => {
                setCopied(true)
              })
            }}
          >
            {copied ? t('library.share.copied') : t('library.share.copy')}
          </button>
          <a
            className="m-0 flex w-full items-center rounded-[8px] px-2 py-1.5 text-left text-[0.82rem] font-semibold text-ink no-underline hover:bg-ink/6"
            href={`https://wa.me/?text=${encodeURIComponent(`${songName} — ${shareUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            {t('library.share.whatsapp')}
          </a>
          {typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function' ? (
            <button
              type="button"
              className="m-0 flex w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left text-[0.82rem] font-semibold text-ink hover:bg-ink/6"
              onClick={() => {
                void navigator
                  .share({
                    title: songName,
                    url: shareUrl,
                    text: songName,
                  })
                  .catch(() => {})
                setOpen(false)
              }}
            >
              {t('library.share.native')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/** Visibility + collab (+ optional share) for the sessions level header. */
export function SongOwnerToolbar({
  songId,
  songName,
  isPublic,
  allowsCollaboration,
  shareSongPartId,
  onChanged,
  onError,
}: {
  songId: string
  songName: string
  isPublic: boolean
  allowsCollaboration: boolean
  shareSongPartId: string | null
  onChanged: () => void
  onError: () => void
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <SongVisibilityButton
        songId={songId}
        isPublic={isPublic}
        onChanged={onChanged}
        onError={onError}
      />
      {isPublic ? (
        <SongCollaborationButton
          songId={songId}
          allowsCollaboration={allowsCollaboration}
          onChanged={onChanged}
          onError={onError}
        />
      ) : null}
      <SongShareButton
        songPartId={shareSongPartId}
        songName={songName}
        isPublic={isPublic}
      />
    </div>
  )
}
