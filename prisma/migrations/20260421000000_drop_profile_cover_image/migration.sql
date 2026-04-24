-- Drop the profile cover image column (feature removed)
ALTER TABLE "User" DROP COLUMN IF EXISTS "coverImageUrl";
