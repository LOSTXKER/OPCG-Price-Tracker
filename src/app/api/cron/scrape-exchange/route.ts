import { cronHandler } from "@/lib/api/cron-auth";
import { fetchExchangeRate, saveExchangeRate } from "@/lib/scraper/exchange-rate";

export const GET = cronHandler(async () => {
  const rate = await fetchExchangeRate();
  const record = await saveExchangeRate(rate);
  return {
    rate: record.rate,
    fetchedAt: record.fetchedAt.toISOString(),
  };
});
