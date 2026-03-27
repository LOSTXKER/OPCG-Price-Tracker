-- CreateTable
CREATE TABLE "YuyuteiMapping" (
    "id" SERIAL NOT NULL,
    "setCode" TEXT NOT NULL,
    "yuyuteiId" TEXT NOT NULL,
    "scrapedCode" TEXT NOT NULL,
    "scrapedRarity" TEXT,
    "scrapedName" TEXT NOT NULL,
    "scrapedImage" TEXT,
    "priceJpy" INTEGER NOT NULL,
    "matchedCardId" INTEGER,
    "matchMethod" TEXT,
    "geminiScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YuyuteiMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "YuyuteiMapping_status_idx" ON "YuyuteiMapping"("status");

-- CreateIndex
CREATE INDEX "YuyuteiMapping_setCode_idx" ON "YuyuteiMapping"("setCode");

-- CreateIndex
CREATE INDEX "YuyuteiMapping_matchedCardId_idx" ON "YuyuteiMapping"("matchedCardId");

-- CreateIndex
CREATE UNIQUE INDEX "YuyuteiMapping_setCode_yuyuteiId_key" ON "YuyuteiMapping"("setCode", "yuyuteiId");

-- AddForeignKey
ALTER TABLE "YuyuteiMapping" ADD CONSTRAINT "YuyuteiMapping_matchedCardId_fkey" FOREIGN KEY ("matchedCardId") REFERENCES "Card"("id") ON DELETE SET NULL ON UPDATE CASCADE;
