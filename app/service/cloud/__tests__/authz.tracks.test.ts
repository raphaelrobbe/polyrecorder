import { beforeEach, describe, expect, it } from 'vitest'
import {
  assertCollaborativeSongPart,
  assertMutableTrackAsset,
  assertOwnedSongPart,
  assertOwnedTrackAsset,
} from '../helpers.server'
import {
  deleteTrackAsset,
  renameTrackAsset,
  updateTrackAssetOffset,
  updateTrackAssetVolume,
} from '../tracks.server'
import {
  asUser,
  dummyRequest,
  seedAuthzFixture,
  type AuthzFixture,
} from './fixtures'

describe('cloud authz — track mutability + helpers', () => {
  let fx: AuthzFixture
  const req = () => dummyRequest()

  beforeEach(async () => {
    fx = await seedAuthzFixture()
  })

  describe('assert helpers', () => {
    it('assertOwned* rejects foreign ids', async () => {
      expect(await assertOwnedSongPart(fx.stranger.id, fx.privatePartId)).toBeNull()
      expect(await assertOwnedTrackAsset(fx.stranger.id, fx.privateTrackId)).toBeNull()
      expect(await assertOwnedSongPart(fx.owner.id, fx.privatePartId)).not.toBeNull()
    })

    it('assertCollaborativeSongPart only for public+collab non-owner', async () => {
      expect(
        await assertCollaborativeSongPart(fx.collab.id, fx.collabPartId),
      ).not.toBeNull()
      expect(
        await assertCollaborativeSongPart(fx.owner.id, fx.collabPartId),
      ).toBeNull()
      expect(
        await assertCollaborativeSongPart(fx.collab.id, fx.publicPartId),
      ).toBeNull()
      expect(
        await assertCollaborativeSongPart(fx.collab.id, fx.privatePartId),
      ).toBeNull()
    })

    it('assertMutableTrackAsset allows owner or uploader', async () => {
      expect(
        await assertMutableTrackAsset(fx.owner.id, fx.collabTrackId),
      ).not.toBeNull()
      expect(
        await assertMutableTrackAsset(fx.collab.id, fx.collabTrackId),
      ).not.toBeNull()
      expect(
        await assertMutableTrackAsset(fx.collab.id, fx.ownerTrackOnCollabId),
      ).toBeNull()
      expect(
        await assertMutableTrackAsset(fx.stranger.id, fx.collabTrackId),
      ).toBeNull()
    })
  })

  describe('track mutations', () => {
    it('owner can edit any track on their song', async () => {
      asUser(fx.owner)
      expect(
        await updateTrackAssetVolume(req(), fx.collabTrackId, 0.5),
      ).toEqual({ ok: true })
      expect(
        await updateTrackAssetOffset(req(), fx.ownerTrackOnCollabId, 12),
      ).toEqual({ ok: true })
    })

    it('uploader collab can edit their own track only', async () => {
      asUser(fx.collab)
      expect(
        await renameTrackAsset(req(), fx.collabTrackId, 'Mine'),
      ).toEqual({ ok: true })
      expect(
        await updateTrackAssetVolume(req(), fx.ownerTrackOnCollabId, 0.2),
      ).toEqual({ ok: false, reason: 'not_found' })
      expect(
        await deleteTrackAsset(req(), fx.ownerTrackOnCollabId),
      ).toEqual({ ok: false, reason: 'not_found' })
    })

    it('stranger cannot edit tracks (IDOR)', async () => {
      asUser(fx.stranger)
      expect(
        await updateTrackAssetVolume(req(), fx.privateTrackId, 0.1),
      ).toEqual({ ok: false, reason: 'not_found' })
      expect(
        await updateTrackAssetOffset(req(), fx.publicTrackId, 99),
      ).toEqual({ ok: false, reason: 'not_found' })
      expect(
        await deleteTrackAsset(req(), fx.collabTrackId),
      ).toEqual({ ok: false, reason: 'not_found' })
    })

    it('collab can delete their own uploaded track', async () => {
      asUser(fx.collab)
      expect(await deleteTrackAsset(req(), fx.collabTrackId)).toEqual({
        ok: true,
      })
    })
  })
})
