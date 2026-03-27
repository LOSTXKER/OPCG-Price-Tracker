import { NextRequest, NextResponse } from "next/server";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import {
  fetchWithRetry,
  getSetListingUrl,
  parseSetListingPage,
} from "@/lib/scraper/yuyu-tei";
import { matchAndUpdatePrices } from "@/lib/scraper/price-matcher";

export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const setCode: string = body.setCode;

  if (!setCode) {
    return NextResponse.json(
      { error: "setCode is required" },
      { status: 400 }
    );
  }

  try {
    const url = getSetListingUrl(setCode);
    const $ = await fetchWithRetry(url);
    const listings = parseSetListingPage($);

    if (listings.length === 0) {
      return NextResponse.json({
        success: true,
        setCode,
        message: "No cards found on Yuyu-tei",
        matched: 0,
        unmatched: 0,
      });
    }

    const result = await matchAndUpdatePrices(prisma, setCode, listings);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Scrape failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 }
    );
  }
}
