import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

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

  const result = achievements.map((a) => ({
    ...a,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id) ?? null,
  }));

  return NextResponse.json({ achievements: result });
});
