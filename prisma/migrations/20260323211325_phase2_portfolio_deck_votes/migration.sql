-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" SERIAL NOT NULL,
    "portfolioId" INTEGER NOT NULL,
    "totalJpy" INTEGER NOT NULL,
    "totalThb" DOUBLE PRECISION,
    "totalCost" INTEGER NOT NULL,
    "pnl" INTEGER NOT NULL,
    "cardCount" INTEGER NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPriceVote" (
    "id" SERIAL NOT NULL,
    "communityPriceId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPriceVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leaderId" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckCard" (
    "id" SERIAL NOT NULL,
    "deckId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "DeckCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_portfolioId_snapshotAt_idx" ON "PortfolioSnapshot"("portfolioId", "snapshotAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityPriceVote_userId_idx" ON "CommunityPriceVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityPriceVote_communityPriceId_userId_key" ON "CommunityPriceVote"("communityPriceId", "userId");

-- CreateIndex
CREATE INDEX "Deck_userId_idx" ON "Deck"("userId");

-- CreateIndex
CREATE INDEX "DeckCard_deckId_idx" ON "DeckCard"("deckId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_cardId_key" ON "DeckCard"("deckId", "cardId");

-- AddForeignKey
ALTER TABLE "PortfolioSnapshot" ADD CONSTRAINT "PortfolioSnapshot_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPriceVote" ADD CONSTRAINT "CommunityPriceVote_communityPriceId_fkey" FOREIGN KEY ("communityPriceId") REFERENCES "CommunityPrice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeckCard" ADD CONSTRAINT "DeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
