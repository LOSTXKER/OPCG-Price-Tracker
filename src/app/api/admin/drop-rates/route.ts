import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";

const log = createLog("admin:drop-rates");

export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

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
}

export async function PATCH(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const parsed = await parseJsonBody<{
    setId: number;
    rarity: string;
    avgPerBox?: number | null;
    ratePerPack?: number | null;
  }>(request);
  if (!parsed.ok) return parsed.response;

  try {
    const { setId, rarity, avgPerBox, ratePerPack } = parsed.body;

    if (!setId || !rarity) {
      return NextResponse.json({ error: "setId and rarity are required" }, { status: 400 });
    }

    const result = await prisma.setDropRate.upsert({
      where: { setId_rarity: { setId, rarity } },
      update: { avgPerBox, ratePerPack },
      create: { setId, rarity, avgPerBox, ratePerPack },
    });

    return NextResponse.json(result);
  } catch (error) {
    log.error("PATCH /api/admin/drop-rates", error);
    return NextResponse.json({ error: "Failed to update drop rate" }, { status: 500 });
  }
}
