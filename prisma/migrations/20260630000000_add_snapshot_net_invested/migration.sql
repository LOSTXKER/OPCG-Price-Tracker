-- Portfolio honesty (VISION §5.3 / §6): cumulative net cash deployed, so the value
-- line can be plotted against an "invested" baseline and inflows (adding cards) never
-- read as gain. Additive + nullable → safe, no backfill, no table rewrite.
ALTER TABLE "PortfolioSnapshot" ADD COLUMN IF NOT EXISTS "netInvestedJpy" INTEGER;
