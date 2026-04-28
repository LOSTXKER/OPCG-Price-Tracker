-- Migrate PriceAlert.channel (single AlertChannel) to PriceAlert.channels (AlertChannel[])

-- 1) Add the new array column with a temporary default so existing rows pass NOT NULL.
ALTER TABLE "PriceAlert"
  ADD COLUMN "channels" "AlertChannel"[] NOT NULL DEFAULT ARRAY[]::"AlertChannel"[];

-- 2) Backfill existing rows: keep whichever channel they currently have.
UPDATE "PriceAlert" SET "channels" = ARRAY["channel"]::"AlertChannel"[];

-- 3) Drop the temporary default; the application is responsible for setting channels going forward.
ALTER TABLE "PriceAlert" ALTER COLUMN "channels" DROP DEFAULT;

-- 4) Drop the legacy single-channel column.
ALTER TABLE "PriceAlert" DROP COLUMN "channel";
