import { NextRequest, NextResponse } from "next/server";
import { adminApiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { prisma } from "@/lib/db";
import { MissionTemplateInputSchema } from "@/lib/honey/schemas";
import type { MissionCategory } from "@/generated/prisma/client";

export const GET = adminApiHandler(async (req: NextRequest) => {
  const sp = new URL(req.url).searchParams;
  const category = sp.get("category") as MissionCategory | null;

  const templates = await prisma.missionTemplate.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: { scheduleRules: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ templates });
});

export const POST = adminApiHandler(async (req: NextRequest) => {
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) return parsed.response;

  const result = MissionTemplateInputSchema.safeParse(parsed.body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", details: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = result.data;

  const existing = await prisma.missionTemplate.findUnique({ where: { code: data.code } });
  if (existing) {
    return NextResponse.json({ error: `Template code "${data.code}" already exists` }, { status: 409 });
  }

  const template = await prisma.missionTemplate.create({
    data: {
      code: data.code,
      name: data.name,
      nameEn: data.nameEn ?? null,
      nameTh: data.nameTh ?? null,
      description: data.description ?? null,
      descriptionEn: data.descriptionEn ?? null,
      descriptionTh: data.descriptionTh ?? null,
      icon: data.icon,
      category: data.category,
      trackType: data.trackType,
      conditions: data.conditions as object,
      rewards: data.rewards as object,
      target: data.target,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });

  return NextResponse.json({ template }, { status: 201 });
});
