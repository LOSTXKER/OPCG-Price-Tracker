import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:portfolio");

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const parsed = await parseJsonBody<{ name?: string }>(request);
    if (!parsed.ok) return parsed.response;

    const name =
      typeof parsed.body.name === "string" ? parsed.body.name.trim() : undefined;

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
    log.error("PATCH /api/portfolio/[id]", error);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
  } catch (error) {
    log.error("DELETE /api/portfolio/[id]", error);
    return NextResponse.json({ error: "Failed to delete portfolio" }, { status: 500 });
  }
}
