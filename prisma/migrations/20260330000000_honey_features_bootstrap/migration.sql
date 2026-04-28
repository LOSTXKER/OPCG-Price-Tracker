-- Bootstrap honey + achievement infrastructure that previously lived in
-- `scripts/migrate-honey-features.sql` (a one-off bootstrap script that was
-- never folded into Prisma's migration history). Without this migration a
-- fresh clone-deploy fails because subsequent migrations
-- (`20260401000000_daily_mission_redesign`, `20260401100000_honey_economy_rebalance`,
-- `20260501000000_honey_rebalance_v2`, …) ALTER tables/enums that did not
-- yet exist in the migration history.
--
-- All statements are idempotent (`IF NOT EXISTS`, `DO $$ … $$` guards) so
-- environments that already ran the manual script see this migration as a
-- no-op and Prisma simply records it as applied.

-- ── Enums ───────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'HoneyActionType') THEN
    CREATE TYPE "HoneyActionType" AS ENUM (
      'CHECKIN', 'MARKETPLACE_SELL', 'REVIEW', 'REFERRAL',
      'REDEEM', 'ADMIN_GRANT', 'TRIAL_BONUS', 'EXPIRED'
    );
  END IF;
END
$$;

ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'DAILY_MISSION';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'PRICE_PREDICTION';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'DECK_SHARE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'COMMUNITY_PRICE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'ONBOARDING';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'ACHIEVEMENT';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'PORTFOLIO_ADD';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'GIFT_SEND';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'GIFT_RECEIVE';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'LUCKY_DRAW';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'FIRST_PURCHASE';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShopItemType') THEN
    CREATE TYPE "ShopItemType" AS ENUM (
      'TRIAL_PRO', 'TRIAL_PRO_PLUS', 'BADGE', 'CUSTOM',
      'PROFILE_FRAME', 'PRICE_ALERT_SLOT', 'CSV_EXPORT_PASS'
    );
  ELSE
    BEGIN ALTER TYPE "ShopItemType" ADD VALUE IF NOT EXISTS 'PROFILE_FRAME'; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER TYPE "ShopItemType" ADD VALUE IF NOT EXISTS 'PRICE_ALERT_SLOT'; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER TYPE "ShopItemType" ADD VALUE IF NOT EXISTS 'CSV_EXPORT_PASS'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  END IF;
END
$$;

-- ── User columns added by the original honey rollout ────────────────────

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "honeyLifetimeEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileFrame" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstPurchaseRewarded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "extraPriceAlertSlots" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "csvExportCredits" INTEGER NOT NULL DEFAULT 0;

-- ── HoneyTransaction (ledger) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "HoneyTransaction" (
    "id"        SERIAL           NOT NULL,
    "userId"    TEXT             NOT NULL,
    "amount"    INTEGER          NOT NULL,
    "type"      "HoneyActionType" NOT NULL,
    "reason"    TEXT             NOT NULL,
    "metadata"  JSONB,
    "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoneyTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HoneyTransaction_userId_createdAt_idx"
  ON "HoneyTransaction"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "HoneyTransaction_userId_type_createdAt_idx"
  ON "HoneyTransaction"("userId", "type", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'HoneyTransaction_userId_fkey'
  ) THEN
    ALTER TABLE "HoneyTransaction" ADD CONSTRAINT "HoneyTransaction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── HoneyShopItem ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "HoneyShopItem" (
    "id"          SERIAL          NOT NULL,
    "name"        TEXT            NOT NULL,
    "nameEn"      TEXT,
    "nameTh"      TEXT,
    "description" TEXT,
    "cost"        INTEGER         NOT NULL,
    "type"        "ShopItemType"  NOT NULL,
    "value"       JSONB,
    "isActive"    BOOLEAN         NOT NULL DEFAULT true,
    "stock"       INTEGER,
    "createdAt"   TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoneyShopItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "HoneyShopItem_isActive_idx" ON "HoneyShopItem"("isActive");

-- ── UserBadge ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "UserBadge" (
    "id"        SERIAL       NOT NULL,
    "userId"    TEXT         NOT NULL,
    "name"      TEXT         NOT NULL,
    "nameEn"    TEXT,
    "nameTh"    TEXT,
    "imageUrl"  TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserBadge_userId_fkey'
  ) THEN
    ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── DailyMission (legacy shape — `20260401000000_daily_mission_redesign`
--    rewrites it into the modern shape, `20260503000000_unify_mission_periods`
--    drops it entirely) ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "DailyMission" (
    "id"             SERIAL       NOT NULL,
    "userId"         TEXT         NOT NULL,
    "date"           TEXT         NOT NULL,
    "checkedPrice"   BOOLEAN      NOT NULL DEFAULT false,
    "addedCard"      BOOLEAN      NOT NULL DEFAULT false,
    "viewedSet"      BOOLEAN      NOT NULL DEFAULT false,
    "completed"      BOOLEAN      NOT NULL DEFAULT false,
    "rewardClaimed"  BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DailyMission_userId_date_key"
  ON "DailyMission"("userId", "date");
CREATE INDEX IF NOT EXISTS "DailyMission_userId_idx" ON "DailyMission"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'DailyMission_userId_fkey'
  ) THEN
    ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── PricePrediction ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "PricePrediction" (
    "id"                SERIAL       NOT NULL,
    "userId"            TEXT         NOT NULL,
    "cardId"            INTEGER      NOT NULL,
    "direction"         TEXT         NOT NULL,
    "priceAtPrediction" INTEGER      NOT NULL,
    "weekStart"         TEXT         NOT NULL,
    "resolved"          BOOLEAN      NOT NULL DEFAULT false,
    "correct"           BOOLEAN,
    "rewarded"          BOOLEAN      NOT NULL DEFAULT false,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricePrediction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PricePrediction_userId_cardId_weekStart_key"
  ON "PricePrediction"("userId", "cardId", "weekStart");
CREATE INDEX IF NOT EXISTS "PricePrediction_resolved_idx" ON "PricePrediction"("resolved");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PricePrediction_userId_fkey'
  ) THEN
    ALTER TABLE "PricePrediction" ADD CONSTRAINT "PricePrediction_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PricePrediction_cardId_fkey'
  ) THEN
    ALTER TABLE "PricePrediction" ADD CONSTRAINT "PricePrediction_cardId_fkey"
      FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── Achievement / UserAchievement ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Achievement" (
    "id"            SERIAL       NOT NULL,
    "code"          TEXT         NOT NULL,
    "name"          TEXT         NOT NULL,
    "nameEn"        TEXT,
    "nameTh"        TEXT,
    "description"   TEXT,
    "criteria"      JSONB        NOT NULL,
    "honeyReward"   INTEGER      NOT NULL,
    "badgeImageUrl" TEXT,
    "isActive"      BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Achievement_code_key" ON "Achievement"("code");

