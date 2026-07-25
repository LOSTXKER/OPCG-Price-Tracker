-- Portfolio acquisition lots are additive during rollout:
-- PortfolioItem remains the holding identity used by quota/count/public surfaces,
-- while each acquisition keeps its own quantity and optional unit cost.

-- CreateEnum
CREATE TYPE "PortfolioLotSource" AS ENUM ('MANUAL', 'LEGACY_OPENING_BALANCE');

-- AlterTable
-- Historical snapshots intentionally remain NULL because copy-level cost coverage
-- cannot be reconstructed reliably from PortfolioTransaction.
ALTER TABLE "PortfolioSnapshot"
ADD COLUMN "totalCopyCount" INTEGER,
ADD COLUMN "costedCopyCount" INTEGER;

-- CreateTable
CREATE TABLE "PortfolioLot" (
    "id" SERIAL NOT NULL,
    "portfolioItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitCostJpy" INTEGER,
    "acquiredAt" TIMESTAMP(3),
    "note" TEXT,
    "source" "PortfolioLotSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortfolioLot_pkey" PRIMARY KEY ("id")
);

-- PortfolioLot contains private purchase costs and notes. Supabase grants new
-- public-schema tables/sequences to Data API roles by default in this project,
-- so keep this table backend-only and deny access even if grants drift later.
ALTER TABLE "PortfolioLot" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "PortfolioLot" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE "PortfolioLot_id_seq" FROM PUBLIC, anon, authenticated;

-- CreateIndex
CREATE INDEX "PortfolioLot_portfolioItemId_acquiredAt_idx"
ON "PortfolioLot"("portfolioItemId", "acquiredAt" DESC);

-- AddForeignKey
ALTER TABLE "PortfolioLot"
ADD CONSTRAINT "PortfolioLot_portfolioItemId_fkey"
FOREIGN KEY ("portfolioItemId") REFERENCES "PortfolioItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill
-- One opening-balance lot per existing holding preserves quantity, NULL cost,
-- and genuine zero cost exactly. acquiredAt/note stay NULL so the migration does
-- not invent purchase history or move the parent-level note into a purchase lot.
INSERT INTO "PortfolioLot" (
    "portfolioItemId",
    "quantity",
    "unitCostJpy",
    "acquiredAt",
    "note",
    "source",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "quantity",
    "purchasePrice",
    NULL,
    NULL,
    'LEGACY_OPENING_BALANCE'::"PortfolioLotSource",
    "addedAt",
    "addedAt"
FROM "PortfolioItem";
