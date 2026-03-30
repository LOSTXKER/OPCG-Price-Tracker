import { requireAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:watchlist");

export async function GET() {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const items = await prisma.watchlistItem.findMany({
      where: { userId: auth.user.id },
      orderBy: { addedAt: "desc" },
      include: { card: { include: cardInclude } },
    });

    return NextResponse.json({ items });
  } catch (error) {
    log.error("GET /api/watchlist", error);
    return NextResponse.json({ error: "Failed to load watchlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const parsed = await parseJsonBody<{ cardId?: unknown }>(request);
    if (!parsed.ok) return parsed.response;

    const cardId = typeof parsed.body.cardId === "number" ? parsed.body.cardId : Number(parsed.body.cardId);
    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const item = await prisma.watchlistItem.upsert({
      where: {
        userId_cardId: { userId: auth.user.id, cardId },
      },
      create: {
        userId: auth.user.id,
        cardId,
      },
      update: {},
      include: { card: { include: cardInclude } },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    log.error("POST /api/watchlist", error);
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const cardIdParam = request.nextUrl.searchParams.get("cardId");
    const cardId = cardIdParam ? Number(cardIdParam) : NaN;
    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Query cardId is required and must be a positive integer" }, { status: 400 });
    }

    const result = await prisma.watchlistItem.deleteMany({
      where: { userId: auth.user.id, cardId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("DELETE /api/watchlist", error);
    return NextResponse.json({ error: "Failed to remove from watchlist" }, { status: 500 });
  }
}
