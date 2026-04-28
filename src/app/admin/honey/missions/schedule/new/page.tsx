import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ScheduleForm } from "../schedule-form";
import type { Template } from "../../types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "สร้างกฎตารางเวลา — แอดมิน" };

export default async function NewSchedulePage() {
  const templates = await prisma.missionTemplate.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const serialized = templates.map((t) => ({
    ...t,
    conditions: t.conditions as Record<string, unknown>,
    rewards: t.rewards as Record<string, unknown>,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    scheduleRules: [],
  })) as Template[];

  return <ScheduleForm templates={serialized} />;
}
