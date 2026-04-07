import { prisma } from "@/lib/db";
import type { HoneyActionType, Prisma, UserTier } from "@/generated/prisma/client";
import { checkLevelUp } from "./levels";
import { getLimits, effectiveTier } from "@/lib/tier";
import { startOfToday } from "./utils";

const HONEY_REWARDS: Partial<Record<HoneyActionType, number>> = {
  CHECKIN: 10,
  MARKETPLACE_SELL: 20,
  REVIEW: 5,
  REFERRAL: 100,
  TRIAL_BONUS: 30,
  DAILY_MISSION: 15,
  PRICE_PREDICTION: 20,
  DECK_SHARE: 15,
  COMMUNITY_PRICE: 10,
  ONBOARDING: 50,
  ACHIEVEMENT: 0,
  RAFFLE_TICKET: 0,
  RAFFLE_WIN: 0,
};

const DAILY_LIMITS: Partial<Record<HoneyActionType, number>> = {
  REVIEW: 5,
  COMMUNITY_PRICE: 5,
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

async function getSeasonalMultiplier(): Promise<number> {
  const now = new Date();
  const event = await prisma.seasonalEvent.findFirst({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    select: { honeyMultiplier: true },
  });
  return event?.honeyMultiplier ?? 1;
}

/**
 * Core ledger operation: update user balance + create transaction.
 * All honey grants/spends should flow through this.
 * Automatically checks for level-up bonuses on positive grants.
 */
export async function grantHoney(
  userId: string,
  amount: number,
  type: HoneyActionType,
  reason: string,
  metadata?: Record<string, unknown>,
  options?: { skipLevelCheck?: boolean },
): Promise<{ earned: number; total: number }> {
  const oldLifetime = amount > 0
    ? (await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { honeyLifetimeEarned: true } })).honeyLifetimeEarned
    : 0;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      honeyPoints: { increment: amount },
      ...(amount > 0 ? { honeyLifetimeEarned: { increment: amount } } : {}),
    },
  });

  await prisma.honeyTransaction.create({
    data: {
      userId,
      amount,
      type,
      reason,
      metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });

  if (amount > 0 && type !== "LEVEL_UP" && !options?.skipLevelCheck) {
    const levelUp = checkLevelUp(oldLifetime, updated.honeyLifetimeEarned);
    if (levelUp) {
      await grantHoney(
        userId, levelUp.bonus, "LEVEL_UP", `Level up: ${levelUp.label}`,
        { level: levelUp.level, label: levelUp.label },
        { skipLevelCheck: true },
      );
    }
  }

  return { earned: amount, total: updated.honeyPoints };
}

/**
 * Earn honey using base amount from HONEY_REWARDS, applying tier + seasonal multipliers.
 * Returns null if the action type has no base reward or the daily limit is reached.
 */
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
    const todayCount = await prisma.honeyTransaction.count({
      where: { userId, type, createdAt: { gte: startOfToday() } },
    });
    if (todayCount >= dailyLimit) return null;
  }

  const seasonalMultiplier = await getSeasonalMultiplier();

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
    const amount = Math.round(baseAmount * getStreakMultiplier(streak) * tierMultiplier * seasonalMultiplier);

    await prisma.user.update({
      where: { id: userId },
      data: { lastCheckinAt: now, checkinStreak: streak },
    });

    return grantHoney(userId, amount, type, reason, metadata ?? { streak, tierMultiplier });
  }

  const amount = Math.round(baseAmount * tierMultiplier * seasonalMultiplier);
  return grantHoney(userId, amount, type, reason, metadata);
}

/**
 * Grant a specific honey amount directly (for achievements, mission task rewards, leaderboard, etc.)
 */
export async function earnHoneyDirect(
  userId: string,
  type: HoneyActionType,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>,
): Promise<{ earned: number; total: number }> {
  return grantHoney(userId, amount, type, reason, metadata);
}

export async function spendHoney(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>,
  type: HoneyActionType = "REDEEM",
): Promise<{ success: boolean; total: number }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { honeyPoints: true },
  });

  if (user.honeyPoints < amount) {
    return { success: false, total: user.honeyPoints };
  }

  const result = await grantHoney(userId, -amount, type, reason, metadata);
  return { success: true, total: result.total };
}

export async function canCheckinToday(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastCheckinAt: true },
  });
  if (!user?.lastCheckinAt) return true;
  return new Date().toDateString() !== user.lastCheckinAt.toDateString();
}

export function getHoneyMultiplier(tier: UserTier, tierExpiresAt: Date | null): number {
  return getLimits(effectiveTier(tier, tierExpiresAt)).honeyMultiplier;
}

export { HONEY_REWARDS, STREAK_MULTIPLIER };
