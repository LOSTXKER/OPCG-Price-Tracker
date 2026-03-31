import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";

export async function GET() {
  if (!(await checkIsAdmin())) return unauthorized();

  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });
  return NextResponse.json({ achievements });
}

export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

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
}
