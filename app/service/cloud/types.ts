export type CloudFailureReason =
  | 'unauthorized'
  | 's3_not_configured'
  | 'too_large'
  | 'invalid'
  | 'not_found'
  | 'forbidden'
  | 'incomplete'
  | 'failed'

export type SongPartAlignPrefs = {
  autoAlignEnabled: boolean
  showCalageWarnings: boolean
  skipCountInPlayback: boolean
  skipCountInDownload: boolean
}

/** Where a new home-deck recording will land (most recent repertoire). */
export type DefaultUploadDestination = {
  ownerPseudo: string
  groupId: string
  groupName: string
  repertoireId: string
  repertoireName: string
}

/** Library breadcrumb fields for a song part (Personnel / Général / …). */
export type CloudLibraryPath = {
  ownerPseudo: string
  groupId: string
  groupName: string
  repertoireId: string
  repertoireName: string
  songId: string
  songName: string
}

export type PresignResult =
  | {
      ok: true
      uploadUrl: string
      trackAssetId: string
      objectKey: string
      songPartId: string
      songId: string
      libraryPath: CloudLibraryPath | null
    }
  | { ok: false; reason: CloudFailureReason }

export type CompleteUploadResult =
  | { ok: true; trackAssetId: string; songPartId: string; songId: string }
  | { ok: false; reason: CloudFailureReason }

export type LibraryTree = {
  groups: Array<{
    id: string
    name: string
    repertoires: Array<{
      id: string
      name: string
      songs: Array<{
        id: string
        name: string
        isPublic: boolean
        allowsCollaboration: boolean
        lastOpenedAt: string
        updatedAt: string
        parts: Array<{
          id: string
          name: string | null
          trackNames: string[]
          masterVolume: number
          lastOpenedAt: string
          updatedAt: string
        }>
      }>
    }>
  }>
}

export type AccountLibraryStats = {
  durationMs: number
  groupCount: number
  repertoireCount: number
  songCount: number
  songPartCount: number
}

export type LibraryGroupLevelItem = {
  id: string
  name: string
  songCount: number
}

export type LibraryRepertoireLevelItem = {
  id: string
  name: string
  isPublic: boolean
  allowsCollaboration: boolean
  partCount: number
}

export type LibrarySongLevelItem = {
  id: string
  name: string | null
  trackNames: string[]
  /** Mix timeline length (offsets + durations), milliseconds. */
  durationMs: number
}

export type OpenSongResult =
  | {
      ok: true
      isOwner: boolean
      /** Signed-in non-owner may upload new tracks on this public collaborative song. */
      canCollaborate: boolean
      song: {
        id: string
        name: string
        repertoireId: string
        isPublic: boolean
        allowsCollaboration: boolean
        groupId: string
        groupName: string
        repertoireName: string
        ownerPseudo: string | null
      }
      part: {
        id: string
        name: string | null
        masterVolume: number
        autoAlignEnabled: boolean
        showCalageWarnings: boolean
        skipCountInPlayback: boolean
        skipCountInDownload: boolean
        metronomeBpm: number | null
        metronomeVolume: number
      }
      /** Every session of the song, in library order (deck prev / next). */
      siblings: Array<{ id: string; name: string | null }>
      tracks: Array<{
        id: string
        name: string
        url: string
        durationMs: number
        offsetMs: number
        volume: number
        muted: boolean
        contentType: string
        uploadedByMe: boolean
        /** Uploader pseudo (no leading @), or null if unknown. */
        uploadedByPseudo: string | null
      }>
    }
  | { ok: false; reason: CloudFailureReason }
