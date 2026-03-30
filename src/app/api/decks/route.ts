import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:decks");

export async function GET() {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const decks = await prisma.deck.findMany({
      where: { userId: auth.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        leader: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, imageUrl: true, latestPriceJpy: true } },
        cards: {
          include: {
            card: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, rarity: true, imageUrl: true, latestPriceJpy: true, cardType: true } },
          },
        },
        _count: { select: { cards: true } },
      },
    });

    return NextResponse.json({ decks });
  } catch (error) {
    log.error("GET /api/decks", error);
    return NextResponse.json({ error: "Failed to load decks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const parsed = await parseJsonBody<{ name?: string; leaderId?: number; cardIds?: { cardId: number; quantity: number }[] }>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const deck = await prisma.deck.create({
      data: {
        userId: auth.user.id,
        name,
        leaderId: body.leaderId ?? null,
        cards: body.cardIds?.length
          ? {
              create: body.cardIds.map((c) => ({
                cardId: c.cardId,
                quantity: c.quantity || 1,
              })),
            }
          : undefined,
      },
      include: {
        leader: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, imageUrl: true, latestPriceJpy: true } },
        cards: {
          include: {
            card: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, rarity: true, imageUrl: true, latestPriceJpy: true, cardType: true } },
          },
        },
      },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    log.error("POST /api/decks", error);
    return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
  }
}
