-- Public songs may opt in to collaboration (signed-in users can upload tracks).
ALTER TABLE "Song" ADD COLUMN "allowsCollaboration" BOOLEAN NOT NULL DEFAULT false;

-- Track who uploaded each take (owner or collaborator).
ALTER TABLE "TrackAsset" ADD COLUMN "uploadedByUserId" TEXT;

CREATE INDEX "TrackAsset_uploadedByUserId_idx" ON "TrackAsset"("uploadedByUserId");
