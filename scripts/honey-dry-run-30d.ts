import { prisma } from "./_db";
import type { HoneyActionType } from "../src/generated/prisma/client";

/**
 * Honey rebalance v2 — 30-day dry-run simulation.
 *
 * Replays the last 30 days of `HoneyTransaction` rows under the **new**
 * v2 ruleset (rewards, daily per-action caps, global per-day cap, tier
 * & seasonal multipliers) and prints a per-user delta vs. what was
 * actually paid out historically.
 *
 * Output:
 *   - cohort totals (old vs new)
 *   - per-user delta percentiles
 *   - top-10 / bottom-10 users by absolute delta
 *
 * Assumptions / caveats:
 *   - Activity is held constant (we can't predict how players adapt).
 *   - For each transaction we use its recorded amount as ground truth
 *     for "old". For "new" we re-derive the base reward from
 *     HONEY_REWARDS, re-apply DAILY_LIMITS and GLOBAL_DAILY_CAP, and
 *     keep the multiplier inferred from the original metadata when
 *     present, falling back to 1.0.
 *   - Direct grants (ACHIEVEMENT, RAFFLE_*, LEVEL_UP, ADMIN_GRANT,
 *     LEADERBOARD_REWARD, WEEKLY_BONUS, MONTHLY_PERFECT_BONUS) are
 *     replayed at their recorded amount — they don't go through
 *     HONEY_REWARDS.
 *
 * Run with:
 *   npx tsx scripts/honey-dry-run-30d.ts
 */

// Mirrors src/lib/honey/index.ts — keep in sync if those tables change.
const HONEY_REWARDS_V2: Partial<Record<HoneyActionType, number>> = {
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
  MILESTONE_STREAK_7: 25,
  MILESTONE_STREAK_30: 100,
};

const DAILY_LIMITS_V2: Partial<Record<HoneyActionType, number>> = {
  REVIEW: 3,
  COMMUNITY_PRICE: 3,
  MARKETPLACE_SELL: 5,
  DECK_SHARE: 2,
};

const GLOBAL_DAILY_CAP_V2 = 200;

