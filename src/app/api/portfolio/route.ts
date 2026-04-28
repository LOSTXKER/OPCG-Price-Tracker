import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { effectiveTier, getLimits } from "@/lib/billing";
import { CreatePortfolioSchema } from "@/lib/portfolio/schemas";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: auth.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        include: { card: { include: cardInclude } },
      },
    },
  });

  return NextResponse.json({ portfolios });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody(request, CreatePortfolioSchema);
  if (!parsed.ok) return parsed.response;

  const name = parsed.body.name;

  const tier = effectiveTier(auth.user.tier, auth.user.tierExpiresAt);
  const limits = getLimits(tier);
  if (limits.portfolioCount !== Infinity) {
    const count = await prisma.portfolio.count({ where: { userId: auth.user.id } });
    if (count >= limits.portfolioCount) {
      return NextResponse.json(
        { error: `Portfolio limit reached (${limits.portfolioCount})` },
        { status: 403 }
      );
    }
  }

  const portfolio = await prisma.portfolio.create({
    data: {
      userId: auth.user.id,
      name,
    },
    include: {
      items: {
        include: { card: { include: cardInclude } },
      },
    },
  });

  return NextResponse.json({ portfolio }, { status: 201 });
});
