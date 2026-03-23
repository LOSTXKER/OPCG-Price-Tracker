import { scrapeDailyPrices } from "@/lib/scraper/daily-prices";
import { NextRequest, NextResponse } from "next/server";

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 && token === secret;
}

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await scrapeDailyPrices();
    return NextResponse.json({
      ok: true,
      totalCards: result.totalCards,
      totalSets: result.totalSets,
      errorCount: result.errors.length,
      errors: result.errors.slice(0, 50),
      startedAt: result.startedAt.toISOString(),
      finishedAt: result.finishedAt.toISOString(),
    });
  } catch (error) {
    console.error("cron/scrape-prices:", error);
    const message = error instanceof Error ? error.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
