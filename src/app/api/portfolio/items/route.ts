import {
  CardCondition,
  Prisma,
  TransactionType,
} from "@/generated/prisma/client";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { cardInclude } from "@/lib/api/query-fragments";
import { prisma } from "@/lib/db";
import { triggerAchievementCheck } from "@/lib/honey";
import { effectiveTier, getLimits } from "@/lib/billing";
import {
  appendPortfolioLot,
  createPortfolioItemWithLot,
  ownerPortfolioLotOrderBy,
  ownerPortfolioLotSelect,
  portfolioLotDateFromInput,
  PortfolioLotQuantityError,
  toOwnerPortfolioItemDto,
} from "@/lib/portfolio/lots";
import { CreatePortfolioItemSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

const MAX_SERIALIZABLE_ATTEMPTS = 3;

class PortfolioItemRouteError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PortfolioItemRouteError";
  }
}

function isRetryableWriteConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "P2034" || error.code === "P2002")
  );
}

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreatePortfolioItemSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  const { portfolioId, cardId, quantity } = body;
  const purchasePrice = Math.round(body.purchasePrice);
  const condition = body.condition ?? CardCondition.NM;
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;
  const lotInput = {
    quantity,
    unitCostJpy: purchasePrice,
    acquiredAt: portfolioLotDateFromInput(body.acquiredAt),
    note: body.lotNote ?? null,
  };
  const tier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(tier);
  let result: { item: object; created: boolean } | null = null;

  for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      result = await prisma.$transaction(
        async (tx) => {
          const portfolio = await tx.portfolio.findUnique({
            where: { id: portfolioId },
            select: { userId: true },
          });
          if (!portfolio) {
            throw new PortfolioItemRouteError(404, "Portfolio not found");
          }
          if (portfolio.userId !== auth.user.id) {
            throw new PortfolioItemRouteError(403, "Forbidden");
          }

          const card = await tx.card.findUnique({
            where: { id: cardId },
            select: { id: true },
          });
          if (!card) {
            throw new PortfolioItemRouteError(404, "Card not found");
          }

          const existing = await tx.portfolioItem.findUnique({
            where: {
              portfolioId_cardId_condition: {
                portfolioId,
                cardId,
                condition,
              },
            },
            include: {
              lots: {
                orderBy: [...ownerPortfolioLotOrderBy],
                select: ownerPortfolioLotSelect,
              },
            },
          });

          if (!existing && limits.portfolioCards !== Infinity) {
            const totalCards = await tx.portfolioItem.count({
              where: { portfolio: { userId: auth.user.id } },
            });
            if (totalCards >= limits.portfolioCards) {
              throw new PortfolioItemRouteError(
                403,
                `Portfolio card limit reached (${limits.portfolioCards})`,
              );
            }
          }

          if (existing) {
            await appendPortfolioLot(tx, existing, lotInput);
            if (notes !== null) {
              await tx.portfolioItem.update({
                where: { id: existing.id },
                data: { notes },
              });
            }
          } else {
            await createPortfolioItemWithLot(tx, {
              portfolioId,
              cardId,
              condition,
              notes,
              lot: lotInput,
            });
          }

          await tx.portfolioTransaction.create({
            data: {
              portfolioId,
              cardId,
              type: TransactionType.BUY,
              quantity,
              pricePerUnit: purchasePrice,
              note: notes,
            },
          });

          const item = await tx.portfolioItem.findUniqueOrThrow({
            where: {
              portfolioId_cardId_condition: {
                portfolioId,
                cardId,
                condition,
              },
            },
            include: {
              card: { include: cardInclude },
              lots: {
                orderBy: [...ownerPortfolioLotOrderBy],
                select: ownerPortfolioLotSelect,
              },
            },
          });

          return {
            item: toOwnerPortfolioItemDto(item),
            created: !existing,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      break;
    } catch (error) {
      if (
        error instanceof PortfolioItemRouteError ||
        error instanceof PortfolioLotQuantityError
      ) {
        return NextResponse.json(
          { error: error.message },
          {
            status:
              error instanceof PortfolioItemRouteError ? error.status : 400,
          },
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

  if (!result) throw new Error("Portfolio item transaction did not complete");
  triggerAchievementCheck(auth.user.id);

  return NextResponse.json(
    { item: result.item },
    { status: result.created ? 201 : 200 },
  );
});
