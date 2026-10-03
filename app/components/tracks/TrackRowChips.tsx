import type { ReferenceBeatWarning } from '../../common/types'
import {
  setCalageMode,
  setMixMode,
  showNotice,
} from '../../lib/sessionActions.client'
import { t } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { Button } from '../Button'

type TrackRowChipsProps = {
  trackId: number
  trackName: string
  nameKey: string
  pickActive: boolean
  calageMode: boolean
  mixMode: boolean
  chipRail: boolean
  simpleDupChipColumn: boolean
  simpleMixChipColumn: boolean
  simpleCalageChipColumn: boolean
  mixChipColumn: boolean
  calageChipColumn: boolean
  showDuplicateNameChip: boolean
  showRecordClipChip: boolean
  showAttentionChip: boolean
  showBeatAttention: boolean
  attentionTitle: string
  attentionAria: string
  alignAttentionMessage: string | undefined
  referenceBeatWarning: ReferenceBeatWarning | null
}

const chipSlotClass =
  'grid h-[1.65rem] w-[1.65rem] shrink-0 place-items-center max-sm:h-[1.45rem] max-sm:w-[1.45rem]'
/** Match trash control size/radius; beat Button `trash` max-sm defaults. */
const chipBtnClass =
  'h-full w-full max-sm:!h-full max-sm:!w-full rounded-lg max-sm:rounded-lg p-0 text-[0.78rem] font-extrabold leading-none max-sm:text-[0.7rem]'

export function TrackRowChips({
  trackId,
  trackName,
  nameKey,
  pickActive,
  calageMode,
  mixMode,
  chipRail,
  simpleDupChipColumn,
  simpleMixChipColumn,
  simpleCalageChipColumn,
  mixChipColumn,
  calageChipColumn,
  showDuplicateNameChip,
  showRecordClipChip,
  showAttentionChip,
  showBeatAttention,
  attentionTitle,
  attentionAria,
  alignAttentionMessage,
  referenceBeatWarning,
}: TrackRowChipsProps) {
  if (!chipRail || pickActive) return null

  const dupChipButton = showDuplicateNameChip ? (
    <Button
      variant="trash"
      className={cn(
        chipBtnClass,
        'border-ink/28 bg-ink/8 text-ink',
        'hover:enabled:border-ink/35 hover:enabled:bg-ink/12 hover:enabled:text-ink',
      )}
      title={t('warn.duplicateName.hint')}
      aria-label={t('warn.duplicateName.aria', { name: trackName })}
      onClick={() => {
        showNotice({
          id: `dup:${nameKey}`,
          message: t('warn.duplicateName.hint'),
          tone: 'simple',
        })
        const input = document.querySelector<HTMLInputElement>(
          `input[data-rename-track="${trackId}"]`,
        )
        input?.focus()
        input?.select()
      }}
    >
      !
    </Button>
  ) : null
  const mixChipButton = showRecordClipChip ? (
    <Button
      variant="trash"
      className={cn(
        chipBtnClass,
        'border-mode-mix-border bg-mode-mix-bg text-mode-mix',
        'hover:enabled:border-mode-mix-border hover:enabled:bg-mode-mix-hover hover:enabled:text-mode-mix',
      )}
      title={t('mix.clip.record.hint')}
      aria-label={t('mix.clip.record.aria')}
      onClick={() => {
        if (!mixMode) setMixMode(true)
        showNotice({
          id: `mix-clip:${trackId}`,
          message: t('mix.clip.record.hint'),
          tone: 'mix',
        })
      }}
    >
      !
    </Button>
  ) : null
  const calageChipButton = showAttentionChip ? (
    <Button
      variant="trash"
      className={cn(
        chipBtnClass,
        'border-mode-align-border bg-mode-align-bg text-mode-align',
        'hover:enabled:border-mode-align-border hover:enabled:bg-mode-align-hover hover:enabled:text-mode-align',
      )}
      title={attentionTitle}
      aria-label={attentionAria}
      onClick={() => {
        if (showBeatAttention && referenceBeatWarning) {
          showNotice({
            id: referenceBeatWarning.key,
            message: referenceBeatWarning.message,
            tone: 'align',
            action: 'disableAutoAlign',
          })
        } else if (alignAttentionMessage) {
          showNotice({
            id: `align:${trackId}`,
            message: alignAttentionMessage,
            tone: 'align',
          })
        } else {
          showNotice({
            id: `skew:${trackId}`,
            message: t('warn.skew.long', { names: trackName }),
            tone: 'align',
          })
        }
        if (!calageMode) setCalageMode(true)
      }}
    >
      !
    </Button>
  ) : null

  return (
    <div className="ml-[0.12rem] flex shrink-0 items-center gap-[0.2rem] self-start max-sm:ml-[0.06rem]">
      {simpleDupChipColumn ? (
        <div className={chipSlotClass}>{dupChipButton}</div>
      ) : null}
      {simpleMixChipColumn || mixChipColumn ? (
        <div className={chipSlotClass}>{mixChipButton}</div>
      ) : null}
      {simpleCalageChipColumn || calageChipColumn ? (
        <div className={chipSlotClass}>{calageChipButton}</div>
      ) : null}
    </div>
  )
}
