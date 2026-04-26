import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { MissionScheduleRuleInputSchema } from "@/lib/honey/schemas";

export const GET = adminApiHandler(async () => {
  const rules = await prisma.missionScheduleRule.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { template: { select: { id: true, code: true, name: true, nameEn: true, icon: true, category: true } } },
  });
  return NextResponse.json({ rules });
});

export const POST = adminApiHandler(async (req: NextRequest) => {
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return parsed.response;

  const result = MissionScheduleRuleInputSchema.safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = result.data;

  const templateExists = await prisma.missionTemplate.findUnique({ where: { id: data.templateId } });
  if (!templateExists) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const rule = await prisma.missionScheduleRule.create({
    data: {
      templateId: data.templateId,
      slotType: data.slotType,
      dayOfWeek: data.dayOfWeek ?? null,
      specificDates: data.specificDates ? (data.specificDates as Prisma.InputJsonValue) : Prisma.JsonNull,
      poolGroup: data.poolGroup ?? null,
      poolPickCount: data.poolPickCount ?? null,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
    include: { template: { select: { id: true, code: true, name: true, nameEn: true, icon: true, category: true } } },
  });

  return NextResponse.json({ rule }, { status: 201 });
});
