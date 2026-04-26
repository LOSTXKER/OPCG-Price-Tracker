import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { prisma } from "@/lib/db";
import { MissionScheduleRuleInputSchema } from "@/lib/honey/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = adminApiHandler(async (req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return parsed.response;

  const result = MissionScheduleRuleInputSchema.partial().safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = result.data;
  const updateData: Record<string, unknown> = {};

  if (data.templateId !== undefined) updateData.templateId = data.templateId;
  if (data.slotType !== undefined) updateData.slotType = data.slotType;
  if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek;
  if (data.specificDates !== undefined) updateData.specificDates = data.specificDates ? (data.specificDates as object) : null;
  if (data.poolGroup !== undefined) updateData.poolGroup = data.poolGroup;
  if (data.poolPickCount !== undefined) updateData.poolPickCount = data.poolPickCount;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const rule = await prisma.missionScheduleRule.update({
    where: { id: Number(id) },
    data: updateData,
    include: { template: { select: { id: true, code: true, name: true, nameEn: true, icon: true, category: true } } },
  });

  return NextResponse.json({ rule });
});

export const DELETE = adminApiHandler(async (_req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  await prisma.missionScheduleRule.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
});
