import { authorizeCron } from "@/lib/api/cron-auth";
import { scrapeDailyPrices } from "@/lib/scraper/daily-prices";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await scrapeDailyPrices();
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("cron/scrape-prices:", error);
    const message = error instanceof Error ? error.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
