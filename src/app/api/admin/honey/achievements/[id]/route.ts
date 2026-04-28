import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { AchievementCriteriaSchema } from "@/lib/honey/schemas";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = adminApiHandler(async (req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  const parsed = await parseJsonBody<{
    code?: string;
    name?: string;
    nameEn?: string | null;
    nameTh?: string | null;
    description?: string | null;
    criteria?: Record<string, unknown>;
    honeyReward?: number;
    badgeImageUrl?: string | null;
    isActive?: boolean;
  }>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const data: Record<string, unknown> = {};
  if (body.code !== undefined) data.code = body.code;
  if (body.name !== undefined) data.name = body.name;
  if (body.nameEn !== undefined) data.nameEn = body.nameEn;
  if (body.nameTh !== undefined) data.nameTh = body.nameTh;
  if (body.description !== undefined) data.description = body.description;
  if (body.honeyReward !== undefined) data.honeyReward = body.honeyReward;
  if (body.badgeImageUrl !== undefined) data.badgeImageUrl = body.badgeImageUrl;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  if (body.criteria !== undefined) {
    const result = AchievementCriteriaSchema.safeParse(body.criteria);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid criteria", details: result.error.format() },
        { status: 400 },
      );
    }
    data.criteria = result.data;
  }

  const achievement = await prisma.achievement.update({
    where: { id: Number(id) },
    data,
  });

  return NextResponse.json({ achievement });
});

export const DELETE = adminApiHandler(async (_req: NextRequest, _admin, ctx: Ctx) => {
  const { id } = await ctx.params;
  // UserAchievement rows cascade-delete with the parent achievement
  // (see schema.prisma `onDelete: Cascade`). Hard-delete is safe because
  // the historical honey grant lives on `HoneyTransaction` independently.
  await prisma.achievement.delete({ where: { id: Number(id) } });
  return NextResponse.json({ deleted: true });
});
