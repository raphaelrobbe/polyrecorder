-- Same statements as prisma/migrations/20260927210000_song_collaboration/migration.sql,
-- kept here for a manual apply on a remote database:
--
--   bun run runSql scripts/migrate-song-collaboration.sql

ALTER TABLE "Song" ADD COLUMN IF NOT EXISTS "allowsCollaboration" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "TrackAsset" ADD COLUMN IF NOT EXISTS "uploadedByUserId" TEXT;

CREATE INDEX IF NOT EXISTS "TrackAsset_uploadedByUserId_idx" ON "TrackAsset"("uploadedByUserId");
