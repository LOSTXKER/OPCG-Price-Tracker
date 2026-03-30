import { cronHandler } from "@/lib/api/cron-auth";
import { scrapeDailyPrices } from "@/lib/scraper/daily-prices";

export const GET = cronHandler(async () => {
  const result = await scrapeDailyPrices();
  return result as unknown as Record<string, unknown>;
});
