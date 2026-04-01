import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { earnHoneyDirect } from "@/lib/honey";

export const dynamic = "force-dynamic";

const REWARDS = [500, 300, 100];

export const GET = cronHandler(async () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const monthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const existing = await prisma.honeyTransaction.findFirst({
    where: {
      type: "LEADERBOARD_REWARD",
      metadata: { path: ["month"], equals: monthStr },
    },
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
    take: 3,
  });

  if (topEarners.length === 0) {
    return { rewarded: false, month: monthStr, reason: "No earners this month" };
  }

  const results: { place: number; userId: string; earned: number; reward: number }[] = [];

  for (let i = 0; i < topEarners.length && i < REWARDS.length; i++) {
    const entry = topEarners[i];
    const reward = REWARDS[i];
    await earnHoneyDirect(entry.userId, "LEADERBOARD_REWARD", reward, `Leaderboard reward: #${i + 1} for ${monthStr}`, {
      month: monthStr,
      place: i + 1,
      totalEarned: entry._sum.amount,
    });
    results.push({ place: i + 1, userId: entry.userId, earned: entry._sum.amount ?? 0, reward });
  }

  return { rewarded: true, month: monthStr, results };
});
