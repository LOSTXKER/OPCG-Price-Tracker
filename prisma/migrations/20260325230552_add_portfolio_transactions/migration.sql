-- CreateTable
CREATE TABLE "PortfolioTransaction" (
    "id" SERIAL NOT NULL,
    "portfolioId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioTransaction_portfolioId_createdAt_idx" ON "PortfolioTransaction"("portfolioId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PortfolioTransaction_cardId_idx" ON "PortfolioTransaction"("cardId");

-- AddForeignKey
ALTER TABLE "PortfolioTransaction" ADD CONSTRAINT "PortfolioTransaction_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioTransaction" ADD CONSTRAINT "PortfolioTransaction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
