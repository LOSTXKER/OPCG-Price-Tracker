import { NextRequest, NextResponse } from "next/server";
import { parseJsonBody } from "@/lib/api/admin-helpers";
import { adminApiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";

export const GET = adminApiHandler(async (_req: NextRequest, _admin) => {
  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });
  return NextResponse.json({ achievements });
});

export const POST = adminApiHandler(async (request: NextRequest, _admin) => {
  const parsed = await parseJsonBody<{
    code: string;
    name: string;
    nameEn?: string;
    nameTh?: string;
    description?: string;
    criteria: Record<string, unknown>;
    honeyReward: number;
    badgeImageUrl?: string;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.code || !body.name) {
    return NextResponse.json({ error: "code and name required" }, { status: 400 });
  }

  const achievement = await prisma.achievement.create({
    data: {
      code: body.code,
      name: body.name,
      nameEn: body.nameEn ?? null,
      nameTh: body.nameTh ?? null,
      description: body.description ?? null,
      criteria: body.criteria as object,
      honeyReward: body.honeyReward ?? 0,
      badgeImageUrl: body.badgeImageUrl ?? null,
    },
  });

  return NextResponse.json({ achievement }, { status: 201 });
});
