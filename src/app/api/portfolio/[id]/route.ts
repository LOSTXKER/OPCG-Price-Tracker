import { getAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : undefined;

    if (name !== undefined && (!name || name.length > 120)) {
      return NextResponse.json(
        { error: "name must be 1-120 characters" },
        { status: 400 }
      );
    }

    const updated = await prisma.portfolio.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
      },
    });

    return NextResponse.json({ portfolio: updated });
  } catch (error) {
    console.error("PATCH /api/portfolio/[id]:", error);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr, 10);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid portfolio id" }, { status: 400 });
    }

    const portfolio = await prisma.portfolio.findFirst({
      where: { id, userId: dbUser.id },
    });
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    await prisma.portfolio.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/portfolio/[id]:", error);
    return NextResponse.json({ error: "Failed to delete portfolio" }, { status: 500 });
  }
}
