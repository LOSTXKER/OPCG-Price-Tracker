import {
  CardCondition,
  type CardCondition as CardConditionType,
} from "@/generated/prisma/client";
import { getAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const CONDITIONS = new Set<string>(Object.values(CardCondition));

function parseCondition(value: unknown): CardConditionType | null {
  if (typeof value !== "string" || !CONDITIONS.has(value)) return null;
  return value as CardConditionType;
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const portfolioId = typeof body.portfolioId === "number" ? body.portfolioId : Number(body.portfolioId);
    const cardId = typeof body.cardId === "number" ? body.cardId : Number(body.cardId);
    const quantityRaw =
      typeof body.quantity === "number" ? body.quantity : Number(body.quantity ?? 1);
    const purchasePrice =
      body.purchasePrice === null || body.purchasePrice === undefined
        ? null
        : typeof body.purchasePrice === "number"
          ? body.purchasePrice
          : Number(body.purchasePrice);
    const condition = parseCondition(body.condition) ?? CardCondition.NM;
    const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;

    if (!Number.isInteger(portfolioId) || portfolioId < 1) {
      return NextResponse.json({ error: "Invalid portfolioId" }, { status: 400 });
    }
    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }
    if (!Number.isInteger(quantityRaw) || quantityRaw < 1 || quantityRaw > 9999) {
      return NextResponse.json({ error: "quantity must be an integer from 1 to 9999" }, { status: 400 });
    }
    if (purchasePrice !== null && (!Number.isFinite(purchasePrice) || purchasePrice < 0)) {
      return NextResponse.json({ error: "Invalid purchasePrice" }, { status: 400 });
    }
    if (body.condition !== undefined && parseCondition(body.condition) === null) {
      return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
    }
    if (body.notes !== undefined && typeof body.notes !== "string") {
      return NextResponse.json({ error: "notes must be a string" }, { status: 400 });
    }

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
            quantity: existing.quantity + quantityRaw,
            ...(purchasePrice !== null ? { purchasePrice: Math.round(purchasePrice) } : {}),
            ...(typeof body.notes === "string" ? { notes: body.notes.slice(0, 2000) } : {}),
          },
          include: {
            card: { include: cardInclude },
          },
        })
      : await prisma.portfolioItem.create({
          data: {
            portfolioId,
            cardId,
            quantity: quantityRaw,
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
        type: "BUY",
        quantity: quantityRaw,
        pricePerUnit: purchasePrice !== null ? Math.round(purchasePrice) : null,
        note: notes,
      },
    });

    return NextResponse.json({ item }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("POST /api/portfolio/items:", error);
    return NextResponse.json({ error: "Failed to add portfolio item" }, { status: 500 });
  }
}
