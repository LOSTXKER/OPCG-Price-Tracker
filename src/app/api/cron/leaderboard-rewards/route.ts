import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { earnHoneyDirect } from "@/lib/honey";

export const dynamic = "force-dynamic";

/**
 * Honey rebalance v2 §3.3: top-3 receive headline rewards, ranks 4–10 get a
 * consolation 100 each. The whole pool (1500+800+400 + 7×100 = 3,400 honey)
 * stays comfortably below the cost of a single 30-day Pro Pass (8,000), so
 * winning leaderboard cannot single-handedly fund a Pass.
 */
const REWARDS = [1500, 800, 400, 100, 100, 100, 100, 100, 100, 100];

export const GET = cronHandler(async () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  // Per-place idempotency keys collapse double-runs of this cron into
  // a single payout regardless of how many earners exist. The first
  // place for the month is the canonical "already rewarded" check.
  const firstPlaceKey = `leaderboard:${monthStr}:1`;
  const existing = await prisma.honeyTransaction.findFirst({
    where: { idempotencyKey: firstPlaceKey },
    select: { id: true },
  });
  if (existing) {
    return { rewarded: false, reason: `Already rewarded for ${monthStr}` };
  }

  const topEarners = await prisma.honeyTransaction.groupBy({
    by: ["userId"],
    where: {
      amount: { gt: 0 },
      type: { notIn: ["ADMIN_GRANT", "LEADERBOARD_REWARD", "LEVEL_UP"] },
      createdAt: { gte: lastMonth, lt: thisMonth },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: REWARDS.length,
  });

  if (topEarners.length === 0) {
    return { rewarded: false, month: monthStr, reason: "No earners this month" };
  }

  const results: { place: number; userId: string; earned: number; reward: number }[] = [];

  for (let i = 0; i < topEarners.length && i < REWARDS.length; i++) {
    const entry = topEarners[i];
    const reward = REWARDS[i];
    await earnHoneyDirect(
      entry.userId,
      "LEADERBOARD_REWARD",
      reward,
      `Leaderboard reward: #${i + 1} for ${monthStr}`,
      {
        month: monthStr,
        rank: i + 1,
      },
      { idempotencyKey: `leaderboard:${monthStr}:${i + 1}` },
    );
    results.push({ place: i + 1, userId: entry.userId, earned: entry._sum.amount ?? 0, reward });
  }

  return { rewarded: true, month: monthStr, results };
});
