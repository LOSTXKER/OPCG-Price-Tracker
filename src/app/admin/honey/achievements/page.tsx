import { prisma } from "@/lib/db";
import { AchievementsManager } from "./achievements-manager";

export const dynamic = "force-dynamic";

export default async function AdminAchievementsPage() {
  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });

  const serialized = achievements.map((a) => ({
    ...a,
    criteria: a.criteria as Record<string, unknown>,
    createdAt: a.createdAt.toISOString(),
  }));

  return <AchievementsManager initialAchievements={serialized} />;
}
