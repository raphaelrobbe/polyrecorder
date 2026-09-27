-- Introduce SongPart between Song and TrackAsset.
--
-- Same statements as prisma/migrations/20260927183000_song_parts/migration.sql,
-- kept here for a manual apply on a remote database:
--
--   bun run runSql scripts/migrate-song-parts.sql
--
-- The old `Song` row was really a recording session, so it becomes a `SongPart`
-- (ids are preserved to keep /song/:id share URLs working) and a brand new
-- `Song` (the musical work) is created above each part, 1:1.

-- 1. Old Song table becomes SongPart (same ids, same rows).
ALTER TABLE "Song" RENAME TO "SongPart";
ALTER TABLE "SongPart" RENAME CONSTRAINT "Song_pkey" TO "SongPart_pkey";
ALTER INDEX "Song_lastOpenedAt_idx" RENAME TO "SongPart_lastOpenedAt_idx";

-- 2. Tracks hang off the part now (the FK already follows the renamed table).
ALTER TABLE "TrackAsset" RENAME COLUMN "songId" TO "songPartId";
ALTER TABLE "TrackAsset" RENAME CONSTRAINT "TrackAsset_songId_fkey" TO "TrackAsset_songPartId_fkey";
ALTER INDEX "TrackAsset_songId_idx" RENAME TO "TrackAsset_songPartId_idx";

-- 3. New Song table (the œuvre): owns visibility and the repertoire link.
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastOpenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "repertoireId" TEXT NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- 4. One Song per existing part, carrying over name / visibility / timestamps.
ALTER TABLE "SongPart" ADD COLUMN "songId" TEXT;
UPDATE "SongPart" SET "songId" = gen_random_uuid()::text;

INSERT INTO "Song" (
    "id",
    "name",
    "createdAt",
    "updatedAt",
    "lastOpenedAt",
    "isPublic",
    "repertoireId"
)
SELECT
    "songId",
    "name",
    "createdAt",
    "updatedAt",
    "lastOpenedAt",
    "isPublic",
    "repertoireId"
FROM "SongPart";

-- 5. SongPart keeps masterVolume / lastOpenedAt, loses repertoireId / isPublic.
ALTER TABLE "SongPart" ALTER COLUMN "songId" SET NOT NULL;
DROP INDEX IF EXISTS "SongPart_isPublic_idx";
DROP INDEX IF EXISTS "Song_isPublic_idx";
DROP INDEX IF EXISTS "SongPart_repertoireId_idx";
DROP INDEX IF EXISTS "Song_repertoireId_idx";
ALTER TABLE "SongPart" DROP COLUMN "repertoireId";
ALTER TABLE "SongPart" DROP COLUMN "isPublic";

-- 6. Indexes + foreign keys for the new shape.
CREATE INDEX "Song_repertoireId_idx" ON "Song"("repertoireId");
CREATE INDEX "Song_lastOpenedAt_idx" ON "Song"("lastOpenedAt");
CREATE INDEX "Song_isPublic_idx" ON "Song"("isPublic");
CREATE INDEX "SongPart_songId_idx" ON "SongPart"("songId");

ALTER TABLE "Song" ADD CONSTRAINT "Song_repertoireId_fkey" FOREIGN KEY ("repertoireId") REFERENCES "Repertoire"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SongPart" ADD CONSTRAINT "SongPart_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
