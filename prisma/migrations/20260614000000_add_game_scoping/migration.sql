-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "gameId" INTEGER;

-- AlterTable
ALTER TABLE "Portfolio" ADD COLUMN     "gameId" INTEGER;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "gameId" INTEGER;

-- AlterTable
ALTER TABLE "Deck" ADD COLUMN     "gameId" INTEGER;

-- AlterTable
ALTER TABLE "YuyuteiMapping" ADD COLUMN     "gameId" INTEGER;

-- AlterTable
ALTER TABLE "SnkrdunkMapping" ADD COLUMN     "gameId" INTEGER;

-- CreateIndex
CREATE INDEX "Card_gameId_idx" ON "Card"("gameId");

-- CreateIndex
CREATE INDEX "Portfolio_userId_gameId_idx" ON "Portfolio"("userId", "gameId");

-- CreateIndex
CREATE INDEX "Listing_gameId_status_idx" ON "Listing"("gameId", "status");

-- CreateIndex
CREATE INDEX "Deck_userId_gameId_idx" ON "Deck"("userId", "gameId");

-- CreateIndex
CREATE INDEX "YuyuteiMapping_gameId_idx" ON "YuyuteiMapping"("gameId");

-- CreateIndex
CREATE INDEX "SnkrdunkMapping_gameId_idx" ON "SnkrdunkMapping"("gameId");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YuyuteiMapping" ADD CONSTRAINT "YuyuteiMapping_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SnkrdunkMapping" ADD CONSTRAINT "SnkrdunkMapping_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