const GLOBAL_CAP_TYPES = new Set<HoneyActionType>([
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

// Action types whose payout we cannot recompute from a base rate — we
// pass them through at the recorded amount in both the old and new sums.
const PASS_THROUGH_TYPES = new Set<HoneyActionType>([
  "ACHIEVEMENT",
  "LEVEL_UP",
  "LEADERBOARD_REWARD",
  "RAFFLE_TICKET",
  "RAFFLE_WIN",
  "ADMIN_GRANT",
  "REDEEM",
  "EXPIRED",
  "WEEKLY_BONUS",
  "MONTHLY_PERFECT_BONUS",
  "DAILY_MISSION",
  "WEEKLY_MISSION",
  "MONTHLY_MISSION",
]);

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  console.log(`Loading honey transactions since ${since.toISOString()} …`);
  const txns = await prisma.honeyTransaction.findMany({
    where: { createdAt: { gte: since } },
    select: {
      userId: true,
      type: true,
      amount: true,
      createdAt: true,
      metadata: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(`  ${txns.length} transactions across ${new Set(txns.map((t) => t.userId)).size} users`);

  type PerUser = {
    userId: string;
    oldEarned: number;
    newEarned: number;
    perDayCappedNew: Map<string, number>; // dayKey → cumulative capped-source honey
    perDayActionCount: Map<string, Map<HoneyActionType, number>>; // dayKey → type → count
  };

  const perUser = new Map<string, PerUser>();

  function getBucket(userId: string): PerUser {
    let b = perUser.get(userId);
    if (!b) {
      b = {
        userId,
        oldEarned: 0,
        newEarned: 0,
        perDayCappedNew: new Map(),
        perDayActionCount: new Map(),
      };
      perUser.set(userId, b);
    }
    return b;
  }

  for (const t of txns) {
    const bucket = getBucket(t.userId);
    if (t.amount > 0) bucket.oldEarned += t.amount;

    if (t.amount <= 0) {
      // negative grants (REDEEM / EXPIRED) — replay verbatim.
      bucket.newEarned += t.amount;
      continue;
    }

    if (PASS_THROUGH_TYPES.has(t.type)) {
      bucket.newEarned += t.amount;
      continue;
    }

    const base = HONEY_REWARDS_V2[t.type];
    if (!base) {
      // unknown / deprecated type — keep historical amount so we don't
      // overstate the delta.
      bucket.newEarned += t.amount;
      continue;
    }

    const day = dayKey(t.createdAt);
    const dayCounts = bucket.perDayActionCount.get(day) ?? new Map<HoneyActionType, number>();
    const used = dayCounts.get(t.type) ?? 0;
    const dailyLimit = DAILY_LIMITS_V2[t.type];

    if (dailyLimit != null && used >= dailyLimit) {
      // Per-action cap reached — this hypothetical action would not be paid.
      continue;
    }

    // Infer the multiplier the user actually had. Where metadata
    // doesn't tell us, assume FREE-tier (1.0). Seasonal multiplier is
    // not modeled here.
    const meta = (t.metadata ?? {}) as Record<string, unknown>;
    const tierMult = typeof meta.tierMultiplier === "number" ? (meta.tierMultiplier as number) : 1;

    // Streak multiplier for CHECKIN is bundled into the base in the v2
    // ledger (multiplied at grant time). We approximate it from the
    // streak metadata when present.
    let streakMult = 1;
    if (t.type === "CHECKIN") {
      const streak = typeof meta.streak === "number" ? (meta.streak as number) : 0;
      streakMult = streak >= 30 ? 3 : streak >= 7 ? 2 : 1;
    }

    const rawAmount = Math.round(base * tierMult * streakMult);

    let amount = rawAmount;
    if (GLOBAL_CAP_TYPES.has(t.type)) {
      const usedToday = bucket.perDayCappedNew.get(day) ?? 0;
      const remaining = Math.max(0, GLOBAL_DAILY_CAP_V2 - usedToday);
      amount = Math.min(rawAmount, remaining);
      if (amount <= 0) continue;
      bucket.perDayCappedNew.set(day, usedToday + amount);
    }

    dayCounts.set(t.type, used + 1);
    bucket.perDayActionCount.set(day, dayCounts);
    bucket.newEarned += amount;
  }

  const buckets = [...perUser.values()];
  const totalsOld = buckets.reduce((s, b) => s + b.oldEarned, 0);
  const totalsNew = buckets.reduce((s, b) => s + b.newEarned, 0);

  console.log("\n──────── Cohort totals ────────");
  console.log(`  users in window         : ${buckets.length}`);
  console.log(`  total earned (historical): ${totalsOld.toLocaleString()}`);
  console.log(`  total earned (v2 sim)    : ${totalsNew.toLocaleString()}`);
  const cohortDelta = totalsNew - totalsOld;
  const cohortDeltaPct = totalsOld > 0 ? (cohortDelta / totalsOld) * 100 : 0;
  console.log(`  cohort delta             : ${cohortDelta >= 0 ? "+" : ""}${cohortDelta.toLocaleString()} (${cohortDeltaPct.toFixed(1)}%)`);

  // Per-user delta distribution
  const deltas = buckets
    .map((b) => ({ userId: b.userId, oldEarned: b.oldEarned, newEarned: b.newEarned, delta: b.newEarned - b.oldEarned }))
    .sort((a, b) => a.delta - b.delta);

  const deltaValues = deltas.map((d) => d.delta);
  const sortedDeltas = [...deltaValues].sort((a, b) => a - b);

  console.log("\n──────── Per-user delta distribution ────────");
  console.log(`  p10 : ${percentile(sortedDeltas, 10).toLocaleString()}`);
  console.log(`  p25 : ${percentile(sortedDeltas, 25).toLocaleString()}`);
  console.log(`  p50 : ${percentile(sortedDeltas, 50).toLocaleString()}`);
  console.log(`  p75 : ${percentile(sortedDeltas, 75).toLocaleString()}`);
  console.log(`  p90 : ${percentile(sortedDeltas, 90).toLocaleString()}`);
  console.log(`  p99 : ${percentile(sortedDeltas, 99).toLocaleString()}`);
  console.log(`  min : ${sortedDeltas[0]?.toLocaleString() ?? 0}`);
  console.log(`  max : ${sortedDeltas[sortedDeltas.length - 1]?.toLocaleString() ?? 0}`);

  const winners = deltas.filter((d) => d.delta > 0).length;
  const losers = deltas.filter((d) => d.delta < 0).length;
  const neutral = deltas.length - winners - losers;
  console.log(`  winners (delta > 0): ${winners}`);
  console.log(`  losers  (delta < 0): ${losers}`);
  console.log(`  neutral            : ${neutral}`);

  console.log("\n──────── Top 10 winners (largest +delta) ────────");
  for (const d of [...deltas].sort((a, b) => b.delta - a.delta).slice(0, 10)) {
    console.log(`  ${d.userId.slice(0, 8)}…  old=${d.oldEarned.toString().padStart(7)}  new=${d.newEarned.toString().padStart(7)}  Δ=${d.delta >= 0 ? "+" : ""}${d.delta}`);
  }

  console.log("\n──────── Bottom 10 (largest -delta) ────────");
  for (const d of deltas.slice(0, 10)) {
    console.log(`  ${d.userId.slice(0, 8)}…  old=${d.oldEarned.toString().padStart(7)}  new=${d.newEarned.toString().padStart(7)}  Δ=${d.delta >= 0 ? "+" : ""}${d.delta}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
