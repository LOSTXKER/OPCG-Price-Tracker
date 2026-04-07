import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { effectiveTier, getLimits } from "@/lib/tier";

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const filters = await prisma.savedFilter.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ filters });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{ name: string; filters: Record<string, unknown> }>(request);
  if (!parsed.ok) return parsed.response;

  const { name, filters } = parsed.body;
  if (!name || !filters) {
    return NextResponse.json({ error: "name and filters are required" }, { status: 400 });
  }

  const eTier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(eTier);
  const count = await prisma.savedFilter.count({ where: { userId: auth.user.id } });
  if (limits.savedFilters !== Infinity && count >= limits.savedFilters) {
    return NextResponse.json({ error: "Filter limit reached" }, { status: 403 });
  }

  const filter = await prisma.savedFilter.create({
    data: {
      userId: auth.user.id,
      name: String(name).slice(0, 100),
      filters: filters as any,
    },
  });

  return NextResponse.json({ filter }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.savedFilter.deleteMany({
    where: { id, userId: auth.user.id },
  });

  return NextResponse.json({ ok: true });
}
