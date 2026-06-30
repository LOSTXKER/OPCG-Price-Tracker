-- Portfolio is a single UNIFIED cross-game collection (VISION §5.7, owner-approved
-- 2026-06-30) — it never splits per game, so the per-portfolio gameId is dead
-- (0 reads/writes in code). Dropping the column also drops its FK + the
-- @@index([userId, gameId]) that depended on it. Safe: column was nullable/unused.
ALTER TABLE "Portfolio" DROP COLUMN IF EXISTS "gameId";
