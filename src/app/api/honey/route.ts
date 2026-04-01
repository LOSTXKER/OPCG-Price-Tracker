import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { earnHoney, canCheckinToday, spendHoney, getHoneyMultiplier } from "@/lib/honey";
import { fulfillRedemption } from "@/lib/honey-fulfillment";
import { getHoneyLevel } from "@/lib/honey-levels";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const [canCheckin, recentTx] = await Promise.all([
    canCheckinToday(user.id),
    prisma.honeyTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, amount: true, type: true, reason: true, createdAt: true },
    }),
  ]);

  const activeEvent = await prisma.seasonalEvent.findFirst({
    where: { isActive: true, startDate: { lte: new Date() }, endDate: { gte: new Date() } },
    select: { name: true, nameEn: true, nameTh: true, honeyMultiplier: true, endDate: true },
  });

  const level = getHoneyLevel(user.honeyLifetimeEarned);

  return NextResponse.json({
    honeyPoints: user.honeyPoints,
    checkinStreak: user.checkinStreak,
    canCheckin,
    recentTransactions: recentTx,
    level,
    activeEvent,
    onboardingCompleted: user.onboardingCompleted,
  });
});

export const POST = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const parsed = await parseJsonBody<{
    action: string;
    itemId?: number;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (body.action === "checkin") {
    const can = await canCheckinToday(user.id);
    if (!can) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 400 });
    }

    const result = await earnHoney(
      user.id,
      "CHECKIN",
      "Daily check-in",
      undefined,
      getHoneyMultiplier(user.tier, user.tierExpiresAt),
    );
    if (!result) {
      return NextResponse.json({ error: "Check-in failed" }, { status: 500 });
    }

    return NextResponse.json({
      earned: result.earned,
      total: result.total,
      streak: (await prisma.user.findUnique({ where: { id: user.id }, select: { checkinStreak: true } }))?.checkinStreak ?? 1,
    });
  }

  if (body.action === "redeem" && body.itemId) {
    const item = await prisma.honeyShopItem.findUnique({
      where: { id: body.itemId },
    });

    if (!item || !item.isActive) {
      return NextResponse.json({ error: "Item not available" }, { status: 404 });
    }

    if (item.stock != null && item.stock <= 0) {
      return NextResponse.json({ error: "Out of stock" }, { status: 400 });
    }

    const result = await spendHoney(
      user.id,
      item.cost,
      `Redeemed: ${item.name}`,
      { itemId: item.id, itemType: item.type },
    );

    if (!result.success) {
      return NextResponse.json({ error: "Insufficient honey", required: item.cost, current: result.total }, { status: 400 });
    }

    if (item.stock != null) {
      await prisma.honeyShopItem.update({
        where: { id: item.id },
        data: { stock: { decrement: 1 } },
      });
    }

    await fulfillRedemption(user.id, item);

    return NextResponse.json({ success: true, total: result.total });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});
