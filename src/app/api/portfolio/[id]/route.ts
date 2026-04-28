import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { UpdatePortfolioSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = apiHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, UpdatePortfolioSchema);
  if (!parsed.ok) return parsed.response;

  const data: { name?: string; isPublic?: boolean } = {};
  if (parsed.body.name !== undefined) data.name = parsed.body.name;
  if (parsed.body.isPublic !== undefined) data.isPublic = parsed.body.isPublic;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ portfolio });
  }

  const updated = await prisma.portfolio.update({
    where: { id },
    data,
  });

  return NextResponse.json({ portfolio: updated });
});

export const DELETE = apiHandler(async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findFirst({
    where: { id, userId: auth.user.id },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  await prisma.portfolio.delete({ where: { id } });

  return NextResponse.json({ ok: true });
});
