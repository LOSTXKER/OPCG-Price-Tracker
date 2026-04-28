-- Fold previously-manual SQL (`prisma/migrations/manual_listing_enhancements.sql`)
-- into the regular Prisma migration history so a fresh-clone deploy
-- creates these in the right order without operator intervention.
--
-- All statements are idempotent (`IF NOT EXISTS` / `IF NOT EXISTS`) so
-- existing databases that have already had the manual file applied
-- can run this migration as a no-op when reconciling history.

-- Add viewCount to Listing (the equivalent column on Card was created in the init migration).
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Create SavedListing table (favourites / save-for-later).
CREATE TABLE IF NOT EXISTS "SavedListing" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SavedListing_userId_idx" ON "SavedListing"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "SavedListing_userId_listingId_key" ON "SavedListing"("userId", "listingId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'SavedListing_userId_fkey'
    ) THEN
        ALTER TABLE "SavedListing"
            ADD CONSTRAINT "SavedListing_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'SavedListing_listingId_fkey'
    ) THEN
        ALTER TABLE "SavedListing"
            ADD CONSTRAINT "SavedListing_listingId_fkey"
            FOREIGN KEY ("listingId") REFERENCES "Listing"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
