import { getAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    if (body.quantity !== undefined) {
      const qty = Number(body.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 9999) {
        return NextResponse.json({ error: "quantity must be 1-9999" }, { status: 400 });
      }
      data.quantity = qty;
    }
    if (body.purchasePrice !== undefined) {
      if (body.purchasePrice === null) {
        data.purchasePrice = null;
      } else {
        const pp = Number(body.purchasePrice);
        if (!Number.isFinite(pp) || pp < 0) {
          return NextResponse.json({ error: "Invalid purchasePrice" }, { status: 400 });
        }
        data.purchasePrice = Math.round(pp);
      }
    }
    if (body.notes !== undefined) {
      data.notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;
    }

    const updated = await prisma.portfolioItem.update({
      where: { id },
      data,
      include: { card: { include: cardInclude } },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("PATCH /api/portfolio/items/[id]:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }

    const item = await prisma.portfolioItem.findUnique({
      where: { id },
      include: { portfolio: { select: { userId: true, id: true } } },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (item.portfolio.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.portfolioTransaction.create({
        data: {
          portfolioId: item.portfolioId,
          cardId: item.cardId,
          type: "REMOVE",
          quantity: item.quantity,
          pricePerUnit: item.purchasePrice,
        },
      }),
      prisma.portfolioItem.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/portfolio/items/[id]:", error);
    return NextResponse.json({ error: "Failed to remove portfolio item" }, { status: 500 });
  }
}
