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

    let triggered = 0;
    for (const alert of activeAlerts) {
      const price = alert.card.latestPriceJpy;
      if (price == null) continue;

      const hit =
        (alert.direction === "ABOVE" && price >= alert.targetPrice) ||
        (alert.direction === "BELOW" && price <= alert.targetPrice);

      if (hit) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { isActive: false, triggeredAt: new Date() },
        });
        triggered++;
      }
    }

    return NextResponse.json({ ok: true, checked: activeAlerts.length, triggered });
  } catch (error) {
    console.error("cron/check-alerts:", error);
    const message = error instanceof Error ? error.message : "Alert check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
