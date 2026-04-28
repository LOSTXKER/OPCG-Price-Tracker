import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { TemplateForm } from "../template-form";
import type { Template } from "../../types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "สร้างเทมเพลตภารกิจ — แอดมิน" };

export default async function NewTemplatePage(props: {
  searchParams: Promise<{ clone?: string }>;
}) {
  const { clone } = await props.searchParams;
  if (!clone) return <TemplateForm />;

  const id = Number(clone);
  if (!Number.isInteger(id) || id < 1) return <TemplateForm />;

  const template = await prisma.missionTemplate.findUnique({
    where: { id },
    include: { scheduleRules: true },
  });
  if (!template) return <TemplateForm />;

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

  return <TemplateForm cloneFrom={serialized} />;
}
