import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { prisma } from "@/lib/db";
import { MissionBonusRuleInputSchema } from "@/lib/honey/schemas";

export const GET = adminApiHandler(async () => {
  const rules = await prisma.missionBonusRule.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ rules });
});

export const POST = adminApiHandler(async (req: NextRequest) => {
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return parsed.response;

  const result = MissionBonusRuleInputSchema.safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = result.data;

  const rule = await prisma.missionBonusRule.create({
    data: {
      name: data.name,
      nameEn: data.nameEn ?? null,
      nameTh: data.nameTh ?? null,
      category: data.category,
      requirement: data.requirement,
      requirementValue: data.requirementValue,
      rewards: data.rewards as object,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
});
