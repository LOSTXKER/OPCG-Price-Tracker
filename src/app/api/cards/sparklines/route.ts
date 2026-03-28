import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids") || "";
  if (!ids) {
    return NextResponse.json({ sparklines: {} });
  }

  const cardIds = ids
    .split(",")
    .map((id) => parseInt(id))
    .filter((id) => !isNaN(id))
    .slice(0, 50);

  if (cardIds.length === 0) {
    return NextResponse.json({ sparklines: {} });
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const prices = await prisma.cardPrice.findMany({
      where: {
        cardId: { in: cardIds },
        scrapedAt: { gte: since },
        priceJpy: { not: null },
      },
      orderBy: { scrapedAt: "asc" },
      select: {
        cardId: true,
        priceJpy: true,
        scrapedAt: true,
      },
    });

    const sparklines: Record<number, number[]> = {};

    for (const p of prices) {
      if (!sparklines[p.cardId]) sparklines[p.cardId] = [];
      sparklines[p.cardId].push(p.priceJpy!);
    }

    for (const id of Object.keys(sparklines)) {
      const pts = sparklines[Number(id)];
      if (pts.length > 14) {
        const step = pts.length / 14;
        sparklines[Number(id)] = Array.from({ length: 14 }, (_, i) =>
          pts[Math.min(Math.floor(i * step), pts.length - 1)]
        );
      }
    }

    return NextResponse.json({ sparklines });
  } catch (error) {
    console.error("Error fetching sparklines:", error);
    return NextResponse.json({ sparklines: {} });
  }
}
