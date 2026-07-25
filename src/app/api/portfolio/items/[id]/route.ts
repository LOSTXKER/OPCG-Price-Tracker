import { Prisma, TransactionType } from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import {
  ownerPortfolioLotOrderBy,
  ownerPortfolioLotSelect,
  PortfolioLotConflictError,
  PortfolioLotQuantityError,
  portfolioLotDateFromInput,
  toOwnerPortfolioItemDto,
  updateSinglePortfolioLotCompatibility,
} from "@/lib/portfolio/lots";
import { UpdatePortfolioItemSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };
const MAX_SERIALIZABLE_ATTEMPTS = 3;

function isRetryableWriteConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2034" || error.code === "P2002")
  );
}

export const PATCH = apiHandler(async (request: NextRequest, context: RouteContext) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
  }

  const parsed = await parseJsonBody(request, UpdatePortfolioItemSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      const updated = await prisma.$transaction(
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

          if (
            body.quantity !== undefined ||
            body.purchasePrice !== undefined ||
            body.acquiredAt !== undefined ||
            body.lotNote !== undefined
          ) {
            const currentLot = item.lots[0] ?? {
              quantity: item.quantity,
              unitCostJpy: item.purchasePrice,
              note: null,
            };
            const nextUnitCostJpy =
              body.purchasePrice === undefined
                ? undefined
                : body.purchasePrice === null
                  ? null
                  : Math.round(body.purchasePrice);
            const financialsChanged =
              (body.quantity !== undefined &&
                body.quantity !== currentLot.quantity) ||
              (nextUnitCostJpy !== undefined &&
                nextUnitCostJpy !== currentLot.unitCostJpy);
            const lotUpdate = await updateSinglePortfolioLotCompatibility(
              tx,
              item,
              {
                ...(body.quantity !== undefined
                  ? { quantity: body.quantity }
                  : {}),
                ...(nextUnitCostJpy !== undefined
                  ? { unitCostJpy: nextUnitCostJpy }
                  : {}),
                ...(body.acquiredAt !== undefined
                  ? {
                      acquiredAt: portfolioLotDateFromInput(body.acquiredAt),
                    }
                  : {}),
                ...(body.lotNote !== undefined
                  ? { note: body.lotNote }
                  : {}),
              },
            );

            if (financialsChanged) {
              await tx.portfolioTransaction.create({
                data: {
                  portfolioId: item.portfolioId,
                  cardId: item.cardId,
                  type: TransactionType.REMOVE,
                  quantity: currentLot.quantity,
                  pricePerUnit: currentLot.unitCostJpy,
                  note: currentLot.note,
                },
              });
              await tx.portfolioTransaction.create({
                data: {
                  portfolioId: item.portfolioId,
                  cardId: item.cardId,
                  type: TransactionType.BUY,
                  quantity: lotUpdate.lot.quantity,
                  pricePerUnit: lotUpdate.lot.unitCostJpy,
                  note: lotUpdate.lot.note,
                },
              });
            }
          }

          const data: Record<string, unknown> = {};
          if (body.condition !== undefined) data.condition = body.condition;
          if (body.notes !== undefined) {
            data.notes =
              typeof body.notes === "string"
                ? body.notes.slice(0, 2000)
                : null;
          }
          if (body.isPrivate !== undefined) data.isPrivate = body.isPrivate;
          if (Object.keys(data).length > 0) {
            await tx.portfolioItem.update({ where: { id }, data });
          }

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
          return { item: toOwnerPortfolioItemDto(finalItem) } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if ("error" in updated) {
        return NextResponse.json(
          { error: updated.error },
          { status: updated.status },
        );
      }
      return NextResponse.json({ item: updated.item });
    } catch (error) {
      if (error instanceof PortfolioLotConflictError) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 },
        );
      }
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
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "A holding already uses this condition" },
          { status: 409 },
        );
      }
      throw error;
    }
  }

  throw new Error("Portfolio item transaction did not complete");
});

export const DELETE = apiHandler(async (_request: NextRequest, context: RouteContext) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id < 1) {
    return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
  }

  for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const item = await tx.portfolioItem.findUnique({
            where: { id },
            include: {
              portfolio: { select: { userId: true, id: true } },
              lots: {
                select: {
                  quantity: true,
                  unitCostJpy: true,
                  note: true,
                },
              },
            },
          });

          if (!item) {
            return { error: "Item not found", status: 404 } as const;
          }
          if (item.portfolio.userId !== auth.user.id) {
            return { error: "Forbidden", status: 403 } as const;
          }

          const removedLots =
            item.lots.length > 0
              ? item.lots
              : [
                  {
                    quantity: item.quantity,
                    unitCostJpy: item.purchasePrice,
                    note: null,
                  },
                ];
          for (const lot of removedLots) {
            await tx.portfolioTransaction.create({
              data: {
                portfolioId: item.portfolioId,
                cardId: item.cardId,
                type: TransactionType.REMOVE,
                quantity: lot.quantity,
                pricePerUnit: lot.unitCostJpy,
                note: lot.note,
              },
            });
          }
          await tx.portfolioItem.delete({ where: { id } });
          return { ok: true } as const;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if ("error" in result) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        );
      }
      return NextResponse.json({ ok: true });
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

  throw new Error("Portfolio item transaction did not complete");
});
