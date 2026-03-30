import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { opcgConfig } from "@/lib/game-config";

const BANDAI_BASE = opcgConfig.officialCardImageBase!;
const log = createLog("admin:image-matching");

export async function GET(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const sp = request.nextUrl.searchParams;
  const setFilter = sp.get("set") || "";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10) || 1);
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isParallel: true };
  if (setFilter) {
    where.set = { code: setFilter };
  }

  const [cards, total, sets] = await Promise.all([
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

  return NextResponse.json({
    cards: enriched,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    sets,
  });
}

export async function PATCH(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

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
}
