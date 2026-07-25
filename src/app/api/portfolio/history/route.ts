import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { getHonestPortfolioSnapshotPnl } from "@/lib/portfolio/snapshot";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async (request: NextRequest) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  // Optional ?portfolioId — scope the history line to one portfolio (the active
  // one) so the hero/scrub reflect exactly that book. Omit for the cross-book
  // union (legacy behaviour). The ownership filter keeps it user-scoped either way.
  const portfolioIdParam = request.nextUrl.searchParams.get("portfolioId");
  const portfolioId = portfolioIdParam ? parseInt(portfolioIdParam, 10) : null;
  if (portfolioIdParam && Number.isNaN(portfolioId)) {
    return NextResponse.json({ error: "Invalid portfolioId" }, { status: 400 });
  }

  const portfolios = await prisma.portfolio.findMany({
    where: { userId: auth.user.id, ...(portfolioId ? { id: portfolioId } : {}) },
    select: { id: true },
  });

  if (portfolios.length === 0) {
    return NextResponse.json({ snapshots: [] });
  }

  const portfolioIds = portfolios.map((p) => p.id);

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where: { portfolioId: { in: portfolioIds } },
    orderBy: { snapshotAt: "desc" },
    take: 90,
    select: {
      totalJpy: true,
      totalThb: true,
      totalCost: true,
      netInvestedJpy: true,
      pnl: true,
      cardCount: true,
      totalCopyCount: true,
      costedCopyCount: true,
      snapshotAt: true,
    },
  });

  snapshots.reverse();

  return NextResponse.json({
    snapshots: snapshots.map((snapshot) => ({
      ...snapshot,
      pnl: getHonestPortfolioSnapshotPnl(snapshot),
    })),
  });
});
