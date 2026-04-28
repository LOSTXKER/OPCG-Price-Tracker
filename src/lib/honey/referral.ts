import { prisma } from "@/lib/db";
import { earnHoney, getHoneyMultiplier } from ".";
import { startOfToday } from "./utils";
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
 * Grants the REFERRAL bonus to the referrer (150 honey × tier × seasonal)
 * and the REFERRAL_WELCOME bonus to the new user (30 honey × tier × seasonal).
 * Returns false if the code is invalid or either reward was already granted.
 *
 * Race-safe: each grant carries a deterministic idempotency key
 * (`referral:<referrerId>:<newUserId>` and
 * `referral-welcome:<newUserId>`). The unique constraint on
 * `HoneyTransaction.idempotencyKey` collapses concurrent retries to a
 * single ledger row even if the check-then-act window overlaps.
 */
export async function processReferralConversion(
  newUserId: string,
  referralCode: string,
): Promise<boolean> {
  const referrer = await prisma.user.findFirst({
    where: { referralCode },
    select: { id: true, tier: true, tierExpiresAt: true },
  });
  if (!referrer || referrer.id === newUserId) return false;

  const result = await earnHoney(
    referrer.id,
    "REFERRAL",
    "Referral: new user signed up",
    { referredUserId: newUserId, referralCode },
    getHoneyMultiplier(referrer.tier, referrer.tierExpiresAt),
    { idempotencyKey: `referral:${referrer.id}:${newUserId}` },
  );

  // earned === 0 here means a parallel signup-flow already paid the
  // referrer (or the cap clamped to 0); stop so we don't double-grant
  // the welcome bonus on a retry.
  if (!result || result.earned === 0) return false;

  // Route the referee's welcome bonus through `earnHoney("REFERRAL_WELCOME")`
  // so it picks up tier × seasonal like the rest of the engagement table.
  // We look up the new user's tier separately so a fresh-from-trial user
  // still benefits from any seasonal event running at signup time.
  const newUser = await prisma.user.findUnique({
    where: { id: newUserId },
    select: { tier: true, tierExpiresAt: true },
  });
  if (newUser) {
    await earnHoney(
      newUserId,
      "REFERRAL_WELCOME",
      "Welcome bonus: signed up via referral",
      { referrerId: referrer.id, referralCode },
      getHoneyMultiplier(newUser.tier, newUser.tierExpiresAt),
      { idempotencyKey: `referral-welcome:${newUserId}` },
    );
  }

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
