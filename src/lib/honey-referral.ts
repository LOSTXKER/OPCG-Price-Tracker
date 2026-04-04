import { prisma } from "@/lib/db";
import { earnHoney, earnHoneyDirect } from "@/lib/honey";
import { startOfToday } from "@/lib/honey-utils";
import { randomBytes } from "crypto";

function generateCode(): string {
  return randomBytes(4).toString("hex");
}

/**
 * Get or create a referral link for a user.
 * Each user gets exactly one referral code.
 */
export async function getOrCreateReferralLink(userId: string) {
  const existing = await prisma.referralLink.findFirst({
    where: { userId },
  });
  if (existing) return existing;

  const code = generateCode();
  return prisma.referralLink.create({
    data: { userId, code },
  });
}

/**
 * Also ensure the user has a referralCode on their profile
 * (quick lookup without joining ReferralLink).
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (user.referralCode) return user.referralCode;

  const link = await getOrCreateReferralLink(userId);
  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: link.code },
  });
  return link.code;
}

/**
 * Record a click on a referral link. Deduplicates by IP per link per day.
 * Returns the link owner's userId.
 */
export async function recordReferralClick(
  code: string,
  visitorIp?: string,
  userAgent?: string,
): Promise<{ userId: string } | null> {
  const link = await prisma.referralLink.findUnique({
    where: { code },
    select: { id: true, userId: true },
  });
  if (!link) return null;

  if (visitorIp) {
    const duplicate = await prisma.referralClick.findFirst({
      where: { linkId: link.id, visitorIp, createdAt: { gte: startOfToday() } },
    });
    if (duplicate) return { userId: link.userId };
  }

  await prisma.$transaction([
    prisma.referralClick.create({
      data: { linkId: link.id, visitorIp, userAgent },
    }),
    prisma.referralLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    }),
  ]);

  return { userId: link.userId };
}

/**
 * Process referral conversion when a new user signs up via a referral code.
 * Grants 100 Honey to the referrer and 50 Honey to the new user.
 * Returns false if the code is invalid or the reward was already granted.
 */
export async function processReferralConversion(
  newUserId: string,
  referralCode: string,
): Promise<boolean> {
  const referrer = await prisma.user.findFirst({
    where: { referralCode },
    select: { id: true },
  });
  if (!referrer || referrer.id === newUserId) return false;

  const alreadyRewarded = await prisma.honeyTransaction.findFirst({
    where: {
      userId: referrer.id,
      type: "REFERRAL",
      metadata: { path: ["referredUserId"], equals: newUserId },
    },
  });
  if (alreadyRewarded) return false;

  await earnHoney(referrer.id, "REFERRAL", "Referral: new user signed up", {
    referredUserId: newUserId,
    referralCode,
  });

  await earnHoneyDirect(newUserId, "REFERRAL", 50, "Welcome bonus: signed up via referral", {
    referrerId: referrer.id,
    referralCode,
  });

  return true;
}

/**
 * Get referral stats for a user.
 */
export async function getReferralStats(userId: string) {
  const link = await getOrCreateReferralLink(userId);

  const [todayClicks, conversionAgg] = await Promise.all([
    prisma.referralClick.count({
      where: { linkId: link.id, createdAt: { gte: startOfToday() } },
    }),
    prisma.honeyTransaction.aggregate({
      where: { userId, type: "REFERRAL", amount: { gt: 0 } },
      _count: true,
      _sum: { amount: true },
    }),
  ]);

  return {
    code: link.code,
    totalClicks: link.clicks,
    todayClicks,
    totalConversions: conversionAgg._count,
    totalEarned: conversionAgg._sum.amount ?? 0,
  };
}
