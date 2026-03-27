import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  try {
    const includeClause = {
      set: true,
      prices: {
        orderBy: { scrapedAt: "desc" as const },
        take: 1,
      },
    };

    const card =
      (await prisma.card.findUnique({
        where: { cardCode: code.toUpperCase() },
        include: includeClause,
      })) ??
      (await prisma.card.findFirst({
        where: { baseCode: code.toUpperCase(), isParallel: false },
        include: includeClause,
      }));

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.card.update({
      where: { id: card.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({
      card,
      latestPrice: card.prices[0] || null,
      priceChange24h: card.priceChange24h,
      priceChange7d: card.priceChange7d,
    });
  } catch (error) {
    console.error("Error fetching card:", error);
    return NextResponse.json({ error: "Failed to fetch card" }, { status: 500 });
  }
}
