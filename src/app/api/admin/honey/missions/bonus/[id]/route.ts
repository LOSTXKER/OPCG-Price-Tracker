import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { prisma } from "@/lib/db";
import { MissionBonusRuleInputSchema } from "@/lib/honey/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = adminApiHandler(async (req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return parsed.response;

  const result = MissionBonusRuleInputSchema.partial().safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = result.data;
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
  if (data.nameTh !== undefined) updateData.nameTh = data.nameTh;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.requirement !== undefined) updateData.requirement = data.requirement;
  if (data.requirementValue !== undefined) updateData.requirementValue = data.requirementValue;
  if (data.rewards !== undefined) updateData.rewards = data.rewards as object;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  const rule = await prisma.missionBonusRule.update({
    where: { id: Number(id) },
    data: updateData,
  });

  return NextResponse.json({ rule });
});

export const DELETE = adminApiHandler(async (_req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  await prisma.missionBonusRule.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
});
