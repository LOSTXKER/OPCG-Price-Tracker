import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { TemplatesList } from "./templates-list";
import type { Template } from "../types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "เทมเพลตภารกิจ — แอดมิน" };

export default async function TemplatesPage() {
  const templates = await prisma.missionTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { scheduleRules: { orderBy: { sortOrder: "asc" } } },
  });

  const serialized: Template[] = templates.map((t) => ({
    ...t,
    conditions: t.conditions as Record<string, unknown>,
    rewards: t.rewards as Record<string, unknown>,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    scheduleRules: t.scheduleRules.map((r) => ({
      ...r,
      specificDates: r.specificDates as string[] | null,
      startDate: r.startDate?.toISOString() ?? null,
      endDate: r.endDate?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  return <TemplatesList initialTemplates={serialized} />;
}
