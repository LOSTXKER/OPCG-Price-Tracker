-- CreateEnum
CREATE TYPE "SetType" AS ENUM ('BOOSTER', 'EXTRA_BOOSTER', 'STARTER', 'PROMO', 'OTHER');

-- CreateEnum
CREATE TYPE "CardType" AS ENUM ('CHARACTER', 'EVENT', 'STAGE', 'LEADER', 'DON');

-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('FREE', 'PRO', 'PRO_PLUS', 'LIFETIME_PRO', 'LIFETIME_PRO_PLUS');

-- CreateEnum
CREATE TYPE "CardCondition" AS ENUM ('NM', 'LP', 'MP', 'HP', 'DMG');

-- CreateEnum
CREATE TYPE "AlertDirection" AS ENUM ('ABOVE', 'BELOW');

-- CreateEnum
CREATE TYPE "AlertChannel" AS ENUM ('EMAIL', 'LINE', 'PUSH');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'RESERVED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CardSet" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "type" "SetType" NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "cardCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" SERIAL NOT NULL,
    "cardCode" TEXT NOT NULL,
    "yuyuteiId" TEXT,
    "yuyuteiUrl" TEXT,
    "setId" INTEGER NOT NULL,
    "nameJp" TEXT NOT NULL,
    "nameEn" TEXT,
    "rarity" TEXT NOT NULL,
    "cardType" "CardType" NOT NULL,
    "color" TEXT NOT NULL,
    "colorEn" TEXT,
    "cost" INTEGER,
    "power" INTEGER,
    "counter" INTEGER,
    "life" INTEGER,
    "attribute" TEXT,
    "trait" TEXT,
    "effectJp" TEXT,
    "effectEn" TEXT,
    "triggerJp" TEXT,
    "imageUrl" TEXT,
    "isParallel" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "priceChange24h" DOUBLE PRECISION,
    "priceChange7d" DOUBLE PRECISION,
    "latestPriceJpy" INTEGER,
    "latestPriceThb" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardPrice" (
    "id" SERIAL NOT NULL,
    "cardId" INTEGER NOT NULL,
    "priceJpy" INTEGER NOT NULL,
    "priceThb" DOUBLE PRECISION,
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" SERIAL NOT NULL,
    "fromCur" TEXT NOT NULL DEFAULT 'JPY',
    "toCur" TEXT NOT NULL DEFAULT 'THB',
    "rate" DOUBLE PRECISION NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "tier" "UserTier" NOT NULL DEFAULT 'FREE',
    "tierExpiresAt" TIMESTAMP(3),
    "sellerRating" DOUBLE PRECISION,
    "sellerReviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioItem" (
    "id" SERIAL NOT NULL,
    "portfolioId" INTEGER NOT NULL,
    "cardId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchasePrice" INTEGER,
    "condition" "CardCondition" NOT NULL DEFAULT 'NM',
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistItem" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "targetPrice" INTEGER NOT NULL,
    "direction" "AlertDirection" NOT NULL,
    "channel" "AlertChannel" NOT NULL DEFAULT 'EMAIL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "priceJpy" INTEGER NOT NULL,
    "priceThb" DOUBLE PRECISION,
    "condition" "CardCondition" NOT NULL DEFAULT 'NM',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "photos" TEXT[],
    "shipping" TEXT[],
    "location" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isBoosted" BOOLEAN NOT NULL DEFAULT false,
    "boostedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "listingId" INTEGER NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revieweeId" TEXT NOT NULL,
    "listingId" INTEGER,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityPrice" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" INTEGER NOT NULL,
    "priceThb" INTEGER NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardSet_code_key" ON "CardSet"("code");

-- CreateIndex
CREATE INDEX "CardSet_code_idx" ON "CardSet"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Card_cardCode_key" ON "Card"("cardCode");

-- CreateIndex
CREATE INDEX "Card_setId_idx" ON "Card"("setId");

-- CreateIndex
CREATE INDEX "Card_rarity_idx" ON "Card"("rarity");

-- CreateIndex
CREATE INDEX "Card_cardType_idx" ON "Card"("cardType");

-- CreateIndex
CREATE INDEX "Card_color_idx" ON "Card"("color");

-- CreateIndex
CREATE INDEX "Card_nameJp_idx" ON "Card"("nameJp");

-- CreateIndex
CREATE INDEX "Card_viewCount_idx" ON "Card"("viewCount" DESC);

-- CreateIndex
CREATE INDEX "Card_priceChange24h_idx" ON "Card"("priceChange24h" DESC);

-- CreateIndex
CREATE INDEX "Card_priceChange7d_idx" ON "Card"("priceChange7d" DESC);

-- CreateIndex
CREATE INDEX "CardPrice_cardId_scrapedAt_idx" ON "CardPrice"("cardId", "scrapedAt" DESC);

-- CreateIndex
CREATE INDEX "CardPrice_scrapedAt_idx" ON "CardPrice"("scrapedAt");

-- CreateIndex
CREATE INDEX "ExchangeRate_fetchedAt_idx" ON "ExchangeRate"("fetchedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_supabaseId_idx" ON "User"("supabaseId");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "PortfolioItem_portfolioId_idx" ON "PortfolioItem"("portfolioId");

-- CreateIndex
CREATE INDEX "PortfolioItem_cardId_idx" ON "PortfolioItem"("cardId");

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioItem_portfolioId_cardId_condition_key" ON "PortfolioItem"("portfolioId", "cardId", "condition");

-- CreateIndex
CREATE INDEX "WatchlistItem_userId_idx" ON "WatchlistItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WatchlistItem_userId_cardId_key" ON "WatchlistItem"("userId", "cardId");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_isActive_idx" ON "PriceAlert"("userId", "isActive");

-- CreateIndex
CREATE INDEX "PriceAlert_cardId_isActive_idx" ON "PriceAlert"("cardId", "isActive");

-- CreateIndex
CREATE INDEX "Listing_cardId_status_idx" ON "Listing"("cardId", "status");

-- CreateIndex
CREATE INDEX "Listing_userId_status_idx" ON "Listing"("userId", "status");

-- CreateIndex
CREATE INDEX "Listing_status_createdAt_idx" ON "Listing"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Listing_isFeatured_status_idx" ON "Listing"("isFeatured", "status");

-- CreateIndex
CREATE INDEX "Message_listingId_createdAt_idx" ON "Message"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_receiverId_isRead_idx" ON "Message"("receiverId", "isRead");

-- CreateIndex
CREATE INDEX "Review_revieweeId_idx" ON "Review"("revieweeId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewerId_revieweeId_listingId_key" ON "Review"("reviewerId", "revieweeId", "listingId");

-- CreateIndex
CREATE INDEX "CommunityPrice_cardId_createdAt_idx" ON "CommunityPrice"("cardId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CommunityPrice_userId_createdAt_idx" ON "CommunityPrice"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_setId_fkey" FOREIGN KEY ("setId") REFERENCES "CardSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardPrice" ADD CONSTRAINT "CardPrice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Portfolio" ADD CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPrice" ADD CONSTRAINT "CommunityPrice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityPrice" ADD CONSTRAINT "CommunityPrice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
