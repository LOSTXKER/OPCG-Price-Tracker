import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { buildPortfolioSnapshot } from "@/lib/portfolio/snapshot";

export const GET = cronHandler(async () => {
  const portfolios = await prisma.portfolio.findMany({
    include: {
      items: {
        include: {
          lots: {
            select: { quantity: true, unitCostJpy: true },
          },
          card: { select: { latestPriceJpy: true, latestPriceThb: true } },
        },
      },
    },
  });

  const snapshots = portfolios.flatMap((portfolio) => {
    const snapshot = buildPortfolioSnapshot(portfolio);
    return snapshot ? [snapshot] : [];
  });

  // One batched insert instead of N per-portfolio creates.
  if (snapshots.length > 0) {
    await prisma.portfolioSnapshot.createMany({ data: snapshots });
  }

  return { snapshotCount: snapshots.length };
});
