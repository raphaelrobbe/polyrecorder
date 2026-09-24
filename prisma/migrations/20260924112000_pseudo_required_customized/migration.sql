-- Track whether the user has customized their auto-assigned pseudo.
ALTER TABLE "User" ADD COLUMN "pseudoCustomizedAt" TIMESTAMP(3);

-- Backfill missing pseudos with a unique placeholder derived from id.
UPDATE "User"
SET "pseudo" = 'u' || LEFT(REPLACE("id", '-', ''), 10)
WHERE "pseudo" IS NULL OR TRIM("pseudo") = '';

-- Strip accidental @ from stored pseudos (reserved character).
UPDATE "User"
SET "pseudo" = REPLACE("pseudo", '@', '')
WHERE "pseudo" LIKE '%@%';

-- Re-fix empties after @ strip (edge case).
UPDATE "User"
SET "pseudo" = 'u' || LEFT(REPLACE("id", '-', ''), 10)
WHERE TRIM("pseudo") = '';

ALTER TABLE "User" ALTER COLUMN "pseudo" SET NOT NULL;
