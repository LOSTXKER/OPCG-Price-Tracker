-- AlterTable
ALTER TABLE "CardSet" ADD COLUMN     "gameId" INTEGER;

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "Game_slug_idx" ON "Game"("slug");

-- CreateIndex
CREATE INDEX "CardSet_gameId_idx" ON "CardSet"("gameId");

-- AddForeignKey
ALTER TABLE "CardSet" ADD CONSTRAINT "CardSet_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
