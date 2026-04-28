-- Drop the public-profile commerce fields added in 20260504000000_profile_cover_payment.
-- Payment is handled in-platform and the cover image was rolled back per product
-- decision, so the columns are no longer used.

ALTER TABLE "User" DROP COLUMN IF EXISTS "coverImageUrl";
ALTER TABLE "User" DROP COLUMN IF EXISTS "paymentMethods";
