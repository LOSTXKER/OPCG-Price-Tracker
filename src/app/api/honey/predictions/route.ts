import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { getWeekStart } from "@/lib/honey-utils";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const predictions = await prisma.pricePrediction.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      card: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, imageUrl: true, latestPriceJpy: true } },
    },
  });

  return NextResponse.json({ predictions });
});

export const POST = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{ cardId: number; direction: "UP" | "DOWN" }>(request);
  if (!parsed.ok) return parsed.response;
  const { cardId, direction } = parsed.body;

  if (!["UP", "DOWN"].includes(direction)) {
    return NextResponse.json({ error: "direction must be UP or DOWN" }, { status: 400 });
  }

  const card = await prisma.card.findUnique({ where: { id: cardId }, select: { latestPriceJpy: true } });
  if (!card || card.latestPriceJpy == null) {
    return NextResponse.json({ error: "Card not found or no price data" }, { status: 404 });
  }

  const weekStart = getWeekStart();

  const thisWeekCount = await prisma.pricePrediction.count({
    where: { userId: auth.user.id, weekStart },
  });
  if (thisWeekCount >= 3) {
    return NextResponse.json({ error: "Max 3 predictions per week" }, { status: 400 });
  }

  const existing = await prisma.pricePrediction.findUnique({
    where: { userId_cardId_weekStart: { userId: auth.user.id, cardId, weekStart } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already predicted for this card this week" }, { status: 400 });
  }

  const prediction = await prisma.pricePrediction.create({
    data: {
      userId: auth.user.id,
      cardId,
      direction,
      priceAtPrediction: card.latestPriceJpy,
      weekStart,
    },
  });

  return NextResponse.json({ prediction }, { status: 201 });
});
