-- Phase 3.2: Unify DailyMission / WeeklyMission / MonthlyMission into a single
-- `UserMissionPeriod` table keyed by (userId, cadence, periodKey).
--
-- Strategy:
--   1. Create the new `MissionCadence` enum + `UserMissionPeriod` table.
--   2. Backfill from the three legacy tables.
--   3. Drop the legacy tables.
--
-- The shape is identical (tasks Json, progress, completed, perfectDay,
-- bonusClaimed) so backfill is a straight copy with the cadence column
-- and `periodKey` mapping (date / weekStart / month → periodKey).

-- 1. Enum + new table
CREATE TYPE "MissionCadence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

CREATE TABLE "UserMissionPeriod" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cadence" "MissionCadence" NOT NULL,
    "periodKey" TEXT NOT NULL,
    "tasks" JSONB NOT NULL DEFAULT '[]',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "perfectDay" BOOLEAN NOT NULL DEFAULT false,
    "bonusClaimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMissionPeriod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserMissionPeriod_userId_cadence_periodKey_key"
    ON "UserMissionPeriod"("userId", "cadence", "periodKey");
CREATE INDEX "UserMissionPeriod_userId_cadence_idx"
    ON "UserMissionPeriod"("userId", "cadence");
CREATE INDEX "UserMissionPeriod_cadence_periodKey_idx"
    ON "UserMissionPeriod"("cadence", "periodKey");

ALTER TABLE "UserMissionPeriod"
    ADD CONSTRAINT "UserMissionPeriod_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Backfill from legacy tables.
--    DailyMission has no `updatedAt` — we use `createdAt` as the seed.
INSERT INTO "UserMissionPeriod"
    ("userId", "cadence", "periodKey", "tasks", "progress", "completed",
     "perfectDay", "bonusClaimed", "createdAt", "updatedAt")
SELECT "userId", 'DAILY'::"MissionCadence", "date", "tasks", "progress",
       "completed", "perfectDay", "bonusClaimed", "createdAt", "createdAt"
FROM "DailyMission";

INSERT INTO "UserMissionPeriod"
    ("userId", "cadence", "periodKey", "tasks", "progress", "completed",
     "perfectDay", "bonusClaimed", "createdAt", "updatedAt")
SELECT "userId", 'WEEKLY'::"MissionCadence", "weekStart", "tasks", "progress",
       "completed", false, "bonusClaimed", "createdAt", "updatedAt"
FROM "WeeklyMission";

-- MonthlyMission carries no `progress`/`completed` columns — derive
-- progress as the count of claimed tasks and completed = bonusClaimed
-- (best-effort; client recomputes on next read anyway).
INSERT INTO "UserMissionPeriod"
    ("userId", "cadence", "periodKey", "tasks", "progress", "completed",
     "perfectDay", "bonusClaimed", "createdAt", "updatedAt")
SELECT "userId", 'MONTHLY'::"MissionCadence", "month", "tasks",
       0, "bonusClaimed", false, "bonusClaimed", "createdAt", "updatedAt"
FROM "MonthlyMission";

-- 3. Drop legacy tables.
DROP TABLE "DailyMission";
DROP TABLE "WeeklyMission";
DROP TABLE "MonthlyMission";
