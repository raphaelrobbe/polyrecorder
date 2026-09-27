-- AlterTable
ALTER TABLE "TrackAsset" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill from creation order within each session.
WITH ordered AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (PARTITION BY "songPartId" ORDER BY "createdAt" ASC) - 1)::integer AS ord
  FROM "TrackAsset"
)
UPDATE "TrackAsset" AS t
SET "sortOrder" = ordered.ord
FROM ordered
WHERE t.id = ordered.id;

-- CreateIndex
CREATE INDEX "TrackAsset_songPartId_sortOrder_idx" ON "TrackAsset"("songPartId", "sortOrder");
