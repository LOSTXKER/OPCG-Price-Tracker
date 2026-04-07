import { prisma } from "@/lib/db";
import { earnHoneyDirect } from ".";
import { AchievementCriteriaSchema, type AchievementCriteriaParsed } from "./schemas";

type CriteriaType = AchievementCriteriaParsed["type"];
type Criteria = AchievementCriteriaParsed;

async function batchFetchStats(userId: string, types: Set<CriteriaType>): Promise<Map<CriteriaType, number>> {
  const stats = new Map<CriteriaType, number>();
  const promises: Promise<void>[] = [];

  if (types.has("portfolio_count")) {
    promises.push(
      prisma.portfolioItem.count({ where: { portfolio: { userId } } })
        .then((v) => { stats.set("portfolio_count", v); }),
    );
  }

  if (types.has("checkin_streak") || types.has("honey_lifetime")) {
    promises.push(
      prisma.user.findUnique({
        where: { id: userId },
        select: { checkinStreak: true, honeyLifetimeEarned: true },
      }).then((u) => {
        stats.set("checkin_streak", u?.checkinStreak ?? 0);
        stats.set("honey_lifetime", u?.honeyLifetimeEarned ?? 0);
      }),
    );
  }

  // first_sell and trades_count use the same query
  if (types.has("first_sell") || types.has("trades_count")) {
    promises.push(
      prisma.honeyTransaction.count({ where: { userId, type: "MARKETPLACE_SELL" } })
        .then((v) => { stats.set("first_sell", v); stats.set("trades_count", v); }),
    );
  }

  if (types.has("first_review")) {
    promises.push(
      prisma.review.count({ where: { reviewerId: userId } })
        .then((v) => { stats.set("first_review", v); }),
    );
  }

  if (types.has("correct_predictions")) {
    promises.push(
      prisma.pricePrediction.count({ where: { userId, correct: true } })
        .then((v) => { stats.set("correct_predictions", v); }),
    );
  }

  if (types.has("referral_count")) {
    promises.push(
      prisma.honeyTransaction.count({ where: { userId, type: "REFERRAL", amount: { gt: 0 } } })
        .then((v) => { stats.set("referral_count", v); }),
    );
  }

  await Promise.all(promises);
  return stats;
}

export async function checkAchievements(userId: string): Promise<number> {
  const [achievements, earned] = await Promise.all([
    prisma.achievement.findMany({ where: { isActive: true } }),
    prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
  ]);

  const earnedIds = new Set(earned.map((e) => e.achievementId));
  const unchecked = achievements.filter((a) => !earnedIds.has(a.id));
  if (unchecked.length === 0) return 0;

  const neededTypes = new Set<CriteriaType>();
  for (const ach of unchecked) {
    const c = AchievementCriteriaSchema.safeParse(ach.criteria);
    if (c.success) neededTypes.add(c.data.type);
  }

  const stats = await batchFetchStats(userId, neededTypes);

  let newlyEarned = 0;

  for (const ach of unchecked) {
    const parsed = AchievementCriteriaSchema.safeParse(ach.criteria);
    if (!parsed.success) continue;
    const criteria: Criteria = parsed.data;

    const stat = stats.get(criteria.type) ?? 0;
    if (stat < criteria.target) continue;

    await prisma.userAchievement.create({
      data: { userId, achievementId: ach.id },
    });

    if (ach.honeyReward > 0) {
      await earnHoneyDirect(userId, "ACHIEVEMENT", ach.honeyReward, `Achievement: ${ach.name}`, {
        achievementId: ach.id,
        achievementCode: ach.code,
      });
    }

    if (ach.badgeImageUrl) {
      await prisma.userBadge.create({
        data: {
          userId,
          name: ach.name,
          nameEn: ach.nameEn,
          nameTh: ach.nameTh,
          imageUrl: ach.badgeImageUrl,
        },
      });
    }

    newlyEarned++;
  }

  return newlyEarned;
}
