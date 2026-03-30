import { prisma } from "@/lib/db";
import type { HoneyActionType, Prisma } from "@/generated/prisma/client";

const HONEY_REWARDS: Partial<Record<HoneyActionType, number>> = {
  CHECKIN: 10,
  PORTFOLIO_ADD: 10,
  MARKETPLACE_SELL: 20,
  REVIEW: 5,
  REFERRAL: 50,
  TRIAL_BONUS: 30,
};

const DAILY_LIMITS: Partial<Record<HoneyActionType, number>> = {
  PORTFOLIO_ADD: 10,
  REVIEW: 5,
};

const STREAK_MULTIPLIER: Record<number, number> = {
  7: 2,
  30: 3,
};

function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 3;
  if (streak >= 7) return 2;
  return 1;
}

export async function earnHoney(
  userId: string,
  type: HoneyActionType,
  reason: string,
  metadata?: Record<string, unknown>,
  tierMultiplier: number = 1,
): Promise<{ earned: number; total: number } | null> {
  const baseAmount = HONEY_REWARDS[type];
  if (!baseAmount) return null;

  const dailyLimit = DAILY_LIMITS[type];
  if (dailyLimit != null) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.honeyTransaction.count({
      where: { userId, type, createdAt: { gte: todayStart } },
    });
    if (todayCount >= dailyLimit) return null;
  }

  let amount = baseAmount;

  if (type === "CHECKIN") {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { checkinStreak: true, lastCheckinAt: true },
    });

    const now = new Date();
    const lastCheckin = user.lastCheckinAt;
    const isConsecutive =
      lastCheckin &&
      now.getTime() - lastCheckin.getTime() < 48 * 60 * 60 * 1000 &&
      now.toDateString() !== lastCheckin.toDateString();

    const streak = isConsecutive ? user.checkinStreak + 1 : 1;
    amount = baseAmount * getStreakMultiplier(streak) * tierMultiplier;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        honeyPoints: { increment: amount },
        lastCheckinAt: now,
        checkinStreak: streak,
      },
    });

    await prisma.honeyTransaction.create({
      data: {
        userId,
        amount,
        type,
        reason,
        metadata: (metadata ?? { streak, tierMultiplier }) as Prisma.InputJsonValue,
      },
    });

    return { earned: amount, total: updated.honeyPoints };
  }

  amount = baseAmount * tierMultiplier;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { honeyPoints: { increment: amount } },
  });

  await prisma.honeyTransaction.create({
    data: { userId, amount, type, reason, metadata: metadata as Prisma.InputJsonValue ?? undefined },
  });

  return { earned: amount, total: updated.honeyPoints };
}

export async function spendHoney(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>,
): Promise<{ success: boolean; total: number }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { honeyPoints: true },
  });

  if (user.honeyPoints < amount) {
    return { success: false, total: user.honeyPoints };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { honeyPoints: { decrement: amount } },
  });

  await prisma.honeyTransaction.create({
    data: {
      userId,
      amount: -amount,
      type: "REDEEM",
      reason,
      metadata: metadata as Prisma.InputJsonValue ?? undefined,
    },
  });

  return { success: true, total: updated.honeyPoints };
}

export async function canCheckinToday(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastCheckinAt: true },
  });
  if (!user?.lastCheckinAt) return true;
  return new Date().toDateString() !== user.lastCheckinAt.toDateString();
}

export { HONEY_REWARDS, STREAK_MULTIPLIER };
