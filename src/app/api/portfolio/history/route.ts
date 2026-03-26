import { getAuthUser } from "@/lib/api/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dbUser = await getAuthUser();
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolios = await prisma.portfolio.findMany({
      where: { userId: dbUser.id },
      select: { id: true },
    });

    if (portfolios.length === 0) {
      return NextResponse.json({ snapshots: [] });
    }

    const portfolioIds = portfolios.map((p) => p.id);

    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { portfolioId: { in: portfolioIds } },
      orderBy: { snapshotAt: "asc" },
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

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("GET /api/portfolio/history:", error);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
