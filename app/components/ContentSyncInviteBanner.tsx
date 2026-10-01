import { useLocale } from '../hooks/useLocale'
import { t } from '../lib/i18n'
import { cn } from '../lib/utils'
import type { ContentSyncInvite } from '../store/sessionStore'
import { useSessionStore } from '../store/sessionStore'
import {
  contentSyncInviteAcceptMerge,
  contentSyncInviteGoCalage,
  contentSyncInviteGoCut,
  contentSyncInviteListenMerge,
  contentSyncInviteListenSync,
  contentSyncInviteMergeAsk,
  contentSyncInviteSatisfied,
  dismissContentSyncInvite,
} from '../lib/sessionActions.client'
import { IconClose } from './icons'
import { Button } from './Button'

type Action = {
  label: string
  onClick: () => void
}

function actionsForStep(invite: ContentSyncInvite): {
  message: string
  actions: Action[]
} {
  switch (invite.step) {
    case 'listenSync':
      return {
        message: t('tracks.contentSync.invite.listenSync'),
        actions: [
          {
            label: t('common.listen'),
            onClick: () => void contentSyncInviteListenSync(),
          },
        ],
      }
    case 'satisfied':
      return {
        message: t('tracks.contentSync.invite.satisfied'),
        actions: [
          {
            label: t('common.yes'),
            onClick: () => contentSyncInviteSatisfied(true),
          },
          {
            label: t('common.no'),
            onClick: () => contentSyncInviteSatisfied(false),
          },
        ],
      }
    case 'goCalage':
      return {
        message: t('tracks.contentSync.invite.goCalage'),
        actions: [
          {
            label: t('tracks.contentSync.invite.goCalage.action'),
            onClick: () => contentSyncInviteGoCalage(),
          },
        ],
      }
    case 'mergeAsk':
      return {
        message: t('tracks.contentSync.invite.mergeAsk'),
        actions: [
          {
            label: t('common.yes'),
            onClick: () => contentSyncInviteMergeAsk(true),
          },
          {
            label: t('common.no'),
            onClick: () => contentSyncInviteMergeAsk(false),
          },
        ],
      }
    case 'goCut':
      return {
        message: t('tracks.contentSync.invite.goCut'),
        actions: [
          {
            label: t('tracks.contentSync.invite.goCut.action'),
            onClick: () => contentSyncInviteGoCut(),
          },
        ],
      }
    case 'merging':
      return {
        message: t('tracks.contentSync.invite.merging'),
        actions: [],
      }
    case 'listenMerge':
      return {
        message: t('tracks.contentSync.invite.listenMerge'),
        actions: [
          {
            label: t('common.listen'),
            onClick: () => void contentSyncInviteListenMerge(),
          },
        ],
      }
    case 'acceptMerge':
      return {
        message: t('tracks.contentSync.invite.acceptMerge'),
        actions: [
          {
            label: t('common.yes'),
            onClick: () => contentSyncInviteAcceptMerge(true),
          },
          {
            label: t('common.no'),
            onClick: () => contentSyncInviteAcceptMerge(false),
          },
        ],
      }
  }
}

/** Guided invite after a successful content Sync. */
export function ContentSyncInviteBanner() {
  useLocale()
  const invite = useSessionStore((s) => s.contentSyncInvite)
  if (!invite) return null

  const { message, actions } = actionsForStep(invite)
  const dismissible = invite.step !== 'merging'

  return (
    <div
      className={cn(
        'relative mt-4 flex flex-wrap items-center gap-x-3 gap-y-[0.45rem] rounded-[14px] border-[1.5px]',
        'border-mode-align-border bg-mode-align-bg px-[0.95rem] py-[0.85rem] pr-[2.1rem]',
        'text-[0.88rem] font-semibold leading-[1.35] text-mode-align [&_strong]:font-extrabold',
      )}
      role="status"
      data-content-sync-invite={invite.step}
    >
      {dismissible ? (
        <button
          type="button"
          className="absolute top-[0.35rem] right-[0.4rem] m-0 inline-flex h-[1.6rem] w-[1.6rem] cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-[1.15rem] leading-none text-mode-align hover:bg-mode-align-hover"
          aria-label={t('common.close')}
          title={t('common.close')}
          onClick={() => dismissContentSyncInvite()}
        >
          <IconClose />
        </button>
      ) : null}
      <span className="min-w-0 flex-auto">{message}</span>
      {actions.length > 0 ? (
        <div className="ml-auto flex flex-wrap items-center gap-[0.4rem]">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant="trim"
              className="border-mode-align-border bg-transparent px-3 py-[0.4rem] text-[0.8rem] font-bold text-mode-align hover:enabled:bg-mode-align-hover"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
