import { TransactionType } from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { UpdatePortfolioItemSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = apiHandler(async (request: NextRequest, context: RouteContext) => {
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

  const parsed = await parseJsonBody(request, UpdatePortfolioItemSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const data: Record<string, unknown> = {};

  if (body.quantity !== undefined) data.quantity = body.quantity;
  if (body.purchasePrice !== undefined) {
    data.purchasePrice =
      body.purchasePrice === null ? null : Math.round(body.purchasePrice);
  }
  if (body.condition !== undefined) data.condition = body.condition;
  if (body.notes !== undefined) {
    data.notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;
  }
  if (body.isPrivate !== undefined) data.isPrivate = body.isPrivate;

  const updated = await prisma.portfolioItem.update({
    where: { id },
    data,
    include: { card: { include: cardInclude } },
  });

  return NextResponse.json({ item: updated });
});

export const DELETE = apiHandler(async (_request: NextRequest, context: RouteContext) => {
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
});
