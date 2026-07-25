import { Prisma, TransactionType } from "@/generated/prisma/client";
import { apiHandler } from "@/lib/api/api-handler";
import { requireAuthUser } from "@/lib/api/auth";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import {
  deletePortfolioLot,
  ownerPortfolioLotOrderBy,
  ownerPortfolioLotSelect,
  portfolioLotDateFromInput,
  PortfolioLotQuantityError,
  toOwnerPortfolioItemDto,
  updatePortfolioLot,
} from "@/lib/portfolio/lots";
import { UpdatePortfolioLotSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ lotId: string }> };
const MAX_SERIALIZABLE_ATTEMPTS = 3;

function isRetryableWriteConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

function parseLotId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const PATCH = apiHandler(
  async (request: NextRequest, context: RouteContext) => {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { lotId: lotIdParam } = await context.params;
    const lotId = parseLotId(lotIdParam);
    if (lotId === null) {
      return NextResponse.json(
        { error: "Invalid lot id" },
        { status: 400 },
      );
    }

    const parsed = await parseJsonBody(request, UpdatePortfolioLotSchema);
    if (!parsed.ok) return parsed.response;
    const input = {
      ...(parsed.body.quantity !== undefined
        ? { quantity: parsed.body.quantity }
        : {}),
      ...(parsed.body.unitCostJpy !== undefined
        ? { unitCostJpy: parsed.body.unitCostJpy }
        : {}),
      ...(parsed.body.acquiredAt !== undefined
        ? {
            acquiredAt: portfolioLotDateFromInput(parsed.body.acquiredAt),
          }
        : {}),
      ...(parsed.body.note !== undefined ? { note: parsed.body.note } : {}),
    };

    for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
      try {
        const result = await prisma.$transaction(
          async (tx) => {
            const lot = await tx.portfolioLot.findUnique({
              where: { id: lotId },
              include: {
                portfolioItem: {
                  include: {
                    portfolio: { select: { userId: true } },
                    lots: {
                      orderBy: [...ownerPortfolioLotOrderBy],
                      select: ownerPortfolioLotSelect,
                    },
                  },
                },
              },
            });
            if (!lot) {
              return { error: "Lot not found", status: 404 } as const;
            }
            if (lot.portfolioItem.portfolio.userId !== auth.user.id) {
              return { error: "Forbidden", status: 403 } as const;
            }

            const financialsChanged =
              (input.quantity !== undefined &&
                input.quantity !== lot.quantity) ||
              (input.unitCostJpy !== undefined &&
                input.unitCostJpy !== lot.unitCostJpy);
            const updated = await updatePortfolioLot(
              tx,
              lot.portfolioItem,
              lotId,
              input,
            );
            if (financialsChanged) {
              await tx.portfolioTransaction.create({
                data: {
                  portfolioId: lot.portfolioItem.portfolioId,
                  cardId: lot.portfolioItem.cardId,
                  type: TransactionType.REMOVE,
                  quantity: lot.quantity,
                  pricePerUnit: lot.unitCostJpy,
                  note: lot.note,
                },
              });
              await tx.portfolioTransaction.create({
                data: {
                  portfolioId: lot.portfolioItem.portfolioId,
                  cardId: lot.portfolioItem.cardId,
                  type: TransactionType.BUY,
                  quantity: updated.lot.quantity,
                  pricePerUnit: updated.lot.unitCostJpy,
                  note: updated.lot.note,
                },
              });
            }
            const finalItem = await tx.portfolioItem.findUniqueOrThrow({
              where: { id: lot.portfolioItemId },
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
              lot: updated.lot,
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
        return NextResponse.json({ item: result.item, lot: result.lot });
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

export const DELETE = apiHandler(
  async (_request: NextRequest, context: RouteContext) => {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { lotId: lotIdParam } = await context.params;
    const lotId = parseLotId(lotIdParam);
    if (lotId === null) {
      return NextResponse.json(
        { error: "Invalid lot id" },
        { status: 400 },
      );
    }

    for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
      try {
        const result = await prisma.$transaction(
          async (tx) => {
            const lot = await tx.portfolioLot.findUnique({
              where: { id: lotId },
              include: {
                portfolioItem: {
                  include: {
                    portfolio: { select: { userId: true } },
                    lots: {
                      orderBy: [...ownerPortfolioLotOrderBy],
                      select: ownerPortfolioLotSelect,
                    },
                  },
                },
              },
            });
            if (!lot) {
              return { error: "Lot not found", status: 404 } as const;
            }
            if (lot.portfolioItem.portfolio.userId !== auth.user.id) {
              return { error: "Forbidden", status: 403 } as const;
            }

            const deletion = await deletePortfolioLot(
              tx,
              lot.portfolioItem,
              lotId,
            );
            await tx.portfolioTransaction.create({
              data: {
                portfolioId: lot.portfolioItem.portfolioId,
                cardId: lot.portfolioItem.cardId,
                type: TransactionType.REMOVE,
                quantity: deletion.deletedLot.quantity,
                pricePerUnit: deletion.deletedLot.unitCostJpy,
                note: deletion.deletedLot.note,
              },
            });

            if (deletion.deletedItem) {
              return { deletedItem: true, item: null } as const;
            }

            const finalItem = await tx.portfolioItem.findUniqueOrThrow({
              where: { id: lot.portfolioItemId },
              include: {
                card: { include: cardInclude },
                lots: {
                  orderBy: [...ownerPortfolioLotOrderBy],
                  select: ownerPortfolioLotSelect,
                },
              },
            });
            return {
              deletedItem: false,
              item: toOwnerPortfolioItemDto(finalItem),
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
        return NextResponse.json({
          ok: true,
          deletedItem: result.deletedItem,
          item: result.item,
        });
      } catch (error) {
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
