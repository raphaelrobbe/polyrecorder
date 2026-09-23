-- Case-insensitive uniqueness for optional display names (multiple NULLs allowed).
CREATE UNIQUE INDEX "User_pseudo_lower_key" ON "User" (LOWER("pseudo")) WHERE "pseudo" IS NOT NULL;
