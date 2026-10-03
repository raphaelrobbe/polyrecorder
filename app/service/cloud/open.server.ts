import { prisma } from '../db.server'
import {
  createPresignedGetUrl,
  deleteAllObjectsForUser,
  isS3Configured,
} from '../s3.server'
import { getUserFromRequest } from '../auth.server'
import type { CloudFailureReason, OpenSongResult } from './types'
import { normalizeMuteRanges, touchSongPart } from './helpers.server'

/** Open one recording session (part). `songPartId` is what /song/:id carries. */
export async function openSong(
  request: Request,
  songPartId: string,
): Promise<OpenSongResult> {
  try {
    if (!songPartId) return { ok: false, reason: 'invalid' }

    const user = await getUserFromRequest(request)
    const part = await prisma.songPart.findFirst({
      where: { id: songPartId },
      include: {
        song: {
          include: {
            repertoire: {
              include: {
                group: {
                  select: {
                    id: true,
                    userId: true,
                    name: true,
                    user: { select: { pseudo: true } },
                  },
                },
              },
            },
          },
        },
        tracks: {
          where: { uploadedAt: { not: null } },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    })
    if (!part) return { ok: false, reason: 'not_found' }

    const song = part.song
    const isOwner = Boolean(user && song.repertoire.group.userId === user.id)
    if (!isOwner && !song.isPublic) {
      return { ok: false, reason: 'not_found' }
    }
    const canCollaborate = Boolean(
      user &&
        !isOwner &&
        song.isPublic &&
        song.allowsCollaboration,
    )

    if (isOwner) {
      await touchSongPart(part)
    }

    // Empty parts are metadata-only — S3 is only required to fetch audio.
    if (part.tracks.length > 0 && !isS3Configured()) {
      return { ok: false, reason: 's3_not_configured' }
    }

    const siblings = await prisma.songPart.findMany({
      where: { songId: song.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true },
    })

    const ownerPseudo = song.repertoire.group.user.pseudo.trim() || null
    const uploaderIds = [
      ...new Set(
        part.tracks
          .map((track) => track.uploadedByUserId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]
    const uploaders =
      uploaderIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: uploaderIds } },
            select: { id: true, pseudo: true },
          })
        : []
    const pseudoByUserId = new Map(
      uploaders.map((u) => [u.id, u.pseudo.trim() || null] as const),
    )

    const tracks = await Promise.all(
      part.tracks.map(async (track) => ({
        id: track.id,
        name: track.name,
        url: await createPresignedGetUrl({ objectKey: track.objectKey }),
        durationMs: track.durationMs,
        offsetMs: track.offsetMs,
        volume: track.volume,
        muted: Boolean(track.muted),
        muteRanges: normalizeMuteRanges(track.muteRanges) ?? [],
        contentType: track.contentType,
        uploadedByMe: Boolean(
          user && track.uploadedByUserId === user.id,
        ),
        uploadedByPseudo: track.uploadedByUserId
          ? (pseudoByUserId.get(track.uploadedByUserId) ?? null)
          : ownerPseudo,
      })),
    )

    return {
      ok: true,
      isOwner,
      canCollaborate,
      song: {
        id: song.id,
        name: song.name,
        repertoireId: song.repertoireId,
        isPublic: song.isPublic,
        allowsCollaboration: song.allowsCollaboration,
        groupId: song.repertoire.group.id,
        groupName: song.repertoire.group.name,
        repertoireName: song.repertoire.name,
        ownerPseudo,
      },
      part: {
        id: part.id,
        name: part.name,
        masterVolume: part.masterVolume,
        autoAlignEnabled: part.autoAlignEnabled,
        showCalageWarnings: part.showCalageWarnings,
        skipCountInPlayback: part.skipCountInPlayback,
        skipCountInDownload: part.skipCountInDownload,
        metronomeBpm: part.metronomeBpm ?? null,
        metronomeVolume: part.metronomeVolume,
      },
      siblings,
      tracks,
    }
  } catch (error) {
    console.error('[cloud] openSong failed', error)
    return { ok: false, reason: 'failed' }
  }
}

/** Public part metadata for OG / route loaders (no audio URLs). */
export async function getSongShareMeta(
  request: Request,
  songPartId: string,
): Promise<
  | {
      ok: true
      isOwner: boolean
      song: {
        id: string
        songId: string
        name: string
        songName: string
        partName: string | null
        isPublic: boolean
        trackCount: number
        groupId: string
        groupName: string
        repertoireId: string
        repertoireName: string
        ownerPseudo: string
      }
    }
  | { ok: false; reason: CloudFailureReason }
> {
  if (!songPartId) return { ok: false, reason: 'invalid' }

  const user = await getUserFromRequest(request)
  const part = await prisma.songPart.findFirst({
    where: { id: songPartId },
    include: {
      song: {
        include: {
          repertoire: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                  userId: true,
                  user: { select: { pseudo: true } },
                },
              },
            },
          },
        },
      },
      tracks: {
        where: { uploadedAt: { not: null } },
        select: { id: true },
      },
    },
  })
  if (!part) return { ok: false, reason: 'not_found' }

  const song = part.song
  const isOwner = Boolean(user && song.repertoire.group.userId === user.id)
  if (!isOwner && !song.isPublic) {
    return { ok: false, reason: 'not_found' }
  }

  return {
    ok: true,
    isOwner,
    song: {
      id: part.id,
      songId: song.id,
      name: songPartDisplayName(song.name, part.name),
      songName: song.name,
      partName: part.name,
      isPublic: song.isPublic,
      trackCount: part.tracks.length,
      groupId: song.repertoire.group.id,
      groupName: song.repertoire.group.name,
      repertoireId: song.repertoire.id,
      repertoireName: song.repertoire.name,
      ownerPseudo: song.repertoire.group.user.pseudo,
    },
  }
}

/** `Song — Part`, or just the song when unnamed / the part repeats the song. */
export function songPartDisplayName(
  songName: string,
  partName: string | null | undefined,
): string {
  const song = songName.trim()
  const part = partName?.trim() ?? ''
  if (!part || part === song) return song
  return `${song} — ${part}`
}

export async function purgeUserCloudStorage(userId: string): Promise<void> {
  await deleteAllObjectsForUser(userId)
}
