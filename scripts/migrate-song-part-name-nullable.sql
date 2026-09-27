-- Allow SongPart.name to be NULL (unnamed sessions).
--
-- Same statement as prisma/migrations/20260927200000_song_part_name_nullable/migration.sql,
-- kept here for a manual apply on a remote database:
--
--   bun run runSql scripts/migrate-song-part-name-nullable.sql

ALTER TABLE "SongPart" ALTER COLUMN "name" DROP NOT NULL;
