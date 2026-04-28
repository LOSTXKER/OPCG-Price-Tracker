import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ScheduleForm } from "../schedule-form";
import type { ScheduleRule, Template } from "../../types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขกฎตารางเวลา — แอดมิน" };

export default async function EditSchedulePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const [rule, templates] = await Promise.all([
    prisma.missionScheduleRule.findUnique({
      where: { id },
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
    }),
    prisma.missionTemplate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  if (!rule) notFound();

  const serializedRule: ScheduleRule = {
    ...rule,
    specificDates: rule.specificDates as string[] | null,
    startDate: rule.startDate?.toISOString() ?? null,
    endDate: rule.endDate?.toISOString() ?? null,
    createdAt: rule.createdAt.toISOString(),
    template: rule.template ?? undefined,
  };

  const serializedTemplates = templates.map((t) => ({
    ...t,
    conditions: t.conditions as Record<string, unknown>,
    rewards: t.rewards as Record<string, unknown>,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    scheduleRules: [],
  })) as Template[];

  return <ScheduleForm initial={serializedRule} templates={serializedTemplates} />;
}
