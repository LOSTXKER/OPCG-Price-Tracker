import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { paginatedJson } from "@/lib/api/list-response";
import { parsePageLimit } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { opcgConfig } from "@/lib/game-config";

const BANDAI_BASE = opcgConfig.officialCardImageBase!;
const log = createLog("admin:image-matching");

export const GET = adminApiHandler(async (request: NextRequest, _admin) => {
  const sp = request.nextUrl.searchParams;
  const setFilter = sp.get("set") || "";
  const matchedFilter = sp.get("matched"); // "true" | "false" | null (all)
  const { page, limit, skip } = parsePageLimit(sp, { defaultLimit: 20, maxLimit: 50 });

  const where: Record<string, unknown> = { isParallel: true };
  if (setFilter) {
    where.set = { code: setFilter };
  }
  if (matchedFilter === "true") {
    where.parallelIndex = { not: null };
  } else if (matchedFilter === "false") {
    where.parallelIndex = null;
  }

  const matchedWhere: Record<string, unknown> = { isParallel: true, parallelIndex: { not: null } };
  if (setFilter) {
    matchedWhere.set = { code: setFilter };
  }

  const totalWhere: Record<string, unknown> = { isParallel: true };
  if (setFilter) {
    totalWhere.set = { code: setFilter };
  }

  const [cards, total, matchedCount, totalAll, sets] = await Promise.all([
    prisma.card.findMany({
      where,
      orderBy: [{ baseCode: "asc" }, { parallelIndex: "asc" }],
      skip,
      take: limit,
      select: {
        id: true,
        cardCode: true,
        baseCode: true,
        parallelIndex: true,
        imageUrl: true,
        nameJp: true,
        nameEn: true,
        yuyuteiId: true,
        latestPriceJpy: true,
        rarity: true,
        set: { select: { code: true } },
      },
    }),
    prisma.card.count({ where }),
    prisma.card.count({ where: matchedWhere }),
    prisma.card.count({ where: totalWhere }),
    prisma.cardSet.findMany({
      select: { code: true, name: true, nameEn: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const enriched = cards.map((c) => {
    const maxParallel = c.baseCode ? 8 : 0;
    const candidates = [];
    for (let p = 1; p <= maxParallel; p++) {
      candidates.push({
        pIndex: p,
        url: `${BANDAI_BASE}/${c.baseCode}_p${p}.png`,
      });
    }
    return {
      ...c,
      bandaiBaseUrl: c.baseCode
        ? `${BANDAI_BASE}/${c.baseCode}.png`
        : null,
      candidates,
    };
  });

  return paginatedJson({
    rows: enriched,
    total,
    page,
    limit,
    itemsKey: "cards",
    extra: { matchedCount, totalAll, sets },
  });
});

export const PATCH = adminApiHandler(async (request: NextRequest, _admin) => {
  const parsed = await parseJsonBody<{
    cardId: number;
    parallelIndex: number;
  }>(request);
  if (!parsed.ok) return parsed.response;

  try {
    const { cardId, parallelIndex } = parsed.body;

    if (!cardId || parallelIndex == null) {
      return NextResponse.json(
        { error: "cardId and parallelIndex are required" },
        { status: 400 }
      );
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { baseCode: true },
    });

    if (!card?.baseCode) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const newImageUrl = `${BANDAI_BASE}/${card.baseCode}_p${parallelIndex}.png`;
    const updated = await prisma.card.update({
      where: { id: cardId },
      data: { parallelIndex, imageUrl: newImageUrl },
    });

    return NextResponse.json({ success: true, card: updated });
  } catch (error) {
    log.error("PATCH /api/admin/image-matching", error);
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
  }
});
