import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

export const GET = adminApiHandler(async (request: NextRequest, _admin) => {
  const setCode = request.nextUrl.searchParams.get("set");

  if (!setCode) {
    const sets = await prisma.cardSet.findMany({
      where: { type: { in: ["BOOSTER", "EXTRA_BOOSTER"] } },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        type: true,
        packsPerBox: true,
        cardsPerPack: true,
        dropRates: {
          select: { rarity: true, avgPerBox: true, ratePerPack: true },
          orderBy: { rarity: "asc" },
        },
        _count: { select: { cards: true } },
      },
    });
    return NextResponse.json({ sets });
  }

  const cardSet = await prisma.cardSet.findUnique({
    where: { code: setCode },
    include: {
      dropRates: { orderBy: { rarity: "asc" } },
    },
  });

  if (!cardSet) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 });
  }

  const rarityCounts = await prisma.card.groupBy({
    by: ["rarity", "isParallel"],
    where: { setId: cardSet.id },
    _count: true,
  });

  return NextResponse.json({
    set: cardSet,
    dropRates: cardSet.dropRates,
    rarityCounts: rarityCounts.map((r) => ({
      rarity: r.rarity,
      isParallel: r.isParallel,
      count: r._count,
    })),
  });
});

export const PATCH = adminApiHandler(async (request: NextRequest, _admin) => {
  const parsed = await parseJsonBody<
    | { setId: number; rarity: string; avgPerBox?: number | null; ratePerPack?: number | null }
    | { batch: { setId: number; rarity: string; avgPerBox?: number | null; ratePerPack?: number | null }[] }
  >(request);
  if (!parsed.ok) return parsed.response;

  if ("batch" in parsed.body && Array.isArray(parsed.body.batch)) {
    const items = parsed.body.batch;
    if (items.length === 0) {
      return NextResponse.json({ error: "batch must not be empty" }, { status: 400 });
    }
    for (const item of items) {
      if (!item.setId || !item.rarity) {
        return NextResponse.json({ error: "Each item requires setId and rarity" }, { status: 400 });
      }
    }

    const results = await prisma.$transaction(
      items.map((item) =>
        prisma.setDropRate.upsert({
          where: { setId_rarity: { setId: item.setId, rarity: item.rarity } },
          update: { avgPerBox: item.avgPerBox, ratePerPack: item.ratePerPack },
          create: { setId: item.setId, rarity: item.rarity, avgPerBox: item.avgPerBox, ratePerPack: item.ratePerPack },
        }),
      ),
    );

    return NextResponse.json({ count: results.length, results });
  }

  const { setId, rarity, avgPerBox, ratePerPack } = parsed.body as {
    setId: number;
    rarity: string;
    avgPerBox?: number | null;
    ratePerPack?: number | null;
  };

  if (!setId || !rarity) {
    return NextResponse.json({ error: "setId and rarity are required" }, { status: 400 });
  }

  const result = await prisma.setDropRate.upsert({
    where: { setId_rarity: { setId, rarity } },
    update: { avgPerBox, ratePerPack },
    create: { setId, rarity, avgPerBox, ratePerPack },
  });

  return NextResponse.json(result);
});
