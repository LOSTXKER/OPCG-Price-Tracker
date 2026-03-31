-- Step 1: Create ShopItemType enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShopItemType') THEN
        CREATE TYPE "ShopItemType" AS ENUM ('TRIAL_PRO', 'TRIAL_PRO_PLUS', 'BADGE', 'CUSTOM', 'PROFILE_FRAME', 'PRICE_ALERT_SLOT', 'CSV_EXPORT_PASS');
    ELSE
        -- Add new values to existing enum
        BEGIN ALTER TYPE "ShopItemType" ADD VALUE IF NOT EXISTS 'PROFILE_FRAME'; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER TYPE "ShopItemType" ADD VALUE IF NOT EXISTS 'PRICE_ALERT_SLOT'; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER TYPE "ShopItemType" ADD VALUE IF NOT EXISTS 'CSV_EXPORT_PASS'; EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END
$$;

-- Step 2: Add new HoneyActionType enum values
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'DAILY_MISSION';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'PRICE_PREDICTION';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'DECK_SHARE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'COMMUNITY_PRICE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'FIRST_PURCHASE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'ONBOARDING';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'ACHIEVEMENT';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'GIFT_SEND';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'GIFT_RECEIVE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'LUCKY_DRAW';

-- Step 3: Add new User fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "honeyLifetimeEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileFrame" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstPurchaseRewarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "extraPriceAlertSlots" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "csvExportCredits" INTEGER NOT NULL DEFAULT 0;

-- Step 4: Ensure HoneyShopItem has type column with correct enum
-- (table may already exist from previous work)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'HoneyShopItem') THEN
        CREATE TABLE "HoneyShopItem" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL,
            "nameEn" TEXT,
            "nameTh" TEXT,
            "description" TEXT,
            "cost" INTEGER NOT NULL,
            "type" "ShopItemType" NOT NULL,
            "value" JSONB,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "stock" INTEGER,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX "HoneyShopItem_isActive_idx" ON "HoneyShopItem"("isActive");
    END IF;
END
$$;

-- Step 5: Create UserBadge table
CREATE TABLE IF NOT EXISTS "UserBadge" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameTh" TEXT,
    "imageUrl" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge"("userId");

-- Step 6: Create DailyMission table
CREATE TABLE IF NOT EXISTS "DailyMission" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "checkedPrice" BOOLEAN NOT NULL DEFAULT false,
    "addedCard" BOOLEAN NOT NULL DEFAULT false,
    "viewedSet" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DailyMission_userId_date_key" ON "DailyMission"("userId", "date");
CREATE INDEX IF NOT EXISTS "DailyMission_userId_idx" ON "DailyMission"("userId");

-- Step 7: Create PricePrediction table
CREATE TABLE IF NOT EXISTS "PricePrediction" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "priceAtPrediction" INTEGER NOT NULL,
    "weekStart" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "correct" BOOLEAN,
    "rewarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PricePrediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PricePrediction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PricePrediction_userId_cardId_weekStart_key" ON "PricePrediction"("userId", "cardId", "weekStart");
CREATE INDEX IF NOT EXISTS "PricePrediction_resolved_idx" ON "PricePrediction"("resolved");

-- Step 8: Create Achievement table
CREATE TABLE IF NOT EXISTS "Achievement" (
    "id" SERIAL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameTh" TEXT,
    "description" TEXT,
    "criteria" JSONB NOT NULL,
    "honeyReward" INTEGER NOT NULL,
    "badgeImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_code_key" ON "Achievement"("code");

-- Step 9: Create UserAchievement table
CREATE TABLE IF NOT EXISTS "UserAchievement" (
    "id" SERIAL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" INTEGER NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE INDEX IF NOT EXISTS "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- Step 10: Create SeasonalEvent table
CREATE TABLE IF NOT EXISTS "SeasonalEvent" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameTh" TEXT,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "honeyMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
