import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { cardInclude, gameCardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { effectiveTier, getLimits } from "@/lib/billing";
import { CreatePortfolioSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

const MAX_SERIALIZABLE_ATTEMPTS = 3;

class PortfolioRouteError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PortfolioRouteError";
  }
}

function isSerializableConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: auth.user.id },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        include: { card: { include: gameCardInclude } },
      },
    },
  });

  const tier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(tier);

  return NextResponse.json({
    portfolios,
    effectiveTier: tier,
    limits: {
      portfolioCount:
        limits.portfolioCount === Infinity ? null : limits.portfolioCount,
      portfolioCards:
        limits.portfolioCards === Infinity ? null : limits.portfolioCards,
    },
  });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreatePortfolioSchema);
  if (!parsed.ok) return parsed.response;

  const { name, isPublic } = parsed.body;

  const tier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(tier);
  let portfolio: Awaited<ReturnType<typeof prisma.portfolio.create>> | null = null;
  for (let attempt = 0; attempt < MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      portfolio = await prisma.$transaction(
        async (tx) => {
          if (limits.portfolioCount !== Infinity) {
            const count = await tx.portfolio.count({
              where: { userId: auth.user.id },
            });
            if (count >= limits.portfolioCount) {
              throw new PortfolioRouteError(
                403,
                `Portfolio limit reached (${limits.portfolioCount})`,
              );
            }
          }

          return tx.portfolio.create({
            data: {
              userId: auth.user.id,
              name,
              isPublic,
            },
            include: {
              items: {
                include: { card: { include: cardInclude } },
              },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      break;
    } catch (error) {
      if (error instanceof PortfolioRouteError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status },
        );
      }
      if (
        isSerializableConflict(error) &&
        attempt < MAX_SERIALIZABLE_ATTEMPTS - 1
      ) {
        continue;
      }
      throw error;
    }
  }

  if (!portfolio) throw new Error("Portfolio transaction did not complete");

  return NextResponse.json({ portfolio }, { status: 201 });
});
