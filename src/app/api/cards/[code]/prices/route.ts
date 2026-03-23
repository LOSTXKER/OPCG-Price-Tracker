import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const period = request.nextUrl.searchParams.get("period") || "7d";

  const card = await prisma.card.findUnique({
    where: { cardCode: code.toUpperCase() },
    select: { id: true },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const now = new Date();
  let since: Date;
  switch (period) {
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

  try {
    const prices = await prisma.cardPrice.findMany({
      where: {
        cardId: card.id,
        scrapedAt: { gte: since },
      },
      orderBy: { scrapedAt: "asc" },
    });

    const priceValues = prices.map((p) => p.priceJpy);
    const high = priceValues.length ? Math.max(...priceValues) : 0;
    const low = priceValues.length ? Math.min(...priceValues) : 0;
    const avg = priceValues.length
      ? Math.round(priceValues.reduce((a, b) => a + b, 0) / priceValues.length)
      : 0;

    return NextResponse.json({ prices, high, low, avg });
  } catch (error) {
    console.error("Error fetching price history:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
