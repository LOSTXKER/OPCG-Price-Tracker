-- Profile showcase + extended privacy
ALTER TABLE "User" ADD COLUMN "showWatchlist" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "hidePortfolioPrices" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "hidePortfolioQty" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "profileSummaryOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "handle" TEXT;

CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");
CREATE INDEX "User_handle_idx" ON "User"("handle");

-- Per-card privacy
ALTER TABLE "PortfolioItem" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "PortfolioItem_portfolioId_isPrivate_idx" ON "PortfolioItem"("portfolioId", "isPrivate");
