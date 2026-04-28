-- Re-add the public-profile cover image column. We keep the column nullable
-- so existing rows don't need a backfill — the public profile falls back to
-- the deterministic gradient when the URL is null.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coverImageUrl" TEXT;
