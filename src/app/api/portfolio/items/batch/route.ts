import {
  CardCondition,
  Prisma,
  TransactionType,
} from "@/generated/prisma/client";
import { createHash } from "node:crypto";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { effectiveTier, getLimits } from "@/lib/billing";
import { MAX_LISTING_QUANTITY } from "@/lib/constants/ui";
import { prisma } from "@/lib/db";
import { triggerAchievementCheck } from "@/lib/honey";
import { CreatePortfolioItemsBatchSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

const BATCH_NOTE_PREFIX = "__portfolio_batch__:";
const MAX_SERIALIZABLE_ATTEMPTS = 3;

class BatchRouteError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BatchRouteError";
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

function getPayloadHash(
  portfolioId: number,
  items: Array<{
    cardId: number;
    quantity: number;
    purchasePrice: number | null;
    condition: CardCondition;
    notes: string | null;
  }>,
): string {
  const canonicalItems = [...items].sort(
    (a, b) => a.cardId - b.cardId || a.condition.localeCompare(b.condition),
  );
  return createHash("sha256")
    .update(JSON.stringify({ portfolioId, items: canonicalItems }))
    .digest("hex");
}

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreatePortfolioItemsBatchSchema);
  if (!parsed.ok) return parsed.response;

  const { portfolioId, requestId } = parsed.body;
  const items = parsed.body.items.map((item) => ({
    cardId: item.cardId,
    quantity: item.quantity,
    purchasePrice:
      item.purchasePrice == null ? null : Math.round(item.purchasePrice),
    condition: item.condition ?? CardCondition.NM,
    notes: item.notes ?? null,
  }));
  const markerPrefix = `${BATCH_NOTE_PREFIX}${requestId}:`;
  const marker = `${markerPrefix}${getPayloadHash(portfolioId, items)}`;
  const tier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(tier);

  let result: {
    added: number;
    updated: number;
    replayed: boolean;
  } | null = null;

  for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      result = await prisma.$transaction(
        async (tx) => {
        const portfolio = await tx.portfolio.findUnique({
          where: { id: portfolioId },
          select: { userId: true },
        });
        if (!portfolio) throw new BatchRouteError(404, "Portfolio not found");
        if (portfolio.userId !== auth.user.id) {
          throw new BatchRouteError(403, "Forbidden");
        }

        // A response can be lost after commit. The client retries with the same
        // requestId, so detect the committed transaction before touching rows.
        const replay = await tx.portfolioTransaction.findFirst({
          where: { portfolioId, note: { startsWith: markerPrefix } },
          select: { id: true, note: true },
        });
        if (replay) {
          if (replay.note !== marker) {
            throw new BatchRouteError(
              409,
              "Request ID was already used for a different batch",
            );
          }
          return { added: 0, updated: 0, replayed: true };
        }

        const cardIds = [...new Set(items.map((item) => item.cardId))];
        const cards = await tx.card.findMany({
          where: { id: { in: cardIds } },
          select: { id: true },
        });
        const foundCardIds = new Set(cards.map((card) => card.id));
        const missingCardId = cardIds.find((id) => !foundCardIds.has(id));
        if (missingCardId != null) {
          throw new BatchRouteError(404, `Card not found (${missingCardId})`);
        }

        const existingRows = await tx.portfolioItem.findMany({
          where: {
            portfolioId,
            cardId: { in: cardIds },
            condition: { in: [...new Set(items.map((item) => item.condition))] },
          },
          select: {
            id: true,
            cardId: true,
            condition: true,
            quantity: true,
          },
        });
        const existingByKey = new Map(
          existingRows.map((item) => [
            `${item.cardId}:${item.condition}`,
            item,
          ]),
        );
        const quantityOverflow = items.find((item) => {
          const existing = existingByKey.get(`${item.cardId}:${item.condition}`);
          return (
            existing != null &&
            existing.quantity + item.quantity > MAX_LISTING_QUANTITY
          );
        });
        if (quantityOverflow) {
          throw new BatchRouteError(
            400,
            `Quantity cannot exceed ${MAX_LISTING_QUANTITY}`,
          );
        }
        const newHoldingCount = items.filter(
          (item) => !existingByKey.has(`${item.cardId}:${item.condition}`),
        ).length;

        if (limits.portfolioCards !== Infinity && newHoldingCount > 0) {
          const totalHoldings = await tx.portfolioItem.count({
            where: { portfolio: { userId: auth.user.id } },
          });
          if (totalHoldings + newHoldingCount > limits.portfolioCards) {
            throw new BatchRouteError(
              403,
              `Portfolio card limit reached (${limits.portfolioCards})`,
            );
          }
        }

        let added = 0;
        let updated = 0;
        for (const item of items) {
          const key = `${item.cardId}:${item.condition}`;
          const existing = existingByKey.get(key);
          if (existing) {
            await tx.portfolioItem.update({
              where: { id: existing.id },
              data: {
                quantity: existing.quantity + item.quantity,
                ...(item.purchasePrice !== null
                  ? { purchasePrice: item.purchasePrice }
                  : {}),
                ...(item.notes !== null ? { notes: item.notes } : {}),
              },
            });
            updated += 1;
          } else {
            await tx.portfolioItem.create({
              data: {
                portfolioId,
                cardId: item.cardId,
                quantity: item.quantity,
                purchasePrice: item.purchasePrice,
                condition: item.condition,
                notes: item.notes,
              },
            });
            added += 1;
          }

          await tx.portfolioTransaction.create({
            data: {
              portfolioId,
              cardId: item.cardId,
              type: TransactionType.BUY,
              quantity: item.quantity,
              pricePerUnit: item.purchasePrice,
              note: marker,
            },
          });
        }

        return { added, updated, replayed: false };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      break;
    } catch (error) {
      if (error instanceof BatchRouteError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
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

  if (!result) throw new Error("Portfolio batch transaction did not complete");
  if (!result.replayed) triggerAchievementCheck(auth.user.id);

  return NextResponse.json({ ok: true, ...result });
});
