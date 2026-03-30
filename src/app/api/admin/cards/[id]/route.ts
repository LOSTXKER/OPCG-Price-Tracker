import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { opcgConfig } from "@/lib/game-config";

const log = createLog("admin:cards");

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkIsAdmin())) return unauthorized();

  const { id } = await params;
  const cardId = parseInt(id);
  if (isNaN(cardId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const card = await prisma.card.findUnique({
    where: { id: cardId },
    include: {
      set: { select: { code: true, name: true, nameEn: true } },
      prices: {
        orderBy: { scrapedAt: "desc" },
        take: 30,
        select: {
          id: true,
          source: true,
          type: true,
          priceJpy: true,
          scrapedAt: true,
        },
      },
    },
  });

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  // For parallels, generate candidate image URLs
  const candidates: { pIndex: number; url: string }[] = [];
  if (card.isParallel && card.baseCode) {
    const bandaiBase = opcgConfig.officialCardImageBase!;
    for (let p = 1; p <= 8; p++) {
      candidates.push({
        pIndex: p,
        url: `${bandaiBase}/${card.baseCode}_p${p}.png`,
      });
    }
  }

  return NextResponse.json({ ...card, candidates });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkIsAdmin())) return unauthorized();

  const { id } = await params;
  const cardId = parseInt(id);
  if (isNaN(cardId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const parsed = await parseJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;

  try {
    const body = parsed.body;

    const allowedFields = [
      "nameJp",
      "nameEn",
      "nameTh",
      "rarity",
      "cardType",
      "color",
      "colorEn",
      "cost",
      "power",
      "counter",
      "life",
      "attribute",
      "trait",
      "artist",
      "effectJp",
      "effectEn",
      "effectTh",
      "triggerJp",
      "triggerEn",
      "imageUrl",
      "parallelIndex",
    ];

    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    log.error("PATCH /api/admin/cards/[id]", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}
