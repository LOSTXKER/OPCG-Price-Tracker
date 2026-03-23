import { syncAppUser } from "@/lib/auth/sync-app-user";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await syncAppUser(user);

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }

    const item = await prisma.portfolioItem.findUnique({
      where: { id },
      include: { portfolio: { select: { userId: true } } },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.portfolio.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.portfolioItem.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/portfolio/items/[id]:", error);
    return NextResponse.json({ error: "Failed to remove portfolio item" }, { status: 500 });
  }
}
