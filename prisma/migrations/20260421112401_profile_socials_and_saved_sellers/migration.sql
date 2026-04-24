-- Add optional social/contact handles for the public profile
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialLine"     VARCHAR(60);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialIg"       VARCHAR(60);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialTwitter"  VARCHAR(60);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "socialFacebook" VARCHAR(120);

-- "Saved seller" — the buyer-side equivalent of following / favoriting a shop
CREATE TABLE IF NOT EXISTS "SavedSeller" (
    "id"        SERIAL       PRIMARY KEY,
    "userId"    TEXT         NOT NULL,
    "sellerId"  TEXT         NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedSeller_userId_fkey"
        FOREIGN KEY ("userId")   REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SavedSeller_sellerId_fkey"
        FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "SavedSeller_userId_sellerId_key"
    ON "SavedSeller"("userId", "sellerId");

CREATE INDEX IF NOT EXISTS "SavedSeller_userId_idx"   ON "SavedSeller"("userId");
CREATE INDEX IF NOT EXISTS "SavedSeller_sellerId_idx" ON "SavedSeller"("sellerId");
