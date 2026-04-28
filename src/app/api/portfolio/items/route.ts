import { CardCondition, TransactionType } from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { cardInclude } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { triggerAchievementCheck } from "@/lib/honey";
import { effectiveTier, getLimits } from "@/lib/billing";
import { CreatePortfolioItemSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const dbUser = auth.user;

  const parsed = await parseJsonBody(request, CreatePortfolioItemSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const portfolioId = body.portfolioId;
  const cardId = body.cardId;
  const quantity = body.quantity;
  const purchasePrice = body.purchasePrice ?? null;
  const condition = body.condition ?? CardCondition.NM;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;

  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId: dbUser.id },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const card = await prisma.card.findUnique({ where: { id: cardId } });
  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const tier = effectiveTier(dbUser.tier, dbUser.tierExpiresAt);
  const limits = getLimits(tier);
  if (limits.portfolioCards !== Infinity) {
    const totalCards = await prisma.portfolioItem.count({
      where: { portfolio: { userId: dbUser.id } },
    });
    if (totalCards >= limits.portfolioCards) {
      return NextResponse.json(
        { error: `Portfolio card limit reached (${limits.portfolioCards})` },
        { status: 403 }
      );
    }
  }

  const existing = await prisma.portfolioItem.findUnique({
    where: {
      portfolioId_cardId_condition: {
        portfolioId,
        cardId,
        condition,
      },
    },
  });

  const item = existing
    ? await prisma.portfolioItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + quantity,
          ...(purchasePrice !== null ? { purchasePrice: Math.round(purchasePrice) } : {}),
          ...(notes !== null ? { notes } : {}),
        },
        include: {
          card: { include: cardInclude },
        },
      })
    : await prisma.portfolioItem.create({
        data: {
          portfolioId,
          cardId,
          quantity,
          purchasePrice: purchasePrice !== null ? Math.round(purchasePrice) : null,
          condition,
          notes,
        },
        include: {
          card: { include: cardInclude },
        },
      });

  await prisma.portfolioTransaction.create({
    data: {
      portfolioId,
      cardId,
      type: TransactionType.BUY,
      quantity,
      pricePerUnit: purchasePrice !== null ? Math.round(purchasePrice) : null,
      note: notes,
    },
  });

  triggerAchievementCheck(dbUser.id);

  return NextResponse.json({ item }, { status: existing ? 200 : 201 });
});
