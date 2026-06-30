import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { gameCardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { triggerAchievementCheck } from "@/lib/honey";
import { effectiveTier, getLimits } from "@/lib/billing";
import { CreateWatchlistSchema } from "@/lib/watchlist/schemas";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const items = await prisma.watchlistItem.findMany({
    where: { userId: auth.user.id },
    orderBy: [
      { pinnedAt: { sort: "desc", nulls: "last" } },
      { addedAt: "desc" },
    ],
    include: { card: { include: gameCardInclude } },
  });

  const cardIds = items.map((i) => i.cardId);
  const alertCardIds = new Set<number>();
  if (cardIds.length > 0) {
    const alerts = await prisma.priceAlert.findMany({
      where: {
        userId: auth.user.id,
        cardId: { in: cardIds },
        isActive: true,
      },
      select: { cardId: true },
    });
    for (const a of alerts) alertCardIds.add(a.cardId);
  }

  const augmented = items.map((item) => ({
    ...item,
    hasActiveAlert: alertCardIds.has(item.cardId),
  }));

  return NextResponse.json({ items: augmented });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreateWatchlistSchema);
  if (!parsed.ok) return parsed.response;

  const cardId = parsed.body.cardId;

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const tier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(tier);
  if (limits.watchlistCards !== Infinity) {
    const alreadyExists = await prisma.watchlistItem.findUnique({
      where: { userId_cardId: { userId: auth.user.id, cardId } },
    });
    if (!alreadyExists) {
      const count = await prisma.watchlistItem.count({ where: { userId: auth.user.id } });
      if (count >= limits.watchlistCards) {
        return NextResponse.json(
          { error: `Watchlist limit reached (${limits.watchlistCards})` },
          { status: 403 }
        );
      }
    }
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
    include: { card: { include: gameCardInclude } },
  });

  triggerAchievementCheck(auth.user.id);

  return NextResponse.json({ item }, { status: 201 });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const params = request.nextUrl.searchParams;
  const cardIdParam = params.get("cardId");
  const cardIdsParam = params.get("cardIds");

  let cardIds: number[] = [];
  if (cardIdsParam) {
    cardIds = cardIdsParam
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
  } else if (cardIdParam) {
    const id = Number(cardIdParam);
    if (Number.isInteger(id) && id > 0) cardIds = [id];
  }

  if (cardIds.length === 0) {
    return NextResponse.json(
      { error: "Query cardId or cardIds is required and must be positive integer(s)" },
      { status: 400 }
    );
  }

  const result = await prisma.watchlistItem.deleteMany({
    where: { userId: auth.user.id, cardId: { in: cardIds } },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, removed: result.count });
});
