-- Phase 1.3 / Phase 4.2 / Phase 3.3 — refactor groundwork
--
-- 1. HoneyTransaction.idempotencyKey (sparse unique) — replaces
--    `metadata.path` filtering for weekly/monthly bonus dedup. Callers
--    pass an idempotency string to grantHoney; P2002 collisions are
--    treated as "already paid".
-- 2. Card indexes on latestPriceJpy + updatedAt — sort hot-paths in
--    /api/cards default ordering and price-sorted lists.
-- 3. MonthlyMission.bonusClaimed mirrors the JSON tasks[*].claimed
--    flag for the COMPLETE_ALL bonus, so the bonus payout can be
--    race-protected with a guarded updateMany. Backfilled from the
--    tasks JSON in this migration.

ALTER TABLE "HoneyTransaction" ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "HoneyTransaction_idempotencyKey_key"
  ON "HoneyTransaction"("idempotencyKey");

CREATE INDEX "Card_latestPriceJpy_idx"
  ON "Card"("latestPriceJpy" DESC);

CREATE INDEX "Card_updatedAt_idx"
  ON "Card"("updatedAt" DESC);

ALTER TABLE "MonthlyMission" ADD COLUMN "bonusClaimed" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: any existing row whose tasks JSON has a `complete_all` task
-- already marked claimed should reflect that on the new column.
UPDATE "MonthlyMission" m
SET "bonusClaimed" = TRUE
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(m."tasks"::jsonb) AS t(elem)
  WHERE elem->>'id' = 'complete_all' AND (elem->>'claimed')::boolean IS TRUE
);
