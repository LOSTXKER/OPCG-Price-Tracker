import { authorizeCron } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const activeAlerts = await prisma.priceAlert.findMany({
      where: { isActive: true },
      include: {
        card: { select: { latestPriceJpy: true, cardCode: true } },
        user: { select: { email: true } },
      },
    });

    const now = new Date();
    const triggeredIds: number[] = [];

    for (const alert of activeAlerts) {
      const price = alert.card.latestPriceJpy;
      if (price == null) continue;
      const hit =
        (alert.direction === "ABOVE" && price >= alert.targetPrice) ||
        (alert.direction === "BELOW" && price <= alert.targetPrice);
      if (hit) triggeredIds.push(alert.id);
    }

    if (triggeredIds.length > 0) {
      await prisma.priceAlert.updateMany({
        where: { id: { in: triggeredIds } },
        data: { isActive: false, triggeredAt: now },
      });
    }

    return NextResponse.json({ ok: true, checked: activeAlerts.length, triggered: triggeredIds.length });
  } catch (error) {
    console.error("cron/check-alerts:", error);
    const message = error instanceof Error ? error.message : "Alert check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
