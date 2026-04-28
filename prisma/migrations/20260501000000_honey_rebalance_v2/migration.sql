-- Honey Economy Rebalance v2 (May 2026)
--
-- Adds new ledger action types, weekly mission cadence, monthly perfect-day
-- bonus rule, and progression-gating + rotating-featured fields on the shop.
-- See doc/honey-economy-rebalance.md for design intent.

-- ── HoneyActionType: new ledger event types ──
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'REFERRAL_WELCOME';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'MILESTONE_STREAK_7';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'MILESTONE_STREAK_30';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'BUYER_PURCHASE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'MONTHLY_PERFECT_BONUS';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'WEEKLY_MISSION';

-- ── MissionCategory: weekly cadence ──
ALTER TYPE "MissionCategory" ADD VALUE IF NOT EXISTS 'WEEKLY';

-- ── MissionBonusRequirement: 28 perfect days in a calendar month ──
ALTER TYPE "MissionBonusRequirement" ADD VALUE IF NOT EXISTS 'MONTHLY_PERFECT';

-- ── HoneyShopItem: gating + featured slot ──
ALTER TABLE "HoneyShopItem"
  ADD COLUMN IF NOT EXISTS "requiredLevel"  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "originalCost"   INTEGER,
  ADD COLUMN IF NOT EXISTS "featuredUntil"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "availableUntil" TIMESTAMP(3);

-- ── User: fulfillment counters / windows for new Tier-M shop items ──
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "extraWatchlistSlots"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bulkLookupCredits"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "autoPricingUntil"        TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lineAlertsUntil"         TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "weeklyListingBoostUntil" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "HoneyShopItem_featuredUntil_idx"
  ON "HoneyShopItem"("featuredUntil");
CREATE INDEX IF NOT EXISTS "HoneyShopItem_requiredLevel_idx"
  ON "HoneyShopItem"("requiredLevel");

-- ── WeeklyMission: per-user weekly mission state ──
CREATE TABLE IF NOT EXISTS "WeeklyMission" (
    "id"           SERIAL       NOT NULL,
    "userId"       TEXT         NOT NULL,
    "weekStart"    TEXT         NOT NULL,
    "tasks"        JSONB        NOT NULL DEFAULT '[]',
    "progress"     INTEGER      NOT NULL DEFAULT 0,
    "completed"    BOOLEAN      NOT NULL DEFAULT false,
    "bonusClaimed" BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyMission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "WeeklyMission_userId_weekStart_key"
  ON "WeeklyMission"("userId", "weekStart");
CREATE INDEX IF NOT EXISTS "WeeklyMission_userId_idx"
  ON "WeeklyMission"("userId");

ALTER TABLE "WeeklyMission"
  ADD CONSTRAINT "WeeklyMission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
