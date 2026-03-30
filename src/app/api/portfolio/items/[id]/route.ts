import { TransactionType } from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseListingQuantity, parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

const log = createLog("api:portfolio");

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

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
    if (item.portfolio.userId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = await parseJsonBody<Record<string, unknown>>(request);
    if (!parsed.ok) return parsed.response;
    const body = parsed.body;

    const data: Record<string, unknown> = {};

    if (body.quantity !== undefined) {
      const parsedQty = parseListingQuantity(body.quantity);
      if (!parsedQty.ok) return parsedQty.response;
      data.quantity = parsedQty.value;
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
    log.error("PATCH /api/portfolio/items/[id]", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

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
    if (item.portfolio.userId !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.portfolioTransaction.create({
        data: {
          portfolioId: item.portfolioId,
          cardId: item.cardId,
          type: TransactionType.REMOVE,
          quantity: item.quantity,
          pricePerUnit: item.purchasePrice,
        },
      }),
      prisma.portfolioItem.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error("DELETE /api/portfolio/items/[id]", error);
    return NextResponse.json({ error: "Failed to remove portfolio item" }, { status: 500 });
  }
}
