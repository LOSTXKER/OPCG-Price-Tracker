import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from "@/lib/honey";

export const POST = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const parsed = await parseJsonBody<{ cardId: number; priceThb: number }>(request as never);
  if (!parsed.ok) return parsed.response;
  const { cardId, priceThb } = parsed.body;

  if (!Number.isInteger(cardId) || !Number.isFinite(priceThb) || priceThb <= 0) {
    return NextResponse.json({ error: "Invalid cardId or priceThb" }, { status: 400 });
  }

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const price = await prisma.communityPrice.create({
    data: { userId: user.id, cardId, priceThb: Math.round(priceThb) },
  });

  earnHoney(
    user.id,
    "COMMUNITY_PRICE",
    "Reported community price",
    { cardId, communityPriceId: price.id },
    getHoneyMultiplier(user.tier, user.tierExpiresAt),
  ).catch(() => {});

  return NextResponse.json({ price }, { status: 201 });
});
