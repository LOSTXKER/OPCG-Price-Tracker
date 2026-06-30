import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";

export const GET = cronHandler(async () => {
  const portfolios = await prisma.portfolio.findMany({
    include: {
      items: {
        include: {
          card: { select: { latestPriceJpy: true, latestPriceThb: true } },
        },
      },
    },
  });

  const snapshots = [];
  for (const portfolio of portfolios) {
    if (portfolio.items.length === 0) continue;

    let totalJpy = 0;
    let totalThb = 0;
    let totalCost = 0;
    for (const item of portfolio.items) {
      const priceJpy = item.card.latestPriceJpy ?? 0;
      const priceThb = item.card.latestPriceThb ?? 0;
      totalJpy += priceJpy * item.quantity;
      totalThb += priceThb * item.quantity;
      totalCost += (item.purchasePrice ?? 0) * item.quantity;
    }

    snapshots.push({
      portfolioId: portfolio.id,
      totalJpy,
      totalThb,
      totalCost,
      // Net cash deployed into currently-held cards. Equal to cost basis today
      // (no realized-sale flow yet), stored as its own field so the value line
      // can be drawn against an "invested" baseline — adding a card lifts both,
      // so inflow never reads as gain. See VISION §5.3.
      netInvestedJpy: totalCost,
      pnl: totalJpy - totalCost,
      cardCount: portfolio.items.length,
    });
  }

  // One batched insert instead of N per-portfolio creates.
  if (snapshots.length > 0) {
    await prisma.portfolioSnapshot.createMany({ data: snapshots });
  }

  return { snapshotCount: snapshots.length };
});
