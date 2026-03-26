import { authorizeCron } from "@/lib/api/cron-auth";
import { fetchExchangeRate, saveExchangeRate } from "@/lib/scraper/exchange-rate";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rate = await fetchExchangeRate();
    const record = await saveExchangeRate(rate);
    return NextResponse.json({
      ok: true,
      rate: record.rate,
      fetchedAt: record.fetchedAt.toISOString(),
    });
  } catch (error) {
    console.error("cron/scrape-exchange:", error);
    const message = error instanceof Error ? error.message : "Exchange rate update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
