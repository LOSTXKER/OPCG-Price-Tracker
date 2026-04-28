import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { findCardByCode } from "@/lib/data/card-detail";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) => {
  const { code } = await params;

  const card = await findCardByCode(code, {
    include: {
      set: true,
      prices: {
        orderBy: { scrapedAt: "desc" as const },
        take: 1,
      },
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

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
});
