import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { effectiveTier, getLimits } from "@/lib/billing";
import { CreateDeckSchema } from "@/lib/decks/schemas";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async () => {
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
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreateDeckSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  const name = body.name;

  const tier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(tier);
  if (limits.deckCount !== Infinity) {
    const count = await prisma.deck.count({ where: { userId: auth.user.id } });
    if (count >= limits.deckCount) {
      return NextResponse.json(
        { error: `Deck limit reached (${limits.deckCount})` },
        { status: 403 }
      );
    }
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
});
