import { Prisma, TransactionType } from "@/generated/prisma/client";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { triggerAchievementCheck } from "@/lib/honey";
import {
  appendPortfolioLot,
  ownerPortfolioLotOrderBy,
  ownerPortfolioLotSelect,
  portfolioLotDateFromInput,
  PortfolioLotQuantityError,
  toOwnerPortfolioItemDto,
} from "@/lib/portfolio/lots";
import { CreatePortfolioLotSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };
const MAX_SERIALIZABLE_ATTEMPTS = 3;

function isRetryableWriteConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export const POST = apiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json(
        { error: "Invalid item id" },
        { status: 400 },
      );
    }

    const parsed = await parseJsonBody(request, CreatePortfolioLotSchema);
    if (!parsed.ok) return parsed.response;
    const input = {
      quantity: parsed.body.quantity,
      unitCostJpy: parsed.body.unitCostJpy,
      acquiredAt: portfolioLotDateFromInput(parsed.body.acquiredAt),
      note: parsed.body.note ?? null,
    };

    for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
      try {
        const result = await prisma.$transaction(
          async (tx) => {
            const item = await tx.portfolioItem.findUnique({
              where: { id },
              include: {
                portfolio: { select: { userId: true } },
                lots: {
                  orderBy: [...ownerPortfolioLotOrderBy],
                  select: ownerPortfolioLotSelect,
                },
              },
            });
            if (!item) {
              return { error: "Item not found", status: 404 } as const;
            }
            if (item.portfolio.userId !== auth.user.id) {
              return { error: "Forbidden", status: 403 } as const;
            }

            const { lot } = await appendPortfolioLot(tx, item, input);
            await tx.portfolioTransaction.create({
              data: {
                portfolioId: item.portfolioId,
                cardId: item.cardId,
                type: TransactionType.BUY,
                quantity: input.quantity,
                pricePerUnit: input.unitCostJpy,
                note: input.note,
              },
            });

            const finalItem = await tx.portfolioItem.findUniqueOrThrow({
              where: { id },
              include: {
                card: { include: cardInclude },
                lots: {
                  orderBy: [...ownerPortfolioLotOrderBy],
                  select: ownerPortfolioLotSelect,
                },
              },
            });

            return {
              item: toOwnerPortfolioItemDto(finalItem),
              lot,
            } as const;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        if ("error" in result) {
          return NextResponse.json(
            { error: result.error },
            { status: result.status },
          );
        }

        triggerAchievementCheck(auth.user.id);
        return NextResponse.json(
          { item: result.item, lot: result.lot },
          { status: 201 },
        );
      } catch (error) {
        if (error instanceof PortfolioLotQuantityError) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 },
          );
        }
        if (
          isRetryableWriteConflict(error) &&
          attempt < MAX_SERIALIZABLE_ATTEMPTS - 1
        ) {
          continue;
        }
        throw error;
      }
    }

    throw new Error("Portfolio lot transaction did not complete");
  },
);
