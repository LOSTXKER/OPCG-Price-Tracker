import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { HoneyActionType, UserTier } from "@/generated/prisma/client";
import { checkLevelUp } from "./levels";
import { getLimits, effectiveTier } from "@/lib/tier";
import { startOfToday } from "./utils";
import { createLog } from "@/lib/logger";
import {
  HoneyTransactionMetadataSchema,
  type HoneyTransactionMetadata,
} from "./schemas";
import { assertNotDeprecatedHoneyActionType } from "./deprecated";

const log = createLog("honey");

/**
 * Validate metadata at write time. Returns the schema-cleaned object as
 * a Prisma JSON value, or `undefined` if the input is empty or invalid.
 *
 * Invalid shapes are dropped (with a warning) so a malformed metadata
 * object never blocks a ledger write — the row still lands without
 * metadata so honey accounting stays correct.
 */
function serializeMetadata(
  metadata: HoneyTransactionMetadata | undefined,
): Prisma.InputJsonValue | undefined {
  if (!metadata) return undefined;
  const parsed = HoneyTransactionMetadataSchema.safeParse(metadata);
  if (!parsed.success) {
    log.warn("invalid HoneyTransaction.metadata dropped", {
      issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
    return undefined;
  }
  return parsed.data as Prisma.InputJsonValue;
}

/**
 * ────────────────────────────────────────────────────────────────────
 * Honey Economy Rebalance v2
 * ────────────────────────────────────────────────────────────────────
 * Single source of truth for the earning side of the honey ledger.
 * See doc/honey-economy-rebalance.md for the design narrative.
 *
 * - Every grant ultimately flows through `grantHoney`. That keeps
 *   `honeyLifetimeEarned` and the level/achievement triggers in sync.
 * - `earnHoney(type, ...)` looks up the base in `HONEY_REWARDS` and
 *   applies the policy from `MULTIPLIER_POLICY` (tier × seasonal,
 *   tier-only, or none).
 * - `earnHoneyDirect(type, amount, ...)` is for actions whose payout
 *   is not in `HONEY_REWARDS` (achievements, leaderboard, raffle
 *   wins, level-up bonuses, etc.). Those are explicitly excluded
 *   from multipliers per the policy table.
 *
 * Pacing target: an "Active" persona reaches a 30-day Pro Pass
 * (8,000 honey) in ~6–8 months. Numbers below are calibrated to
 * that target and should only be tuned together.
 */
const HONEY_REWARDS: Partial<Record<HoneyActionType, number>> = {
  CHECKIN: 5,
  MARKETPLACE_SELL: 25,
  REVIEW: 5,
  REFERRAL: 150,
  REFERRAL_WELCOME: 30,
  TRIAL_BONUS: 30,
  PRICE_PREDICTION: 15,
  DECK_SHARE: 20,
  COMMUNITY_PRICE: 8,
  ONBOARDING: 100,
  BUYER_PURCHASE: 30,
  // ── Non-multiplied payout amounts referenced by lib/honey/* helpers ──
  // (kept here so reward sources are discoverable in one place; these
  // entries are intentionally NOT routed through `earnHoney` because
  // they bypass the policy table — see callers in missions.ts, levels.ts,
  // referral.ts, and the resolve-predictions cron.)
  MILESTONE_STREAK_7: 25,
  MILESTONE_STREAK_30: 100,
};

/** Per-day caps on individual action types. Pairs with `GLOBAL_DAILY_CAP`. */
const DAILY_LIMITS: Partial<Record<HoneyActionType, number>> = {
  REVIEW: 3,
  COMMUNITY_PRICE: 3,
  MARKETPLACE_SELL: 5,
  DECK_SHARE: 2,
};

/**
 * Combined per-day ceiling on "farmable" sources (auto-paid actions
 * a user can spam). Designed so a power user maxes out around the
 * Engaged persona's natural rate without truly hard-walling them on
 * one bad outlier day.
 *
 * Excluded by design: REFERRAL, REFERRAL_WELCOME, ACHIEVEMENT,
 * LEVEL_UP, LEADERBOARD_REWARD, RAFFLE_*, MILESTONE_STREAK_*,
 * WEEKLY_BONUS, MONTHLY_PERFECT_BONUS.
 */
export const GLOBAL_DAILY_CAP = 200;

const GLOBAL_CAP_TYPES: ReadonlySet<HoneyActionType> = new Set<HoneyActionType>([
  "CHECKIN",
  "MARKETPLACE_SELL",
  "REVIEW",
  "COMMUNITY_PRICE",
  "DECK_SHARE",
  "PRICE_PREDICTION",
  "BUYER_PURCHASE",
  "DAILY_MISSION",
  "WEEKLY_MISSION",
  "MONTHLY_MISSION",
]);

/**
 * Multiplier policy. Where each action sits decides which multipliers
 * stack on top of the base reward. Single source of truth so you can
 * grep one table to answer "is this affected by seasonal × ?".
 */
export type MultiplierPolicy = "tier_and_seasonal" | "tier_only" | "none";

const MULTIPLIER_POLICY: Record<HoneyActionType, MultiplierPolicy> = {
  // tier × seasonal: routine engagement actions
  CHECKIN: "tier_and_seasonal",
  MARKETPLACE_SELL: "tier_and_seasonal",
  REVIEW: "tier_and_seasonal",
  COMMUNITY_PRICE: "tier_and_seasonal",
  DECK_SHARE: "tier_and_seasonal",
  ONBOARDING: "tier_and_seasonal",
  TRIAL_BONUS: "tier_and_seasonal",
  REFERRAL: "tier_and_seasonal",
  REFERRAL_WELCOME: "tier_and_seasonal",
  PRICE_PREDICTION: "tier_and_seasonal",
  BUYER_PURCHASE: "tier_and_seasonal",
  DAILY_MISSION: "tier_and_seasonal",
  WEEKLY_MISSION: "tier_and_seasonal",
  // tier-only: rare event payouts that we don't want to seasonal-2x
  WEEKLY_BONUS: "tier_only",
  MONTHLY_MISSION: "tier_only",
  MONTHLY_PERFECT_BONUS: "tier_only",
  // no multipliers: one-shots, special grants, ledger admin events
  ACHIEVEMENT: "none",
  LEVEL_UP: "none",
  LEADERBOARD_REWARD: "none",
  RAFFLE_TICKET: "none",
  RAFFLE_WIN: "none",
  ADMIN_GRANT: "none",
  REDEEM: "none",
  EXPIRED: "none",
  MILESTONE_STREAK_7: "none",
  MILESTONE_STREAK_30: "none",
  // legacy / deprecated codes — kept so prisma's exhaustiveness check
  // doesn't break older transaction rows. New code should not pay these.
  PORTFOLIO_ADD: "none",
  GIFT_SEND: "none",
  GIFT_RECEIVE: "none",
  LUCKY_DRAW: "none",
  FIRST_PURCHASE: "none",
  SHARE: "none",
  AFFILIATE: "none",
};

/**
 * Streak multiplier ladder. Currently:
 *   - streak < 7   → 1×
 *   - streak ≥ 7   → 2×
 *   - streak ≥ 30  → 3×
 *
 * If the ladder shape changes, update this single function — historic
 * code referenced a `STREAK_MULTIPLIER` lookup table that duplicated
 * the same thresholds; that constant has been removed.
 */
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
 * Sum of today's positive honey grants for the action types subject to the
 * global daily cap. Used to clamp further grants so a power user can't
 * exceed `GLOBAL_DAILY_CAP` from farmable sources in a single day.
 */
async function getGlobalCappedTodayTotal(userId: string): Promise<number> {
  const result = await prisma.honeyTransaction.aggregate({
    where: {
      userId,
      amount: { gt: 0 },
      type: { in: Array.from(GLOBAL_CAP_TYPES) as HoneyActionType[] },
      createdAt: { gte: startOfToday() },
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/**
 * If `type` is subject to the global daily cap, return how many honey
 * the user is still allowed to earn today from capped sources. Returns
 * `Infinity` (i.e. unrestricted) for sources outside the cap.
 */
async function remainingGlobalCap(
  userId: string,
  type: HoneyActionType,
): Promise<number> {
  if (!GLOBAL_CAP_TYPES.has(type)) return Number.POSITIVE_INFINITY;
  const used = await getGlobalCappedTodayTotal(userId);
  return Math.max(0, GLOBAL_DAILY_CAP - used);
}

/**
 * Action types that should NOT trigger an achievement re-check after the
 * honey ledger writes. ACHIEVEMENT itself would recurse; LEVEL_UP fires from
 * within grantHoney already; admin/spend/expiry events shouldn't progress
 * achievements either.
 */
const ACHIEVEMENT_CHECK_SKIP_TYPES = new Set<HoneyActionType>([
  "ACHIEVEMENT",
  "LEVEL_UP",
  "REDEEM",
  "EXPIRED",
  // ADMIN_GRANT now flows through grantHoney (so lifetime stays in sync) and
  // SHOULD trigger achievement re-checks — admin grants legitimately move
  // users across `honey_lifetime_*` thresholds.
]);

/**
 * Fire-and-forget achievement re-check after honey activity. Uses a dynamic
 * import to break the static cycle between `index.ts` and `achievements.ts`
 * (achievements.ts depends on `earnHoneyDirect` from this module to pay out
 * achievement rewards).
 */
function fireAchievementCheck(userId: string): void {
  void (async () => {
    try {
      const { checkAchievements } = await import("./achievements");
      await checkAchievements(userId);
    } catch (err) {
      console.error("[honey] achievement check failed for", userId, err);
    }
  })();
}

/**
 * Core ledger operation: update user balance + create transaction.
 * All honey grants/spends should flow through this.
 * Automatically checks for level-up bonuses on positive grants.
 *
 * Atomic: balance + ledger row are written in a single Prisma transaction
 * so a partial failure cannot orphan the user's balance from the ledger.
 *
 * `idempotencyKey` (optional) — when supplied, a unique constraint on
 * `HoneyTransaction.idempotencyKey` prevents double-grants under
 * concurrency. P2002 is treated as "already granted" and resolved by
 * returning the user's current balance instead of throwing.
 */
export async function grantHoney(
  userId: string,
  amount: number,
  type: HoneyActionType,
  reason: string,
  metadata?: HoneyTransactionMetadata,
  options?: {
    skipLevelCheck?: boolean;
    skipAchievementCheck?: boolean;
    idempotencyKey?: string;
  },
): Promise<{ earned: number; total: number }> {
  assertNotDeprecatedHoneyActionType(type);
  let updated: { honeyPoints: number; honeyLifetimeEarned: number };
  let oldLifetime = 0;
  try {
    const result = await prisma.$transaction(async (tx) => {
      const before = amount > 0
        ? await tx.user.findUniqueOrThrow({
            where: { id: userId },
            select: { honeyLifetimeEarned: true },
          })
        : { honeyLifetimeEarned: 0 };

      const after = await tx.user.update({
        where: { id: userId },
        data: {
          honeyPoints: { increment: amount },
          ...(amount > 0 ? { honeyLifetimeEarned: { increment: amount } } : {}),
        },
        select: { honeyPoints: true, honeyLifetimeEarned: true },
      });

      await tx.honeyTransaction.create({
        data: {
          userId,
          amount,
          type,
          reason,
          metadata: serializeMetadata(metadata),
          ...(options?.idempotencyKey
            ? { idempotencyKey: options.idempotencyKey }
            : {}),
        },
      });

      return { before, after };
    });
    oldLifetime = result.before.honeyLifetimeEarned;
    updated = result.after;
  } catch (err) {
    if (
      options?.idempotencyKey &&
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      // Idempotent retry — already granted; return current balance and exit.
      const u = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { honeyPoints: true },
      });
      return { earned: 0, total: u.honeyPoints };
    }
    throw err;
  }

  if (amount > 0 && type !== "LEVEL_UP" && !options?.skipLevelCheck) {
    const levelUp = checkLevelUp(oldLifetime, updated.honeyLifetimeEarned);
    if (levelUp) {
      await grantHoney(
        userId, levelUp.bonus, "LEVEL_UP", `Level up: ${levelUp.label}`,
        { level: levelUp.level, label: levelUp.label },
        { skipLevelCheck: true, skipAchievementCheck: true },
      );

      // Best-effort in-app/email/LINE ping. Imported lazily so the
      // honey lib doesn't pull `notify` (which loads email/LINE clients)
      // into modules that only call grantHoney for ledger writes.
      void import("@/lib/notify/dispatch")
        .then(({ notify }) =>
          notify({
            userId,
            kind: "HONEY",
            type: "LEVEL_UP",
            title: `Level up — ${levelUp.label}!`,
            message: `You reached level ${levelUp.level} and earned ${levelUp.bonus} bonus honey.`,
            data: { level: levelUp.level, label: levelUp.label, bonus: levelUp.bonus },
            dedupKey: `level-up:${levelUp.level}`,
          }),
        )
        .catch(() => {});
    }
  }

  if (
    amount > 0 &&
    !options?.skipAchievementCheck &&
    !ACHIEVEMENT_CHECK_SKIP_TYPES.has(type)
  ) {
    fireAchievementCheck(userId);
  }

  return { earned: amount, total: updated.honeyPoints };
}

/**
 * Public helper: trigger an achievement re-check from non-honey-earning
 * actions (e.g. portfolio item add, watchlist add, prediction create).
 * Fire-and-forget — never blocks the calling request.
 */
export function triggerAchievementCheck(userId: string): void {
  fireAchievementCheck(userId);
}

/**
 * Earn honey using the base from `HONEY_REWARDS` and the policy from
 * `MULTIPLIER_POLICY`. Returns null if:
 *   - the action has no base reward
 *   - the per-action daily limit is reached
 *   - the global daily cap is reached for capped action types
 *
 * `tierMultiplier` is the caller-supplied multiplier (typically the
 * result of `getHoneyMultiplier(user.tier, user.tierExpiresAt)`). It is
 * only applied for actions whose policy is `tier_and_seasonal` or
 * `tier_only`. Passing it for a `none` policy is a no-op.
 */
export async function earnHoney(
  userId: string,
  type: HoneyActionType,
  reason: string,
  metadata?: HoneyTransactionMetadata,
  tierMultiplier: number = 1,
  options?: { idempotencyKey?: string },
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

  const policy = MULTIPLIER_POLICY[type];
  const seasonalMultiplier = policy === "tier_and_seasonal" ? await getSeasonalMultiplier() : 1;
  const effectiveTier = policy === "none" ? 1 : tierMultiplier;

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
    const previousStreak = isConsecutive ? user.checkinStreak : 0;

    const rawAmount = Math.round(baseAmount * getStreakMultiplier(streak) * effectiveTier * seasonalMultiplier);
    const cap = await remainingGlobalCap(userId, type);
    const amount = Math.min(rawAmount, cap);
    if (amount <= 0) return null;

    await prisma.user.update({
      where: { id: userId },
      data: { lastCheckinAt: now, checkinStreak: streak },
    });

    const result = await grantHoney(userId, amount, type, reason, metadata ?? { streak, tierMultiplier });

    // Streak milestone one-shots — paid only when this check-in is the one
    // that crosses the threshold (not on every subsequent day at that level).
    if (previousStreak < 7 && streak >= 7) {
      const milestone = HONEY_REWARDS.MILESTONE_STREAK_7 ?? 0;
      if (milestone > 0) {
        await grantHoney(userId, milestone, "MILESTONE_STREAK_7", "Streak milestone: 7 days", { streak });
      }
    }
    if (previousStreak < 30 && streak >= 30) {
      const milestone = HONEY_REWARDS.MILESTONE_STREAK_30 ?? 0;
      if (milestone > 0) {
        await grantHoney(userId, milestone, "MILESTONE_STREAK_30", "Streak milestone: 30 days", { streak });
      }
    }

    return result;
  }

  const rawAmount = Math.round(baseAmount * effectiveTier * seasonalMultiplier);
  const cap = await remainingGlobalCap(userId, type);
  const amount = Math.min(rawAmount, cap);
  if (amount <= 0) return null;

  return grantHoney(userId, amount, type, reason, metadata, {
    idempotencyKey: options?.idempotencyKey,
  });
}

/**
 * Grant a specific honey amount directly. Used for action types whose
 * payout is computed elsewhere (achievements, level-up, leaderboard,
 * raffle wins, mission claims) and which are excluded from multipliers
 * by `MULTIPLIER_POLICY`.
 *
 * `applyGlobalCap` (default true for `GLOBAL_CAP_TYPES`, false otherwise)
 * — clamps the grant to whatever room the user has left under the
 * `GLOBAL_DAILY_CAP` for farmable sources. Mission claim paths
 * (`DAILY_MISSION` / `WEEKLY_MISSION` / `MONTHLY_MISSION`) MUST honor
 * the cap; one-off events (achievement, level-up, leaderboard, raffle)
 * are exempt by virtue of not being in `GLOBAL_CAP_TYPES`.
 *
 * `idempotencyKey` (optional) — passes through to `grantHoney` and
 * relies on the unique constraint on `HoneyTransaction.idempotencyKey`
 * to make concurrent retries safe.
 */
export async function earnHoneyDirect(
  userId: string,
  type: HoneyActionType,
  amount: number,
  reason: string,
  metadata?: HoneyTransactionMetadata,
  options?: { applyGlobalCap?: boolean; idempotencyKey?: string },
): Promise<{ earned: number; total: number }> {
  const shouldCap = options?.applyGlobalCap ?? GLOBAL_CAP_TYPES.has(type);
  let finalAmount = amount;
  if (shouldCap && amount > 0) {
    const cap = await remainingGlobalCap(userId, type);
    finalAmount = Math.min(amount, cap);
    if (finalAmount <= 0) {
      const u = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { honeyPoints: true },
      });
      return { earned: 0, total: u.honeyPoints };
    }
  }
  return grantHoney(userId, finalAmount, type, reason, metadata, {
    idempotencyKey: options?.idempotencyKey,
  });
}

/**
 * Atomic spend: decrements balance and writes the ledger row in one
 * transaction, with `updateMany({ honeyPoints: { gte: amount } })` as a
 * conditional check so concurrent spends cannot drive the balance negative.
 */
export async function spendHoney(
  userId: string,
  amount: number,
  reason: string,
  metadata?: HoneyTransactionMetadata,
  type: HoneyActionType = "REDEEM",
): Promise<{ success: boolean; total: number }> {
  if (amount <= 0) {
    const u = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { honeyPoints: true },
    });
    return { success: false, total: u.honeyPoints };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const updateResult = await tx.user.updateMany({
        where: { id: userId, honeyPoints: { gte: amount } },
        data: { honeyPoints: { decrement: amount } },
      });

      if (updateResult.count === 0) {
        const u = await tx.user.findUniqueOrThrow({
          where: { id: userId },
          select: { honeyPoints: true },
        });
        return { success: false, total: u.honeyPoints };
      }

      const after = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { honeyPoints: true },
      });

      await tx.honeyTransaction.create({
        data: {
          userId,
          amount: -amount,
          type,
          reason,
          metadata: serializeMetadata(metadata),
        },
      });

      return { success: true, total: after.honeyPoints };
    });
  } catch (err) {
    throw err;
  }
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

/** Exposed for tests and the documentation generator. */
export {
  HONEY_REWARDS,
  DAILY_LIMITS,
  getStreakMultiplier,
  MULTIPLIER_POLICY,
  GLOBAL_CAP_TYPES,
};
