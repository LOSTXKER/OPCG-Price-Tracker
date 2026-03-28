import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const setCode = request.nextUrl.searchParams.get("set");

  if (!setCode) {
    const sets = await prisma.cardSet.findMany({
      where: { type: { in: ["BOOSTER", "EXTRA_BOOSTER"] } },
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        nameTh: true,
        type: true,
        releaseDate: true,
        boxImageUrl: true,
      },
      orderBy: { releaseDate: "desc" },
    });

    const topCards = await prisma.card.findMany({
      where: {
        setId: { in: sets.map((s) => s.id) },
        imageUrl: { not: null },
      },
      orderBy: { cardCode: "asc" },
      select: { setId: true, imageUrl: true },
    });
    const topCardMap = new Map<number, string>();
    for (const tc of topCards) {
      if (!topCardMap.has(tc.setId) && tc.imageUrl) {
        topCardMap.set(tc.setId, tc.imageUrl);
      }
    }

    return NextResponse.json({
      sets: sets.map((s) => ({
        ...s,
        imageUrl: s.boxImageUrl ?? topCardMap.get(s.id) ?? null,
      })),
    });
  }

  const cardSet = await prisma.cardSet.findUnique({
    where: { code: setCode },
    include: { dropRates: true },
  });

  if (!cardSet) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const cards = await prisma.card.findMany({
    where: { setId: cardSet.id },
    select: {
      id: true,
      cardCode: true,
      nameJp: true,
      nameEn: true,
      nameTh: true,
      rarity: true,
      isParallel: true,
      imageUrl: true,
      latestPriceJpy: true,
    },
    orderBy: [{ rarity: "asc" }, { cardCode: "asc" }],
  });

  const countsByRarity = await prisma.card.groupBy({
    by: ["rarity", "isParallel"],
    where: { setId: cardSet.id },
    _count: true,
  });

  const rarityMap = new Map<string, { normal: number; parallel: number }>();
  for (const row of countsByRarity) {
    const existing = rarityMap.get(row.rarity) ?? { normal: 0, parallel: 0 };
    if (row.isParallel) {
      existing.parallel = row._count;
    } else {
      existing.normal = row._count;
    }
    rarityMap.set(row.rarity, existing);
  }

  const rarityCounts = Array.from(rarityMap.entries()).map(
    ([rarity, counts]) => ({
      rarity,
      normal: counts.normal,
      parallel: counts.parallel,
    })
  );

  return NextResponse.json({
    set: {
      code: cardSet.code,
      name: cardSet.name,
      nameEn: cardSet.nameEn,
      nameTh: cardSet.nameTh,
      type: cardSet.type,
      packsPerBox: cardSet.packsPerBox,
      cardsPerPack: cardSet.cardsPerPack,
      msrpJpy: cardSet.msrpJpy,
      boxImageUrl: cardSet.boxImageUrl,
      cardCount: cardSet.cardCount,
      releaseDate: cardSet.releaseDate,
    },
    dropRates: cardSet.dropRates.map((dr) => ({
      rarity: dr.rarity,
      avgPerBox: dr.avgPerBox,
      ratePerPack: dr.ratePerPack,
    })),
    cards,
    rarityCounts,
  });
}
