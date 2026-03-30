import { cronHandler } from "@/lib/api/cron-auth";
import { updateSnkrdunkPrices } from "@/lib/scraper/snkrdunk-matcher";
import { prisma } from "@/lib/db";

export const GET = cronHandler(async () => {
  const startedAt = Date.now();
  const result = await updateSnkrdunkPrices(prisma);
  return {
    processed: result.processed,
    errors: result.errors.length,
    errorDetails: result.errors.slice(0, 10),
    durationMs: Date.now() - startedAt,
  };
});
