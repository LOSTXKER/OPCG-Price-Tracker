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
    const activeAlerts = await prisma.priceAlert.findMany({
      where: { isActive: true },
      include: {
        card: { select: { cardCode: true, nameJp: true, latestPriceJpy: true } },
        user: { select: { email: true, displayName: true } },
      },
    });

    let triggered = 0;

    for (const alert of activeAlerts) {
      const currentPrice = alert.card.latestPriceJpy;
      if (currentPrice == null) continue;

      const shouldTrigger =
        (alert.direction === "ABOVE" && currentPrice >= alert.targetPrice) ||
        (alert.direction === "BELOW" && currentPrice <= alert.targetPrice);

      if (!shouldTrigger) continue;

      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: { isActive: false, triggeredAt: new Date() },
      });

      // TODO: Send email/LINE notification to alert.user.email
      // For now, just log it
      console.log(
        `Alert triggered: ${alert.card.nameJp} (${alert.card.cardCode}) ` +
          `price ¥${currentPrice} ${alert.direction} ¥${alert.targetPrice} ` +
          `-> notify ${alert.user.email}`
      );

      triggered++;
    }

    return NextResponse.json({
      ok: true,
      checked: activeAlerts.length,
      triggered,
    });
  } catch (error) {
    console.error("cron/check-alerts:", error);
    const message = error instanceof Error ? error.message : "Alert check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
