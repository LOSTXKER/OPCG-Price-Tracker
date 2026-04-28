import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { batchFetchStats } from "@/lib/honey/achievements";
import { AchievementCriteriaSchema, type AchievementCriteriaParsed } from "@/lib/honey/schemas";

type CriteriaType = AchievementCriteriaParsed["type"];

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const [achievements, earned] = await Promise.all([
    prisma.achievement.findMany({
      where: { isActive: true },
      orderBy: { honeyReward: "asc" },
    }),
    prisma.userAchievement.findMany({
      where: { userId: auth.user.id },
      select: { achievementId: true, earnedAt: true },
    }),
  ]);

  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

  // Collect criteria types only from achievements that haven't been earned yet —
  // earned ones are always at 100% so we don't need fresh stats for them.
  const neededTypes = new Set<CriteriaType>();
  const parsedCriteria = new Map<number, AchievementCriteriaParsed>();
  for (const ach of achievements) {
    const parsed = AchievementCriteriaSchema.safeParse(ach.criteria);
    if (!parsed.success) continue;
    parsedCriteria.set(ach.id, parsed.data);
    if (!earnedMap.has(ach.id)) neededTypes.add(parsed.data.type);
  }

  const stats = neededTypes.size > 0
    ? await batchFetchStats(auth.user.id, neededTypes)
    : new Map<CriteriaType, number>();

  const result = achievements.map((a) => {
    const isEarned = earnedMap.has(a.id);
    const criteria = parsedCriteria.get(a.id);
    const target = criteria?.target ?? 0;
    const rawProgress = isEarned ? target : (stats.get(criteria?.type as CriteriaType) ?? 0);
    const progress = target > 0 ? Math.min(rawProgress, target) : rawProgress;

    return {
      ...a,
      earned: isEarned,
      earnedAt: earnedMap.get(a.id) ?? null,
      progress,
      target,
      criteriaType: criteria?.type ?? null,
    };
  });

  return NextResponse.json({ achievements: result });
});
