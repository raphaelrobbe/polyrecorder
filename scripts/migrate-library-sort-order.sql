-- Manual ordering (drag & drop) for the library tree.
--
-- Same statements as
-- prisma/migrations/20260927190000_library_sort_order/migration.sql,
-- kept here for a manual apply on a remote database:
--
--   bun run runSql scripts/migrate-library-sort-order.sql
--
-- Every level gets a `sortOrder` renumbered 0..n-1 among its siblings, seeded
-- from `createdAt` so the existing creation order is preserved.

-- 1. Columns.
ALTER TABLE "Group" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Repertoire" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Song" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SongPart" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- 2. Backfill: groups ordered by createdAt within their owner.
UPDATE "Group" AS g
SET "sortOrder" = ranked."position"
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" ASC, "id" ASC) - 1 AS "position"
    FROM "Group"
) AS ranked
WHERE g."id" = ranked."id";

-- 3. Backfill: repertoires ordered by createdAt within their group.
UPDATE "Repertoire" AS r
SET "sortOrder" = ranked."position"
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (PARTITION BY "groupId" ORDER BY "createdAt" ASC, "id" ASC) - 1 AS "position"
    FROM "Repertoire"
) AS ranked
WHERE r."id" = ranked."id";

-- 4. Backfill: songs ordered by createdAt within their repertoire.
--    (The library used to sort by lastOpenedAt — createdAt is stable instead.)
UPDATE "Song" AS s
SET "sortOrder" = ranked."position"
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (PARTITION BY "repertoireId" ORDER BY "createdAt" ASC, "id" ASC) - 1 AS "position"
    FROM "Song"
) AS ranked
WHERE s."id" = ranked."id";

-- 5. Backfill: parts ordered by createdAt within their song.
UPDATE "SongPart" AS p
SET "sortOrder" = ranked."position"
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (PARTITION BY "songId" ORDER BY "createdAt" ASC, "id" ASC) - 1 AS "position"
    FROM "SongPart"
) AS ranked
WHERE p."id" = ranked."id";

-- 6. Indexes for the sibling lookups.
CREATE INDEX "Group_userId_sortOrder_idx" ON "Group"("userId", "sortOrder");
CREATE INDEX "Repertoire_groupId_sortOrder_idx" ON "Repertoire"("groupId", "sortOrder");
CREATE INDEX "Song_repertoireId_sortOrder_idx" ON "Song"("repertoireId", "sortOrder");
CREATE INDEX "SongPart_songId_sortOrder_idx" ON "SongPart"("songId", "sortOrder");
