-- Remove deprecated DailyMission columns
ALTER TABLE "DailyMission" DROP COLUMN IF EXISTS "rewardClaimed";
ALTER TABLE "DailyMission" DROP COLUMN IF EXISTS "checkedPrice";
ALTER TABLE "DailyMission" DROP COLUMN IF EXISTS "addedCard";
ALTER TABLE "DailyMission" DROP COLUMN IF EXISTS "viewedSet";

-- Remove unused firstPurchaseRewarded from User
ALTER TABLE "User" DROP COLUMN IF EXISTS "firstPurchaseRewarded";
