-- Session (SongPart) name is optional; null until the owner names it.
ALTER TABLE "SongPart" ALTER COLUMN "name" DROP NOT NULL;
