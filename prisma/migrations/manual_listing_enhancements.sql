-- Add viewCount to Listing
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- Create SavedListing table
CREATE TABLE IF NOT EXISTS "SavedListing" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedListing_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "SavedListing_userId_idx" ON "SavedListing"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "SavedListing_userId_listingId_key" ON "SavedListing"("userId", "listingId");

-- Add foreign keys
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedListing" ADD CONSTRAINT "SavedListing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
