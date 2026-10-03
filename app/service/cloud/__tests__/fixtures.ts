import type { User as AppUser } from '~/common/user'
import { prisma } from '~/service/db.server'
import { mockGetUserFromRequest } from './setup'

export type AuthzFixture = {
  owner: AppUser
  stranger: AppUser
  collab: AppUser
  groupId: string
  repertoireId: string
  privateSongId: string
  privatePartId: string
  privateTrackId: string
  publicSongId: string
  publicPartId: string
  publicTrackId: string
  collabSongId: string
  collabPartId: string
  ownerTrackOnCollabId: string
  collabTrackId: string
  /** Stranger’s own group (ensures tree isolation). */
  strangerGroupId: string
}

function toAppUser(row: {
  id: string
  email: string
  pseudo: string
  pseudoCustomizedAt: Date | null
}): AppUser {
  return {
    id: row.id,
    email: row.email,
    pseudo: row.pseudo,
    pseudoCustomizedAt: row.pseudoCustomizedAt?.toISOString() ?? null,
  }
}

async function createUser(email: string, pseudo: string) {
  return prisma.user.create({
    data: { email, pseudo },
  })
}

async function createTrack(input: {
  songPartId: string
  name: string
  uploadedByUserId: string
  objectKey: string
}) {
  return prisma.trackAsset.create({
    data: {
      songPartId: input.songPartId,
      name: input.name,
      objectKey: input.objectKey,
      contentType: 'audio/webm',
      byteSize: 1024,
      durationMs: 5_000,
      offsetMs: 0,
      volume: 1,
      muted: false,
      muteRanges: [],
      sortOrder: 0,
      uploadedByUserId: input.uploadedByUserId,
      uploadedAt: new Date(),
    },
  })
}

/** Wipe authz tables between tests (shared test DB). */
export async function resetAuthzDb(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "TrackAsset",
      "SongPart",
      "Song",
      "Repertoire",
      "Group",
      "Session",
      "MagicLink",
      "User"
    RESTART IDENTITY CASCADE
  `)
}

/** Seed owner / stranger / collab + private / public / collab songs. */
export async function seedAuthzFixture(): Promise<AuthzFixture> {
  await resetAuthzDb()

  const ownerRow = await createUser('owner@test.local', 'owner_user')
  const strangerRow = await createUser('stranger@test.local', 'stranger_user')
  const collabRow = await createUser('collab@test.local', 'collab_user')

  const group = await prisma.group.create({
    data: { userId: ownerRow.id, name: 'Owner Group', sortOrder: 0 },
  })
  const repertoire = await prisma.repertoire.create({
    data: { groupId: group.id, name: 'Owner Rep', sortOrder: 0 },
  })

  const privateSong = await prisma.song.create({
    data: {
      repertoireId: repertoire.id,
      name: 'Private Song',
      isPublic: false,
      allowsCollaboration: false,
      sortOrder: 0,
    },
  })
  const privatePart = await prisma.songPart.create({
    data: { songId: privateSong.id, name: 'Private Session', sortOrder: 0 },
  })
  const privateTrack = await createTrack({
    songPartId: privatePart.id,
    name: 'Owner take',
    uploadedByUserId: ownerRow.id,
    objectKey: `test/${ownerRow.id}/private.webm`,
  })

  const publicSong = await prisma.song.create({
    data: {
      repertoireId: repertoire.id,
      name: 'Public Song',
      isPublic: true,
      allowsCollaboration: false,
      sortOrder: 1,
    },
  })
  const publicPart = await prisma.songPart.create({
    data: { songId: publicSong.id, name: 'Public Session', sortOrder: 0 },
  })
  const publicTrack = await createTrack({
    songPartId: publicPart.id,
    name: 'Public take',
    uploadedByUserId: ownerRow.id,
    objectKey: `test/${ownerRow.id}/public.webm`,
  })

  const collabSong = await prisma.song.create({
    data: {
      repertoireId: repertoire.id,
      name: 'Collab Song',
      isPublic: true,
      allowsCollaboration: true,
      sortOrder: 2,
    },
  })
  const collabPart = await prisma.songPart.create({
    data: { songId: collabSong.id, name: 'Collab Session', sortOrder: 0 },
  })
  const ownerTrackOnCollab = await createTrack({
    songPartId: collabPart.id,
    name: 'Owner on collab',
    uploadedByUserId: ownerRow.id,
    objectKey: `test/${ownerRow.id}/collab-owner.webm`,
  })
  const collabTrack = await createTrack({
    songPartId: collabPart.id,
    name: 'Collab take',
    uploadedByUserId: collabRow.id,
    objectKey: `test/${collabRow.id}/collab.webm`,
  })
  await prisma.trackAsset.update({
    where: { id: collabTrack.id },
    data: { sortOrder: 1 },
  })

  const strangerGroup = await prisma.group.create({
    data: { userId: strangerRow.id, name: 'Stranger Group', sortOrder: 0 },
  })

  return {
    owner: toAppUser(ownerRow),
    stranger: toAppUser(strangerRow),
    collab: toAppUser(collabRow),
    groupId: group.id,
    repertoireId: repertoire.id,
    privateSongId: privateSong.id,
    privatePartId: privatePart.id,
    privateTrackId: privateTrack.id,
    publicSongId: publicSong.id,
    publicPartId: publicPart.id,
    publicTrackId: publicTrack.id,
    collabSongId: collabSong.id,
    collabPartId: collabPart.id,
    ownerTrackOnCollabId: ownerTrackOnCollab.id,
    collabTrackId: collabTrack.id,
    strangerGroupId: strangerGroup.id,
  }
}

export function asUser(user: AppUser | null): void {
  mockGetUserFromRequest.mockImplementation(async () => user)
}

export function asAnon(): void {
  asUser(null)
}

export function dummyRequest(): Request {
  return new Request('http://polyrecorder.test/api/cloud/library', {
    method: 'POST',
  })
}
