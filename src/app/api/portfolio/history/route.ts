import { requireAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { createLog } from "@/lib/logger";
import { NextResponse } from "next/server";

const log = createLog("api:portfolio");

export async function GET() {
  try {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: auth.user.id },
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
        pnl: true,
        cardCount: true,
        snapshotAt: true,
      },
    });

    snapshots.reverse();

    return NextResponse.json({ snapshots });
  } catch (error) {
    log.error("GET /api/portfolio/history", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
