import { requireAuthUser, getAuthUser } from "@/lib/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from "@/lib/honey";
import { createLog } from "@/lib/logger";
import { UpdateDeckSchema } from "@/lib/decks/schemas";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:decks");

export const GET = apiHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const deckId = parseInt(id, 10);
  if (isNaN(deckId)) {
    return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
  }

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: {
      leader: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, imageUrl: true, latestPriceJpy: true, rarity: true } },
      cards: {
        include: {
          card: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, rarity: true, imageUrl: true, latestPriceJpy: true, cardType: true } },
        },
      },
      user: { select: { displayName: true, avatarUrl: true } },
    },
  });

  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }

  if (!deck.isPublic) {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (deck.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json({ deck });
});

export const PATCH = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const deckId = parseInt(id, 10);
  if (isNaN(deckId)) {
    return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
  }

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const existing = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!existing || existing.userId !== auth.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, UpdateDeckSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  await prisma.$transaction([
    ...(body.removeCardIds?.length
      ? [prisma.deckCard.deleteMany({ where: { deckId, cardId: { in: body.removeCardIds } } })]
      : []),
    ...(body.addCards?.map((c) =>
      prisma.deckCard.upsert({
        where: { deckId_cardId: { deckId, cardId: c.cardId } },
        update: { quantity: c.quantity ?? 1 },
        create: { deckId, cardId: c.cardId, quantity: c.quantity ?? 1 },
      })
    ) ?? []),
  ]);

  const deck = await prisma.deck.update({
    where: { id: deckId },
    data: {
      ...(body.name ? { name: body.name } : {}),
      ...(body.leaderId !== undefined ? { leaderId: body.leaderId } : {}),
      ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
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

  if (body.isPublic === true && !existing.isPublic) {
    // Use idempotencyKey on the honey transaction for race-safe single-grant
    // semantics; if the same deck flips public→private→public, the user is
    // not paid twice.
    try {
      await earnHoney(
        auth.user.id,
        "DECK_SHARE",
        "Shared deck publicly",
        { deckId },
        getHoneyMultiplier(auth.user.tier, auth.user.tierExpiresAt),
        { idempotencyKey: `deck-share:${deckId}` },
      );
    } catch (err) {
      log.error("earnHoney DECK_SHARE", err);
    }
  }

  return NextResponse.json({ deck });
});

export const DELETE = apiHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const deckId = parseInt(id, 10);
  if (isNaN(deckId)) {
    return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
  }

  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const existing = await prisma.deck.findUnique({ where: { id: deckId } });
  if (!existing || existing.userId !== auth.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.deck.delete({ where: { id: deckId } });
  return NextResponse.json({ ok: true });
});
