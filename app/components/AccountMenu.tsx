import { Form, useNavigate } from '@remix-run/react'
import { useEffect, useId, useRef, useState } from 'react'
import {
  userDisplayLabel,
  type User,
} from '../common/user'
import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { resetDeckOnSignOut } from '../lib/sessionActions.client'
import { cn } from '../lib/utils'

type AccountMenuProps = {
  user: User
  className?: string
}

/** Top account dropdown: label = @pseudo (fallback email); settings + sign out. */
export function AccountMenu({ user, className }: AccountMenuProps) {
  useLocale()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const label = userDisplayLabel(user)

  useEffect(() => {
    if (!open) return
    const onDocPointer = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDocPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'm-0 inline-flex items-center gap-[0.25rem] rounded-full border border-transparent bg-transparent px-[0.55rem] py-[0.4rem]',
          'text-[0.78rem] font-semibold leading-normal text-ink/55',
          'hover:border-ink/8 hover:bg-ink/6 hover:text-ink-soft',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink/35 focus-visible:outline-offset-2',
          open && 'border-ink/8 bg-ink/6 text-ink',
        )}
        aria-label={t('nav.accountMenu')}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{label}</span>
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 text-[0.55rem] leading-none text-ink-soft transition-transform duration-150',
            open && 'rotate-180',
          )}
        >
          ▾
        </span>
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t('nav.accountMenu')}
          className={cn(
            'absolute left-0 top-[calc(100%+0.3rem)] z-20 min-w-[11.5rem] overflow-hidden rounded-[12px] border border-line bg-surface p-[0.25rem]',
            'shadow-[0_10px_28px_var(--shadow)]',
          )}
        >
          <button
            type="button"
            role="menuitem"
            className={cn(
              'flex w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-[0.55rem] py-[0.45rem] text-left font-[inherit] text-[0.82rem] font-semibold leading-normal text-ink',
              'hover:bg-ink/6',
            )}
            onClick={() => {
              setOpen(false)
              navigate('/compte')
            }}
          >
            {t('nav.accountSettings')}
          </button>
          <Form
            method="post"
            action="/auth/deconnexion"
            role="none"
            onSubmit={() => {
              resetDeckOnSignOut()
            }}
          >
            <button
              type="submit"
              role="menuitem"
              className={cn(
                'flex w-full cursor-pointer items-center rounded-[8px] border-0 bg-transparent px-[0.55rem] py-[0.45rem] text-left font-[inherit] text-[0.82rem] font-semibold leading-normal text-ink',
                'hover:bg-ink/6',
              )}
            >
              {t('nav.signOut')}
            </button>
          </Form>
        </div>
      ) : null}
    </div>
  )
}
