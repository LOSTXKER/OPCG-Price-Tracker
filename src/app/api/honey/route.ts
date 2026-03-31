import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { earnHoney, earnHoneyDirect, canCheckinToday, spendHoney, getHoneyMultiplier } from "@/lib/honey";
import { fulfillRedemption } from "@/lib/honey-fulfillment";
import { getHoneyLevel } from "@/lib/honey-levels";

export async function GET() {
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
}

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const parsed = await parseJsonBody<{
    action: string;
    itemId?: number;
    recipientId?: string;
    amount?: number;
  }>(request as never);
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

  if (body.action === "gift") {
    const { recipientId, amount } = body;
    if (!recipientId || typeof recipientId !== "string") {
      return NextResponse.json({ error: "recipientId required" }, { status: 400 });
    }
    if (!amount || !Number.isInteger(amount) || amount < 1) {
      return NextResponse.json({ error: "amount must be a positive integer" }, { status: 400 });
    }
    if (recipientId === user.id) {
      return NextResponse.json({ error: "Cannot gift to yourself" }, { status: 400 });
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    const spend = await spendHoney(user.id, amount, `Gift to ${recipient.displayName ?? recipient.email}`, {
      recipientId,
      giftAmount: amount,
    });
    if (!spend.success) {
      return NextResponse.json({ error: "Insufficient honey" }, { status: 400 });
    }

    await prisma.honeyTransaction.create({
      data: {
        userId: user.id,
        amount: -amount,
        type: "GIFT_SEND",
        reason: `Gift to ${recipient.displayName ?? recipient.email}`,
        metadata: { recipientId, giftAmount: amount },
      },
    });

    await earnHoneyDirect(recipientId, "GIFT_RECEIVE", amount, `Gift from ${user.displayName ?? user.email}`, {
      senderId: user.id,
      giftAmount: amount,
    });

    return NextResponse.json({ success: true, total: spend.total });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
