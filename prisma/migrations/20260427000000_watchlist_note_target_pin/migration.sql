-- AlterTable
ALTER TABLE "WatchlistItem"
  ADD COLUMN "note" VARCHAR(280),
  ADD COLUMN "targetPriceJpy" INTEGER,
  ADD COLUMN "pinnedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WatchlistItem_userId_pinnedAt_idx" ON "WatchlistItem"("userId", "pinnedAt" DESC);
