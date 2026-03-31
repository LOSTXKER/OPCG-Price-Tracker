import { prisma } from "@/lib/db";
import { earnHoneyDirect } from "@/lib/honey";

type CriteriaType =
  | "portfolio_count"
  | "checkin_streak"
  | "first_sell"
  | "first_review"
  | "correct_predictions";

interface Criteria {
  type: CriteriaType;
  target: number;
}

async function getUserStat(userId: string, type: CriteriaType): Promise<number> {
  switch (type) {
    case "portfolio_count": {
      return prisma.portfolioItem.count({
        where: { portfolio: { userId } },
      });
    }
    case "checkin_streak": {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { checkinStreak: true },
      });
      return user?.checkinStreak ?? 0;
    }
    case "first_sell": {
      return prisma.honeyTransaction.count({
        where: { userId, type: "MARKETPLACE_SELL" },
      });
    }
    case "first_review": {
      return prisma.review.count({ where: { reviewerId: userId } });
    }
    case "correct_predictions": {
      return prisma.pricePrediction.count({
        where: { userId, correct: true },
      });
    }
    default:
      return 0;
  }
}

export async function checkAchievements(userId: string): Promise<number> {
  const achievements = await prisma.achievement.findMany({
    where: { isActive: true },
  });

  const earned = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(earned.map((e) => e.achievementId));

  let newlyEarned = 0;

  for (const ach of achievements) {
    if (earnedIds.has(ach.id)) continue;

    const criteria = ach.criteria as unknown as Criteria;
    if (!criteria?.type || criteria.target == null) continue;

    const stat = await getUserStat(userId, criteria.type);
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
