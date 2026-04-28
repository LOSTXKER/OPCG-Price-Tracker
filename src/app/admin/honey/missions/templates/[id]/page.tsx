import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { TemplateForm } from "../template-form";
import type { Template } from "../../types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "แก้ไขเทมเพลตภารกิจ — แอดมิน" };

export default async function EditTemplatePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await props.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) notFound();

  const template = await prisma.missionTemplate.findUnique({
    where: { id },
    include: { scheduleRules: true },
  });
  if (!template) notFound();

  const serialized: Template = {
    ...template,
    conditions: template.conditions as Record<string, unknown>,
    rewards: template.rewards as Record<string, unknown>,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    scheduleRules: template.scheduleRules.map((r) => ({
      ...r,
      specificDates: r.specificDates as string[] | null,
      startDate: r.startDate?.toISOString() ?? null,
      endDate: r.endDate?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return <TemplateForm initial={serialized} />;
}
