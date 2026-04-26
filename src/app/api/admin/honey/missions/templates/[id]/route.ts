import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { prisma } from "@/lib/db";
import { MissionTemplateInputSchema } from "@/lib/honey/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = adminApiHandler(async (_req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  const template = await prisma.missionTemplate.findUnique({
    where: { id: Number(id) },
    include: { scheduleRules: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template });
});

export const PUT = adminApiHandler(async (req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return parsed.response;

  const result = MissionTemplateInputSchema.partial().safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = result.data;
  const updateData: Record<string, unknown> = {};

  if (data.code !== undefined) updateData.code = data.code;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.nameTh !== undefined) updateData.nameTh = data.nameTh;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
  if (data.descriptionTh !== undefined) updateData.descriptionTh = data.descriptionTh;
  if (data.icon !== undefined) updateData.icon = data.icon;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.trackType !== undefined) updateData.trackType = data.trackType;
  if (data.conditions !== undefined) updateData.conditions = data.conditions as object;
  if (data.rewards !== undefined) updateData.rewards = data.rewards as object;
  if (data.target !== undefined) updateData.target = data.target;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  const template = await prisma.missionTemplate.update({
    where: { id: Number(id) },
    data: updateData,
  });

  return NextResponse.json({ template });
});

export const DELETE = adminApiHandler(async (_req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  await prisma.missionScheduleRule.deleteMany({ where: { templateId: Number(id) } });
  await prisma.missionTemplate.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
});
