-- Drop note + targetPriceJpy from WatchlistItem.
-- Saving (notes/target) is being moved to the portfolio side; the
-- watchlist now only tracks pin + alert state.

ALTER TABLE "WatchlistItem" DROP COLUMN IF EXISTS "note";
ALTER TABLE "WatchlistItem" DROP COLUMN IF EXISTS "targetPriceJpy";
