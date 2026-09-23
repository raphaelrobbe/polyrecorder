-- AlterTable
ALTER TABLE "Song" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Song_isPublic_idx" ON "Song"("isPublic");
