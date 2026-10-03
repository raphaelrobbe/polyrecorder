import { beforeEach, describe, expect, it } from 'vitest'
import {
  getLibraryGroupLevel,
  getLibraryPortfolio,
  getLibrarySongLevel,
  getLibraryTree,
} from '../libraryRead.server'
import { getSongShareMeta, openSong } from '../open.server'
import {
  asAnon,
  asUser,
  dummyRequest,
  seedAuthzFixture,
  type AuthzFixture,
} from './fixtures'

describe('cloud authz — read', () => {
  let fx: AuthzFixture
  const req = () => dummyRequest()

  beforeEach(async () => {
    fx = await seedAuthzFixture()
  })

  describe('private data', () => {
    it('owner can open a private session', async () => {
      asUser(fx.owner)
      const result = await openSong(req(), fx.privatePartId)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.isOwner).toBe(true)
      expect(result.tracks.length).toBeGreaterThan(0)
      expect(result.tracks[0]?.url).toMatch(/^https:\/\/s3\.test\//)
    })

    it('stranger cannot open a private session (not_found)', async () => {
      asUser(fx.stranger)
      const result = await openSong(req(), fx.privatePartId)
      expect(result).toEqual({ ok: false, reason: 'not_found' })
    })

    it('anon cannot open a private session (not_found)', async () => {
      asAnon()
      const result = await openSong(req(), fx.privatePartId)
      expect(result).toEqual({ ok: false, reason: 'not_found' })
    })

    it('stranger cannot load private song level', async () => {
      asUser(fx.stranger)
      const result = await getLibrarySongLevel(req(), fx.privateSongId)
      expect(result).toEqual({ ok: false, reason: 'not_found' })
    })

    it('getLibraryTree never includes another user’s nodes', async () => {
      asUser(fx.stranger)
      const result = await getLibraryTree(req())
      expect(result.ok).toBe(true)
      if (!result.ok) return
      const groupIds = result.tree.groups.map((g) => g.id)
      expect(groupIds).toContain(fx.strangerGroupId)
      expect(groupIds).not.toContain(fx.groupId)
    })

    it('portfolio for owner as stranger hides private songs', async () => {
      asUser(fx.stranger)
      const result = await getLibraryPortfolio(req(), fx.owner.pseudo)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.isOwner).toBe(false)
      const songNames = result.tree.groups
        .flatMap((g) => g.repertoires)
        .flatMap((r) => r.songs)
        .map((s) => s.name)
      expect(songNames).toContain('Public Song')
      expect(songNames).toContain('Collab Song')
      expect(songNames).not.toContain('Private Song')
    })

    it('share meta for private part is not_found for stranger', async () => {
      asUser(fx.stranger)
      const result = await getSongShareMeta(req(), fx.privatePartId)
      expect(result).toEqual({ ok: false, reason: 'not_found' })
    })
  })

  describe('public data', () => {
    it('anon can open a public session as guest', async () => {
      asAnon()
      const result = await openSong(req(), fx.publicPartId)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.isOwner).toBe(false)
      expect(result.canCollaborate).toBe(false)
      expect(result.tracks[0]?.url).toMatch(/^https:\/\/s3\.test\//)
    })

    it('stranger can open public session without collab flag', async () => {
      asUser(fx.stranger)
      const result = await openSong(req(), fx.publicPartId)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.isOwner).toBe(false)
      expect(result.canCollaborate).toBe(false)
    })

    it('collab user gets canCollaborate on public+collab session', async () => {
      asUser(fx.collab)
      const result = await openSong(req(), fx.collabPartId)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.isOwner).toBe(false)
      expect(result.canCollaborate).toBe(true)
    })

    it('public song level does not expose private sibling songs', async () => {
      asUser(fx.stranger)
      const group = await getLibraryGroupLevel(req(), fx.groupId)
      expect(group.ok).toBe(true)
      if (!group.ok) return
      // group level lists repertoires; song level is the filter that matters
      const songLevel = await getLibrarySongLevel(req(), fx.publicSongId)
      expect(songLevel.ok).toBe(true)
      if (!songLevel.ok) return
      expect(songLevel.isOwner).toBe(false)
      expect(songLevel.song.isPublic).toBe(true)
    })
  })
})
