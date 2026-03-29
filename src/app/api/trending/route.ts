import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const game = request.nextUrl.searchParams.get("game") || "";
    const gameFilter = game ? { set: { game: { slug: game } } } : {};

    const [topGainers, topLosers, mostViewed] = await Promise.all([
      prisma.card.findMany({
        where: { priceChange24h: { not: null, gt: 0 }, ...gameFilter },
        orderBy: { priceChange24h: "desc" },
        take: 10,
        include: { set: { select: { code: true, name: true, nameEn: true, nameTh: true } } },
      }),
      prisma.card.findMany({
        where: { priceChange24h: { not: null, lt: 0 }, ...gameFilter },
        orderBy: { priceChange24h: "asc" },
        take: 10,
        include: { set: { select: { code: true, name: true, nameEn: true, nameTh: true } } },
      }),
      prisma.card.findMany({
        where: { viewCount: { gt: 0 }, ...gameFilter },
        orderBy: { viewCount: "desc" },
        take: 10,
        include: { set: { select: { code: true, name: true, nameEn: true, nameTh: true } } },
      }),
    ]);

    return NextResponse.json({ topGainers, topLosers, mostViewed });
  } catch (error) {
    console.error("Error fetching trending:", error);
    return NextResponse.json({ error: "Failed to fetch trending" }, { status: 500 });
  }
}
