import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { effectiveTier, getLimits } from "@/lib/tier";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const eTier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(eTier);

  if (limits.bulkPriceLookup <= 0) {
    return NextResponse.json({ error: "Bulk price check is not available on your plan" }, { status: 403 });
  }

  const parsed = await parseJsonBody<{ codes: string[] }>(request);
  if (!parsed.ok) return parsed.response;

  const codes = parsed.body.codes;
  if (!Array.isArray(codes) || codes.length === 0) {
    return NextResponse.json({ error: "codes array is required" }, { status: 400 });
  }

  const cleanCodes = codes
    .map((c) => String(c).trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 100);

  const today = new Date().toISOString().slice(0, 10);
  const usageKey = `bulk_price:${auth.user.id}:${today}`;

  const resetAt = new Date(`${today}T23:59:59.999Z`);

  const existing = await prisma.rateLimitEntry.findUnique({ where: { key: usageKey } });
  const usedToday = existing ? existing.count : 0;

  if (usedToday + cleanCodes.length > limits.bulkPriceLookup) {
    return NextResponse.json({
      error: "Daily limit reached",
      used: usedToday,
      limit: limits.bulkPriceLookup,
    }, { status: 429 });
  }

  const cards = await prisma.card.findMany({
    where: { cardCode: { in: cleanCodes } },
    select: {
      cardCode: true,
      nameJp: true,
      nameEn: true,
      nameTh: true,
      rarity: true,
      imageUrl: true,
      latestPriceJpy: true,
      latestPriceThb: true,
      priceChange24h: true,
      priceChange7d: true,
      set: { select: { code: true, name: true, nameEn: true } },
    },
  });

  await prisma.rateLimitEntry.upsert({
    where: { key: usageKey },
    update: { count: usedToday + cleanCodes.length },
    create: { key: usageKey, count: cleanCodes.length, resetAt },
  });

  // Opportunistic cleanup of expired entries (best-effort, fire-and-forget)
  prisma.rateLimitEntry.deleteMany({
    where: { resetAt: { lt: new Date() } },
  }).catch(() => {});

  const found = new Set(cards.map((c) => c.cardCode));
  const notFound = cleanCodes.filter((c) => !found.has(c));

  return NextResponse.json({
    cards,
    notFound,
    usage: { used: usedToday + cleanCodes.length, limit: limits.bulkPriceLookup },
  });
});
