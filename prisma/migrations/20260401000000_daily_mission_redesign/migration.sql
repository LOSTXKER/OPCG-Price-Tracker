-- Create DailyMission table if it doesn't exist (fresh databases)
CREATE TABLE IF NOT EXISTS "DailyMission" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "perfectDay" BOOLEAN NOT NULL DEFAULT false,
    "bonusClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailyMission_userId_date_key" ON "DailyMission"("userId", "date");
CREATE INDEX IF NOT EXISTS "DailyMission_userId_idx" ON "DailyMission"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DailyMission_userId_fkey'
  ) THEN
    ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add new columns to DailyMission for the redesigned mission system
ALTER TABLE "DailyMission" ADD COLUMN IF NOT EXISTS "tasks" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "DailyMission" ADD COLUMN IF NOT EXISTS "progress" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DailyMission" ADD COLUMN IF NOT EXISTS "perfectDay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "DailyMission" ADD COLUMN IF NOT EXISTS "bonusClaimed" BOOLEAN NOT NULL DEFAULT false;

-- Add referralCode to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

-- Add SHARE and AFFILIATE to HoneyActionType enum
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'SHARE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'AFFILIATE';

-- Create ReferralLink table
CREATE TABLE IF NOT EXISTS "ReferralLink" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReferralLink_code_key" ON "ReferralLink"("code");
CREATE INDEX IF NOT EXISTS "ReferralLink_userId_idx" ON "ReferralLink"("userId");
CREATE INDEX IF NOT EXISTS "ReferralLink_code_idx" ON "ReferralLink"("code");

-- Create ReferralClick table
CREATE TABLE IF NOT EXISTS "ReferralClick" (
    "id" SERIAL NOT NULL,
    "linkId" INTEGER NOT NULL,
    "visitorIp" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReferralClick_linkId_createdAt_idx" ON "ReferralClick"("linkId", "createdAt");

-- Add foreign keys
ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ReferralLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
