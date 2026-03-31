import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";

export async function GET() {
  if (!(await checkIsAdmin())) return unauthorized();

  const events = await prisma.seasonalEvent.findMany({
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const parsed = await parseJsonBody<{
    name: string;
    nameEn?: string;
    nameTh?: string;
    description?: string;
    startDate: string;
    endDate: string;
    honeyMultiplier?: number;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.name || !body.startDate || !body.endDate) {
    return NextResponse.json({ error: "name, startDate, endDate required" }, { status: 400 });
  }

  const event = await prisma.seasonalEvent.create({
    data: {
      name: body.name,
      nameEn: body.nameEn ?? null,
      nameTh: body.nameTh ?? null,
      description: body.description ?? null,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      honeyMultiplier: body.honeyMultiplier ?? 1,
    },
  });

  return NextResponse.json({ event }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const parsed = await parseJsonBody<{
    id: number;
    name?: string;
    nameEn?: string;
    nameTh?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    honeyMultiplier?: number;
    isActive?: boolean;
  }>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const event = await prisma.seasonalEvent.update({
    where: { id: body.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.nameEn !== undefined ? { nameEn: body.nameEn } : {}),
      ...(body.nameTh !== undefined ? { nameTh: body.nameTh } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.startDate ? { startDate: new Date(body.startDate) } : {}),
      ...(body.endDate ? { endDate: new Date(body.endDate) } : {}),
      ...(body.honeyMultiplier !== undefined ? { honeyMultiplier: body.honeyMultiplier } : {}),
      ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
    },
  });

  return NextResponse.json({ event });
}
