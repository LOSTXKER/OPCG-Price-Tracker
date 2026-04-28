import { prisma } from "@/lib/db";
import { earnHoneyDirect } from ".";
import { notify } from "@/lib/notify/dispatch";
import { createLog } from "@/lib/logger";
import { AchievementCriteriaSchema, type AchievementCriteriaParsed } from "./schemas";

const log = createLog("honey:achievements");

type CriteriaType = AchievementCriteriaParsed["type"];
type Criteria = AchievementCriteriaParsed;

export async function batchFetchStats(userId: string, types: Set<CriteriaType>): Promise<Map<CriteriaType, number>> {
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

  // first_sell and trades_count share the same MARKETPLACE_SELL count
  if (types.has("first_sell") || types.has("trades_count")) {
    promises.push(
      prisma.honeyTransaction.count({ where: { userId, type: "MARKETPLACE_SELL" } })
        .then((v) => { stats.set("first_sell", v); stats.set("trades_count", v); }),
    );
  }

  // first_review and review_count share the same Review-as-author count
  if (types.has("first_review") || types.has("review_count")) {
    promises.push(
      prisma.review.count({ where: { reviewerId: userId } })
        .then((v) => { stats.set("first_review", v); stats.set("review_count", v); }),
    );
  }

  if (types.has("correct_predictions")) {
    promises.push(
      prisma.pricePrediction.count({ where: { userId, correct: true } })
        .then((v) => { stats.set("correct_predictions", v); }),
    );
  }

  if (types.has("prediction_count")) {
    promises.push(
      prisma.pricePrediction.count({ where: { userId } })
        .then((v) => { stats.set("prediction_count", v); }),
    );
  }

  if (types.has("referral_count")) {
    // Referrer transactions have metadata.referredUserId set; the welcome bonus
    // for the *new* user uses metadata.referrerId instead. Filtering by the
    // string-typed referredUserId path excludes the referee's own welcome bonus
    // so the count reflects "users I referred" only.
    promises.push(
      prisma.honeyTransaction.count({
        where: {
          userId,
          type: "REFERRAL",
          amount: { gt: 0 },
          metadata: { path: ["referredUserId"], string_starts_with: "" },
        },
      }).then((v) => { stats.set("referral_count", v); }),
    );
  }

  if (types.has("watchlist_count")) {
    promises.push(
      prisma.watchlistItem.count({ where: { userId } })
        .then((v) => { stats.set("watchlist_count", v); }),
    );
  }

  if (types.has("deck_count")) {
    promises.push(
      prisma.deck.count({ where: { userId } })
        .then((v) => { stats.set("deck_count", v); }),
    );
  }

  if (types.has("deck_share_count")) {
    promises.push(
      prisma.honeyTransaction.count({ where: { userId, type: "DECK_SHARE" } })
        .then((v) => { stats.set("deck_share_count", v); }),
    );
  }

  if (types.has("community_price_count")) {
    promises.push(
      prisma.communityPrice.count({ where: { userId } })
        .then((v) => { stats.set("community_price_count", v); }),
    );
  }

  if (types.has("order_buy_count")) {
    promises.push(
      prisma.order.count({ where: { buyerId: userId, status: "COMPLETED" } })
        .then((v) => { stats.set("order_buy_count", v); }),
    );
  }

  if (types.has("perfect_day_count")) {
    promises.push(
      prisma.userMissionPeriod.count({
        where: { userId, cadence: "DAILY", perfectDay: true },
      })
        .then((v) => { stats.set("perfect_day_count", v); }),
    );
  }

  if (types.has("raffle_win_count")) {
    promises.push(
      prisma.honeyTransaction.count({ where: { userId, type: "RAFFLE_WIN" } })
        .then((v) => { stats.set("raffle_win_count", v); }),
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

    // Insert first; if a concurrent fire-and-forget call already created it
    // we'll get a unique-constraint violation (P2002) on (userId, achievementId)
    // and we should skip the reward to avoid double-paying.
    try {
      await prisma.userAchievement.create({
        data: { userId, achievementId: ach.id },
      });
    } catch (err: unknown) {
      if ((err as { code?: string }).code === "P2002") continue;
      throw err;
    }

    if (ach.honeyReward > 0) {
      await earnHoneyDirect(userId, "ACHIEVEMENT", ach.honeyReward, `Achievement: ${ach.name}`, {
        achievementId: ach.id,
        achievementCode: ach.code,
      });
    }

    notify({
      userId,
      kind: "HONEY",
      type: "ACHIEVEMENT_UNLOCKED",
      title: `Achievement unlocked: ${ach.name}`,
      message:
        ach.honeyReward > 0
          ? `Earned ${ach.honeyReward} honey for "${ach.name}".`
          : `You unlocked "${ach.name}".`,
      data: { achievementId: ach.id, achievementCode: ach.code, honey: ach.honeyReward },
      dedupKey: `achievement:${ach.id}`,
    }).catch((err) => log.error("notify failed", err));

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
