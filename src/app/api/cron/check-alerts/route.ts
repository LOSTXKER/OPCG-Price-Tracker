import { cronHandler } from "@/lib/api/cron-auth";
import { baseCardCode } from "@/lib/cards/card-code";
import { prisma } from "@/lib/db";
import { priceAlertEmail } from "@/lib/email";
import { notify } from "@/lib/notify/dispatch";

export const GET = cronHandler(async () => {
  const activeAlerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: {
      card: { select: { latestPriceJpy: true, cardCode: true, nameJp: true, nameEn: true } },
    },
  });

  const now = new Date();
  const triggeredIds: number[] = [];
  let emailsSent = 0;
  let lineSent = 0;
  let webSent = 0;

  for (const alert of activeAlerts) {
    const price = alert.card.latestPriceJpy;
    if (price == null) continue;
    const hit =
      (alert.direction === "ABOVE" && price >= alert.targetPrice) ||
      (alert.direction === "BELOW" && price <= alert.targetPrice);
    if (!hit) continue;

    triggeredIds.push(alert.id);

    const cardName = alert.card.nameEn ?? alert.card.nameJp;
    const verb = alert.direction === "BELOW" ? "dropped to" : "rose to";
    const emoji = alert.direction === "BELOW" ? "📉" : "📈";

    // The PriceAlert.channels array (per-alert override) intersects with
    // the user's global notification prefs handled by the orchestrator.
    // PriceAlert uses `PUSH` for in-app/web — translate to the
    // orchestrator's `WEB` channel.
    const requestedChannels: ReadonlyArray<"WEB" | "EMAIL" | "LINE"> =
      alert.channels.length > 0
        ? alert.channels.map((c) => (c === "PUSH" ? "WEB" : c))
        : ["WEB", "EMAIL"];

    const { subject, html } = priceAlertEmail(
      cardName,
      alert.card.cardCode,
      price,
      alert.targetPrice,
      alert.direction,
    );

    const dispatched = await notify({
      userId: alert.userId,
      kind: "PRICE_ALERT",
      type: "PRICE_ALERT",
      title: `${emoji} ${cardName} ${verb} ¥${price.toLocaleString()}`,
      message: `Target was ¥${alert.targetPrice.toLocaleString()}.`,
      data: {
        alertId: alert.id,
        cardCode: alert.card.cardCode,
        price,
        targetPrice: alert.targetPrice,
        direction: alert.direction,
      },
      channels: requestedChannels,
      email: { subject, html },
      // Printed card number in the message text; `data.cardCode` above keeps
      // the full code because it is the deep-link key, not copy.
      lineText:
        `${emoji} ${cardName} (${baseCardCode(alert.card.cardCode)}) ${verb} ¥${price.toLocaleString()}\n` +
        `Target was ¥${alert.targetPrice.toLocaleString()}.`,
      dedupKey: `price-alert:${alert.id}`,
    });

    if (dispatched.email) emailsSent++;
    if (dispatched.line) lineSent++;
    if (dispatched.web) webSent++;
  }

  if (triggeredIds.length > 0) {
    await prisma.priceAlert.updateMany({
      where: { id: { in: triggeredIds } },
      data: { isActive: false, triggeredAt: now },
    });
  }

  return {
    checked: activeAlerts.length,
    triggered: triggeredIds.length,
    emailsSent,
    lineSent,
    webSent,
  };
});
