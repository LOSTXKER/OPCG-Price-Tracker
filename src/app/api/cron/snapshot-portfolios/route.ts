import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function authorizeCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret === "your-cron-secret-here") return false;
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;
  return header.slice(7).trim() === secret;
}

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        items: {
          include: {
            card: { select: { latestPriceJpy: true, latestPriceThb: true } },
          },
        },
      },
    });

    let snapshotCount = 0;
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

      await prisma.portfolioSnapshot.create({
        data: {
          portfolioId: portfolio.id,
          totalJpy,
          totalThb,
          totalCost,
          pnl: totalJpy - totalCost,
          cardCount: portfolio.items.length,
        },
      });
      snapshotCount++;
    }

    return NextResponse.json({ ok: true, snapshotCount });
  } catch (error) {
    console.error("cron/snapshot-portfolios:", error);
    const message = error instanceof Error ? error.message : "Snapshot failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
