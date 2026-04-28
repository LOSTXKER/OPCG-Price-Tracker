-- Split User god-model into 3 satellite tables (Phase 3.1).
--
-- The original User table grew ~70 fields. Notification preferences,
-- privacy / showcase toggles, and entitlements (paid counters + time
-- windows) are conceptually orthogonal and were updated by completely
-- different surfaces (settings, profile, billing/honey shop). Splitting
-- shrinks `select` payloads on hot paths (auth, dashboard, listings)
-- and keeps "add a new flag" migrations scoped to a single concern.
--
-- Each new table is 1:1 with User keyed on `userId`, ON DELETE CASCADE.
-- Defaults match the previous column defaults so a missing satellite
-- row is indistinguishable from "all defaults".

-- ============================================================
-- UserNotificationPrefs
-- ============================================================
CREATE TABLE "UserNotificationPrefs" (
    "userId" TEXT NOT NULL,
    "emailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "lineAlerts" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "notifyPriceEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyPriceWeb" BOOLEAN NOT NULL DEFAULT true,
    "notifyPriceLine" BOOLEAN NOT NULL DEFAULT false,
    "notifyMarketEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyMarketWeb" BOOLEAN NOT NULL DEFAULT true,
    "notifyMarketLine" BOOLEAN NOT NULL DEFAULT false,
    "notifyHoneyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyHoneyWeb" BOOLEAN NOT NULL DEFAULT true,
    "notifyHoneyLine" BOOLEAN NOT NULL DEFAULT false,
    "notifyDigestEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyDigestWeb" BOOLEAN NOT NULL DEFAULT true,
    "notifyDigestLine" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationPrefs_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserNotificationPrefs"
    ADD CONSTRAINT "UserNotificationPrefs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UserNotificationPrefs" (
    "userId", "emailAlerts", "lineAlerts", "weeklyDigest",
    "notifyPriceEmail", "notifyPriceWeb", "notifyPriceLine",
    "notifyMarketEmail", "notifyMarketWeb", "notifyMarketLine",
    "notifyHoneyEmail", "notifyHoneyWeb", "notifyHoneyLine",
    "notifyDigestEmail", "notifyDigestWeb", "notifyDigestLine",
    "updatedAt"
)
SELECT
    "id", "emailAlerts", "lineAlerts", "weeklyDigest",
    "notifyPriceEmail", "notifyPriceWeb", "notifyPriceLine",
    "notifyMarketEmail", "notifyMarketWeb", "notifyMarketLine",
    "notifyHoneyEmail", "notifyHoneyWeb", "notifyHoneyLine",
    "notifyDigestEmail", "notifyDigestWeb", "notifyDigestLine",
    NOW()
FROM "User";

-- ============================================================
-- UserPrivacySettings
-- ============================================================
CREATE TABLE "UserPrivacySettings" (
    "userId" TEXT NOT NULL,
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "showCollection" BOOLEAN NOT NULL DEFAULT true,
    "showListings" BOOLEAN NOT NULL DEFAULT true,
    "showDecks" BOOLEAN NOT NULL DEFAULT true,
    "showStats" BOOLEAN NOT NULL DEFAULT true,
    "showWatchlist" BOOLEAN NOT NULL DEFAULT true,
    "hidePortfolioPrices" BOOLEAN NOT NULL DEFAULT false,
    "hidePortfolioQty" BOOLEAN NOT NULL DEFAULT false,
    "profileSummaryOnly" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPrivacySettings_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserPrivacySettings"
    ADD CONSTRAINT "UserPrivacySettings_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UserPrivacySettings" (
    "userId", "profileVisibility",
    "showCollection", "showListings", "showDecks", "showStats", "showWatchlist",
    "hidePortfolioPrices", "hidePortfolioQty", "profileSummaryOnly",
    "updatedAt"
)
SELECT
    "id", "profileVisibility",
    "showCollection", "showListings", "showDecks", "showStats", "showWatchlist",
    "hidePortfolioPrices", "hidePortfolioQty", "profileSummaryOnly",
    NOW()
FROM "User";

-- ============================================================
-- UserEntitlements
-- ============================================================
CREATE TABLE "UserEntitlements" (
    "userId" TEXT NOT NULL,
    "extraPriceAlertSlots" INTEGER NOT NULL DEFAULT 0,
    "csvExportCredits" INTEGER NOT NULL DEFAULT 0,
    "extraWatchlistSlots" INTEGER NOT NULL DEFAULT 0,
    "bulkLookupCredits" INTEGER NOT NULL DEFAULT 0,
    "autoPricingUntil" TIMESTAMP(3),
    "lineAlertsUntil" TIMESTAMP(3),
    "weeklyListingBoostUntil" TIMESTAMP(3),
    "ticketBalance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEntitlements_pkey" PRIMARY KEY ("userId")
);

ALTER TABLE "UserEntitlements"
    ADD CONSTRAINT "UserEntitlements_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UserEntitlements" (
    "userId",
    "extraPriceAlertSlots", "csvExportCredits", "extraWatchlistSlots",
    "bulkLookupCredits", "autoPricingUntil", "lineAlertsUntil",
    "weeklyListingBoostUntil", "ticketBalance",
    "updatedAt"
)
SELECT
    "id",
    "extraPriceAlertSlots", "csvExportCredits", "extraWatchlistSlots",
    "bulkLookupCredits", "autoPricingUntil", "lineAlertsUntil",
    "weeklyListingBoostUntil", "ticketBalance",
    NOW()
FROM "User";

-- ============================================================
-- Drop the moved columns from User
-- ============================================================
ALTER TABLE "User"
    DROP COLUMN "emailAlerts",
    DROP COLUMN "lineAlerts",
    DROP COLUMN "weeklyDigest",
    DROP COLUMN "notifyPriceEmail",
    DROP COLUMN "notifyPriceWeb",
    DROP COLUMN "notifyPriceLine",
    DROP COLUMN "notifyMarketEmail",
    DROP COLUMN "notifyMarketWeb",
    DROP COLUMN "notifyMarketLine",
    DROP COLUMN "notifyHoneyEmail",
    DROP COLUMN "notifyHoneyWeb",
    DROP COLUMN "notifyHoneyLine",
    DROP COLUMN "notifyDigestEmail",
    DROP COLUMN "notifyDigestWeb",
    DROP COLUMN "notifyDigestLine",
    DROP COLUMN "profileVisibility",
    DROP COLUMN "showCollection",
    DROP COLUMN "showListings",
    DROP COLUMN "showDecks",
    DROP COLUMN "showStats",
    DROP COLUMN "showWatchlist",
    DROP COLUMN "hidePortfolioPrices",
    DROP COLUMN "hidePortfolioQty",
    DROP COLUMN "profileSummaryOnly",
    DROP COLUMN "extraPriceAlertSlots",
    DROP COLUMN "csvExportCredits",
    DROP COLUMN "extraWatchlistSlots",
    DROP COLUMN "bulkLookupCredits",
    DROP COLUMN "autoPricingUntil",
    DROP COLUMN "lineAlertsUntil",
    DROP COLUMN "weeklyListingBoostUntil",
    DROP COLUMN "ticketBalance";
