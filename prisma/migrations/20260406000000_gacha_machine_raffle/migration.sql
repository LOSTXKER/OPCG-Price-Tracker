-- Add gacha machine fields to MonthlyRaffle
ALTER TABLE "MonthlyRaffle" ADD COLUMN "slug" TEXT NOT NULL DEFAULT 'default';
ALTER TABLE "MonthlyRaffle" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "MonthlyRaffle" ADD COLUMN "color" TEXT;
ALTER TABLE "MonthlyRaffle" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Drop the old unique constraint on month
ALTER TABLE "MonthlyRaffle" DROP CONSTRAINT IF EXISTS "MonthlyRaffle_month_key";

-- Add new compound unique constraint
ALTER TABLE "MonthlyRaffle" ADD CONSTRAINT "MonthlyRaffle_month_slug_key" UNIQUE ("month", "slug");
