import { prisma } from "@/lib/db";
import { MissionsManager } from "./missions-manager";

export const dynamic = "force-dynamic";

export default async function AdminMissionsPage() {
  const [templates, scheduleRules, bonusRules] = await Promise.all([
    prisma.missionTemplate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { scheduleRules: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.missionScheduleRule.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        template: {
          select: { id: true, code: true, name: true, nameEn: true, icon: true, category: true },
        },
      },
    }),
    prisma.missionBonusRule.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const serialize = <T extends { createdAt: Date; [k: string]: unknown }>(items: T[]) =>
    items.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      ...(("updatedAt" in i && i.updatedAt instanceof Date) ? { updatedAt: (i.updatedAt as Date).toISOString() } : {}),
      ...(("startDate" in i && i.startDate instanceof Date) ? { startDate: (i.startDate as Date).toISOString() } : {}),
      ...(("endDate" in i && i.endDate instanceof Date) ? { endDate: (i.endDate as Date).toISOString() } : {}),
    }));

  return (
    <MissionsManager
      initialTemplates={serialize(templates) as never}
      initialScheduleRules={serialize(scheduleRules) as never}
      initialBonusRules={serialize(bonusRules) as never}
    />
  );
}
