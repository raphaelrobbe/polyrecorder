import { t, tp } from './i18n'

/** Meta line under a group button: N répertoires · M chansons. */
export function groupMetaLabel(
  repertoireCount: number,
  songCount: number,
): string {
  return t('library.group.meta', {
    repertoires: tp(
      'library.count.repertoire.one',
      'library.count.repertoire.other',
      repertoireCount,
    ),
    songs: tp(
      'library.count.song.one',
      'library.count.song.other',
      songCount,
    ),
  })
}

export function repertoireMetaLabel(songCount: number): string {
  return tp(
    'library.count.song.one',
    'library.count.song.other',
    songCount,
  )
}

export function songMetaLabel(partCount: number): string {
  return tp(
    'library.count.songPart.one',
    'library.count.songPart.other',
    partCount,
  )
}

export function songPartMetaLabel(trackCount: number): string {
  return tp(
    'library.count.track.one',
    'library.count.track.other',
    trackCount,
  )
}
