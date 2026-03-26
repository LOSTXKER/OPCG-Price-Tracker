import { getAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.watchlistItem.findMany({
      where: { userId: dbUser.id },
      orderBy: { addedAt: "desc" },
      include: { card: { include: cardInclude } },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/watchlist:", error);
    return NextResponse.json({ error: "Failed to load watchlist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const cardId = typeof body.cardId === "number" ? body.cardId : Number(body.cardId);
    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const item = await prisma.watchlistItem.upsert({
      where: {
        userId_cardId: { userId: dbUser.id, cardId },
      },
      create: {
        userId: dbUser.id,
        cardId,
      },
      update: {},
      include: { card: { include: cardInclude } },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/watchlist:", error);
    return NextResponse.json({ error: "Failed to add to watchlist" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cardIdParam = request.nextUrl.searchParams.get("cardId");
    const cardId = cardIdParam ? Number(cardIdParam) : NaN;
    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Query cardId is required and must be a positive integer" }, { status: 400 });
    }

    const result = await prisma.watchlistItem.deleteMany({
      where: { userId: dbUser.id, cardId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/watchlist:", error);
    return NextResponse.json({ error: "Failed to remove from watchlist" }, { status: 500 });
  }
}
