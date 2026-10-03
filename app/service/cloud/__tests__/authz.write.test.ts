import { beforeEach, describe, expect, it } from 'vitest'
import {
  createSong,
  deleteLibraryNode,
  duplicateSongPart,
  moveSongPart,
  renameLibraryNode,
} from '../libraryWrite.server'
import {
  setSongCollaboration,
  setSongPublic,
  updateSongPartAlignPrefs,
  updateSongPartMasterVolume,
  updateSongPartMetronomeBpm,
  updateSongPartMetronomeVolume,
} from '../songPrefs.server'
import { presignTrackUpload } from '../upload.server'
import {
  asAnon,
  asUser,
  dummyRequest,
  seedAuthzFixture,
  type AuthzFixture,
} from './fixtures'

describe('cloud authz — write / IDOR', () => {
  let fx: AuthzFixture
  const req = () => dummyRequest()

  beforeEach(async () => {
    fx = await seedAuthzFixture()
  })

  describe('owner-only mutations', () => {
    const deniedActors = [
      ['anon', () => asAnon()],
      ['stranger', () => asUser(fx.stranger)],
      ['collab', () => asUser(fx.collab)],
    ] as const

    for (const [label, setActor] of deniedActors) {
      it(`${label} cannot rename owner song`, async () => {
        setActor()
        const result = await renameLibraryNode(
          req(),
          'song',
          fx.privateSongId,
          'Hacked',
        )
        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(['not_found', 'unauthorized']).toContain(result.reason)
      })

      it(`${label} cannot delete owner song part`, async () => {
        setActor()
        const result = await deleteLibraryNode(
          req(),
          'songPart',
          fx.privatePartId,
        )
        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(['not_found', 'unauthorized']).toContain(result.reason)
      })

      it(`${label} cannot move owner session`, async () => {
        setActor()
        const result = await moveSongPart(
          req(),
          fx.privatePartId,
          fx.publicSongId,
        )
        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(['not_found', 'unauthorized']).toContain(result.reason)
      })

      it(`${label} cannot duplicate owner session`, async () => {
        setActor()
        const result = await duplicateSongPart(
          req(),
          fx.privatePartId,
          'Copy',
        )
        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(['not_found', 'unauthorized']).toContain(result.reason)
      })

      it(`${label} cannot change master / metro / align prefs`, async () => {
        setActor()
        const master = await updateSongPartMasterVolume(
          req(),
          fx.collabPartId,
          0.5,
        )
        const bpm = await updateSongPartMetronomeBpm(
          req(),
          fx.collabPartId,
          120,
        )
        const vol = await updateSongPartMetronomeVolume(
          req(),
          fx.collabPartId,
          0.4,
        )
        const align = await updateSongPartAlignPrefs(req(), fx.collabPartId, {
          autoAlignEnabled: false,
        })
        for (const result of [master, bpm, vol, align]) {
          expect(result.ok).toBe(false)
          if (result.ok) continue
          expect(['not_found', 'unauthorized']).toContain(result.reason)
        }
      })

      it(`${label} cannot toggle public / collaboration`, async () => {
        setActor()
        const pub = await setSongPublic(req(), fx.privateSongId, true)
        const collab = await setSongCollaboration(
          req(),
          fx.publicSongId,
          true,
        )
        for (const result of [pub, collab]) {
          expect(result.ok).toBe(false)
          if (result.ok) continue
          expect(['not_found', 'unauthorized']).toContain(result.reason)
        }
      })

      it(`${label} cannot create a song under owner repertoire`, async () => {
        setActor()
        const result = await createSong(
          req(),
          fx.repertoireId,
          'Injected',
        )
        expect(result.ok).toBe(false)
        if (result.ok) return
        expect(['not_found', 'unauthorized']).toContain(result.reason)
      })
    }

    it('owner can update private session prefs', async () => {
      asUser(fx.owner)
      const master = await updateSongPartMasterVolume(
        req(),
        fx.privatePartId,
        1.2,
      )
      const bpm = await updateSongPartMetronomeBpm(
        req(),
        fx.privatePartId,
        100,
      )
      expect(master).toEqual({ ok: true })
      expect(bpm).toEqual({ ok: true })
    })

    it('owner can duplicate and move their session', async () => {
      asUser(fx.owner)
      const dup = await duplicateSongPart(req(), fx.privatePartId, 'Dup')
      expect(dup.ok).toBe(true)
      if (!dup.ok) return
      const moved = await moveSongPart(req(), dup.id, fx.publicSongId)
      expect(moved.ok).toBe(true)
      if (!moved.ok) return
      expect(moved.songId).toBe(fx.publicSongId)
    })
  })

  describe('upload targets', () => {
    const uploadInput = (songPartId: string) => ({
      songPartId,
      name: 'Take',
      contentType: 'audio/webm',
      byteSize: 2048,
      durationMs: 1000,
      offsetMs: 0,
    })

    it('stranger cannot presign into a private session', async () => {
      asUser(fx.stranger)
      const result = await presignTrackUpload(req(), uploadInput(fx.privatePartId))
      expect(result).toEqual({ ok: false, reason: 'not_found' })
    })

    it('anon cannot presign (unauthorized)', async () => {
      asAnon()
      const result = await presignTrackUpload(req(), uploadInput(fx.publicPartId))
      expect(result).toEqual({ ok: false, reason: 'unauthorized' })
    })

    it('stranger cannot presign into public-only session', async () => {
      asUser(fx.stranger)
      const result = await presignTrackUpload(req(), uploadInput(fx.publicPartId))
      expect(result).toEqual({ ok: false, reason: 'not_found' })
    })

    it('collab can presign into public+collab session', async () => {
      asUser(fx.collab)
      const result = await presignTrackUpload(req(), uploadInput(fx.collabPartId))
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.songPartId).toBe(fx.collabPartId)
    })

    it('owner can still presign into private session', async () => {
      asUser(fx.owner)
      const result = await presignTrackUpload(req(), uploadInput(fx.privatePartId))
      expect(result.ok).toBe(true)
    })
  })
})
