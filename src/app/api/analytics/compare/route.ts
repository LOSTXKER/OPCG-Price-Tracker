import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { effectiveTier, getLimits } from "@/lib/tier";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const tier = effectiveTier(user.tier, user.tierExpiresAt);
  const limits = getLimits(tier);

  const cardsParam = request.nextUrl.searchParams.get("cards") ?? "";
  const cardCodes = cardsParam.split(",").filter(Boolean);

  if (cardCodes.length === 0) {
    return NextResponse.json({ error: "No cards specified" }, { status: 400 });
  }

  if (limits.compareCards !== Infinity && cardCodes.length > limits.compareCards) {
    return NextResponse.json(
      { error: `Your plan supports comparing up to ${limits.compareCards} cards` },
      { status: 403 },
    );
  }

  const daysParam = request.nextUrl.searchParams.get("days");
  const requestedDays = daysParam ? parseInt(daysParam, 10) : 90;
  const days = Math.min(requestedDays, limits.priceHistoryDays === Infinity ? 9999 : limits.priceHistoryDays);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const cards = await prisma.card.findMany({
    where: { cardCode: { in: cardCodes } },
    select: {
      id: true,
      cardCode: true,
      nameJp: true,
      nameEn: true,
      nameTh: true,
      rarity: true,
      cardType: true,
      color: true,
      cost: true,
      power: true,
      counter: true,
      life: true,
      attribute: true,
      trait: true,
      isParallel: true,
      latestPriceJpy: true,
      latestPriceThb: true,
      priceChange24h: true,
      priceChange7d: true,
      priceChange30d: true,
      imageUrl: true,
      set: { select: { code: true, nameEn: true, name: true } },
      prices: {
        where: { scrapedAt: { gte: since } },
        orderBy: { scrapedAt: "asc" },
        select: { priceJpy: true, scrapedAt: true, source: true },
      },
    },
  });

  const result = cards.map((card) => ({
    cardCode: card.cardCode,
    nameJp: card.nameJp,
    nameEn: card.nameEn,
    nameTh: card.nameTh,
    rarity: card.rarity,
    cardType: card.cardType,
    color: card.color,
    cost: card.cost,
    power: card.power,
    counter: card.counter,
    life: card.life,
    attribute: card.attribute,
    trait: card.trait,
    isParallel: card.isParallel,
    imageUrl: card.imageUrl,
    setCode: card.set.code,
    setName: card.set.nameEn ?? card.set.name,
    currentPrice: card.latestPriceJpy,
    currentPriceThb: card.latestPriceThb,
    change24h: card.priceChange24h,
    change7d: card.priceChange7d,
    change30d: card.priceChange30d,
    priceHistory: card.prices.map((p) => ({
      price: p.priceJpy,
      date: p.scrapedAt.toISOString().slice(0, 10),
      source: p.source,
    })),
  }));

  return NextResponse.json({ cards: result, days });
}
