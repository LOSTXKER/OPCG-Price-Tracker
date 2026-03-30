import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { sendEmail, priceAlertEmail } from "@/lib/email";
import { sendLinePriceAlert } from "@/lib/line";

export const GET = cronHandler(async () => {
  const activeAlerts = await prisma.priceAlert.findMany({
    where: { isActive: true },
    include: {
      card: { select: { latestPriceJpy: true, cardCode: true, nameJp: true, nameEn: true } },
      user: { select: { email: true, lineUserId: true, emailAlerts: true, lineAlerts: true } },
    },
  });

  const now = new Date();
  const triggeredIds: number[] = [];
  let emailsSent = 0;
  let lineSent = 0;

  for (const alert of activeAlerts) {
    const price = alert.card.latestPriceJpy;
    if (price == null) continue;
    const hit =
      (alert.direction === "ABOVE" && price >= alert.targetPrice) ||
      (alert.direction === "BELOW" && price <= alert.targetPrice);
    if (!hit) continue;

    triggeredIds.push(alert.id);

    const cardName = alert.card.nameEn ?? alert.card.nameJp;

    if (alert.user.emailAlerts && (alert.channel === "EMAIL" || !alert.channel)) {
      const { subject, html } = priceAlertEmail(
        cardName,
        alert.card.cardCode,
        price,
        alert.targetPrice,
        alert.direction,
      );
      const result = await sendEmail({ to: alert.user.email, subject, html });
      if (result) emailsSent++;
    }

    if (alert.user.lineAlerts && alert.user.lineUserId && alert.channel === "LINE") {
      const ok = await sendLinePriceAlert(
        alert.user.lineUserId,
        cardName,
        alert.card.cardCode,
        price,
        alert.direction,
      );
      if (ok) lineSent++;
    }
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
  };
});