CREATE TABLE IF NOT EXISTS "UserAchievement" (
    "id"            SERIAL       NOT NULL,
    "userId"        TEXT         NOT NULL,
    "achievementId" INTEGER      NOT NULL,
    "earnedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserAchievement_userId_achievementId_key"
  ON "UserAchievement"("userId", "achievementId");
CREATE INDEX IF NOT EXISTS "UserAchievement_userId_idx" ON "UserAchievement"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserAchievement_userId_fkey'
  ) THEN
    ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserAchievement_achievementId_fkey'
  ) THEN
    ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey"
      FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- ── SeasonalEvent ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SeasonalEvent" (
    "id"              SERIAL           NOT NULL,
    "name"            TEXT             NOT NULL,
    "nameEn"          TEXT,
    "nameTh"          TEXT,
    "description"     TEXT,
    "startDate"       TIMESTAMP(3)     NOT NULL,
    "endDate"         TIMESTAMP(3)     NOT NULL,
    "honeyMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isActive"        BOOLEAN          NOT NULL DEFAULT true,
    "createdAt"       TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonalEvent_pkey" PRIMARY KEY ("id")
);

-- ── MonthlyRaffle / RaffleTicket ───────────────────────────────────────
-- Schema as it existed before `20260406000000_gacha_machine_raffle`
-- added the slug/imageUrl/color/sortOrder columns.

CREATE TABLE IF NOT EXISTS "MonthlyRaffle" (
    "id"             SERIAL       NOT NULL,
    "month"          TEXT         NOT NULL,
    "title"          TEXT         NOT NULL,
    "titleEn"        TEXT,
    "titleTh"        TEXT,
    "description"    TEXT,
    "prizes"         JSONB        NOT NULL,
    "ticketCost"     INTEGER      NOT NULL DEFAULT 50,
    "maxTickets"     INTEGER      NOT NULL DEFAULT 5,
    "freeThreshold"  INTEGER      NOT NULL DEFAULT 7,
    "isActive"       BOOLEAN      NOT NULL DEFAULT true,
    "drawnAt"        TIMESTAMP(3),
    "winnerId"       TEXT,
    "winnerTicketId" INTEGER,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyRaffle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyRaffle_month_key" ON "MonthlyRaffle"("month");

CREATE TABLE IF NOT EXISTS "RaffleTicket" (
    "id"        SERIAL       NOT NULL,
    "userId"    TEXT         NOT NULL,
    "raffleId"  INTEGER      NOT NULL,
    "isFree"    BOOLEAN      NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaffleTicket_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RaffleTicket_raffleId_userId_idx"
  ON "RaffleTicket"("raffleId", "userId");
CREATE INDEX IF NOT EXISTS "RaffleTicket_userId_idx" ON "RaffleTicket"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RaffleTicket_userId_fkey'
  ) THEN
    ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'RaffleTicket_raffleId_fkey'
  ) THEN
    ALTER TABLE "RaffleTicket" ADD CONSTRAINT "RaffleTicket_raffleId_fkey"
      FOREIGN KEY ("raffleId") REFERENCES "MonthlyRaffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- Extra HoneyActionType values introduced in tandem with the raffle tables.
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'RAFFLE_TICKET';
ALTER TYPE "HoneyActionType" ADD VALUE IF NOT EXISTS 'RAFFLE_WIN';

-- ── MonthlyMission (legacy shape — `20260503000000_unify_mission_periods`
--    drops it; included here so `20260428010000_refactor_p1_idempotency_indexes`
--    can ALTER the table on a fresh deploy) ────────────────────────────

CREATE TABLE IF NOT EXISTS "MonthlyMission" (
    "id"        SERIAL       NOT NULL,
    "userId"    TEXT         NOT NULL,
    "month"     TEXT         NOT NULL,
    "tasks"     JSONB        NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyMission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MonthlyMission_userId_month_key"
  ON "MonthlyMission"("userId", "month");
CREATE INDEX IF NOT EXISTS "MonthlyMission_userId_idx" ON "MonthlyMission"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'MonthlyMission_userId_fkey'
  ) THEN
    ALTER TABLE "MonthlyMission" ADD CONSTRAINT "MonthlyMission_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
