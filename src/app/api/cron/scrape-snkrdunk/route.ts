import { authorizeCron } from "@/lib/api/cron-auth";
import { updateSnkrdunkPrices } from "@/lib/scraper/snkrdunk-matcher";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  try {
    const result = await updateSnkrdunkPrices(prisma);
    const finishedAt = new Date();

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      errors: result.errors.length,
      errorDetails: result.errors.slice(0, 10),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
    });
  } catch (error) {
    console.error("cron/scrape-snkrdunk:", error);
    const message = error instanceof Error ? error.message : "Scrape failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
