import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ScheduleList } from "./schedule-list";
import type { ScheduleRule } from "../types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "ตารางเวลาภารกิจ — แอดมิน" };

export default async function SchedulePage() {
  const rules = await prisma.missionScheduleRule.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      template: {
        select: {
          id: true,
          code: true,
          name: true,
          nameEn: true,
          icon: true,
          category: true,
        },
      },
    },
  });

  const serialized: ScheduleRule[] = rules.map((r) => ({
    ...r,
    specificDates: r.specificDates as string[] | null,
    startDate: r.startDate?.toISOString() ?? null,
    endDate: r.endDate?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    template: r.template ?? undefined,
  }));

  return <ScheduleList initialRules={serialized} />;
}
