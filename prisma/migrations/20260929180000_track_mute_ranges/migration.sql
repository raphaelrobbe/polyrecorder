-- AlterTable
ALTER TABLE "TrackAsset" ADD COLUMN "muteRanges" JSONB NOT NULL DEFAULT '[]';
