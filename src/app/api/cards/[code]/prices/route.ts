import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const period = request.nextUrl.searchParams.get("period") || "7d";
  const source = request.nextUrl.searchParams.get("source") || undefined;
  const grade = request.nextUrl.searchParams.get("grade") || undefined;

  try {
    const card =
      (await prisma.card.findUnique({
        where: { cardCode: code },
        select: { id: true },
      })) ??
      (await prisma.card.findUnique({
        where: { cardCode: code.toUpperCase() },
        select: { id: true },
      })) ??
      (await prisma.card.findFirst({
        where: { baseCode: code.toUpperCase(), isParallel: false },
        select: { id: true },
      }));

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const now = new Date();
    let since: Date;
    switch (period) {
      case "24h":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        since = new Date(0);
        break;
      default:
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const whereClause: Record<string, unknown> = {
      cardId: card.id,
      scrapedAt: { gte: since },
    };

    if (source) {
      whereClause.source = source;
    }

    if (grade === "raw") {
      whereClause.gradeCondition = null;
    } else if (grade) {
      whereClause.gradeCondition = grade;
    }

    const prices = await prisma.cardPrice.findMany({
      where: whereClause,
      orderBy: { scrapedAt: "asc" },
      select: {
        id: true,
        source: true,
        type: true,
        priceJpy: true,
        priceThb: true,
        priceUsd: true,
        priceEur: true,
        inStock: true,
        gradeCondition: true,
        scrapedAt: true,
      },
    });

    const useUsd = source === "SNKRDUNK";
    const currency = useUsd ? "USD" : "JPY";

    let high: number, low: number, avg: number;
    if (useUsd) {
      const usdPrices = prices
        .filter((p) => p.priceUsd !== null)
        .map((p) => p.priceUsd!);
      high = usdPrices.length ? Math.max(...usdPrices) : 0;
      low = usdPrices.length ? Math.min(...usdPrices) : 0;
      avg = usdPrices.length
        ? Math.round(usdPrices.reduce((a, b) => a + b, 0) / usdPrices.length)
        : 0;
    } else {
      const jpyPrices = prices
        .filter((p) => p.priceJpy !== null)
        .map((p) => p.priceJpy!);
      high = jpyPrices.length ? Math.max(...jpyPrices) : 0;
      low = jpyPrices.length ? Math.min(...jpyPrices) : 0;
      avg = jpyPrices.length
        ? Math.round(jpyPrices.reduce((a, b) => a + b, 0) / jpyPrices.length)
        : 0;
    }

    const sources = [...new Set(prices.map((p) => p.source))];

    return NextResponse.json({ prices, high, low, avg, sources, currency });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
