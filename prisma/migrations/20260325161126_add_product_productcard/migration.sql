-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "nameTh" TEXT,
    "type" "SetType" NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCard" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,

    CONSTRAINT "ProductCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE INDEX "Product_code_idx" ON "Product"("code");

-- CreateIndex
CREATE INDEX "ProductCard_productId_idx" ON "ProductCard"("productId");

-- CreateIndex
CREATE INDEX "ProductCard_cardId_idx" ON "ProductCard"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCard_productId_cardId_key" ON "ProductCard"("productId", "cardId");

-- AddForeignKey
ALTER TABLE "ProductCard" ADD CONSTRAINT "ProductCard_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCard" ADD CONSTRAINT "ProductCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
