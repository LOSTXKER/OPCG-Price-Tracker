import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { sendEmail, trialReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export const GET = cronHandler(async () => {
  const now = new Date();

  const expired = await prisma.user.updateMany({
    where: {
      tier: { in: ["PRO", "PRO_PLUS"] },
      trialStartedAt: { not: null },
      stripeSubscriptionId: null,
      tierExpiresAt: { lte: now },
    },
    data: { tier: "FREE" },
  });

  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(threeDaysFromNow.getTime() - 24 * 60 * 60 * 1000);

  const aboutToExpire = await prisma.user.findMany({
    where: {
      trialStartedAt: { not: null },
      stripeSubscriptionId: null,
      tierExpiresAt: { gt: threeDaysAgo, lte: threeDaysFromNow },
      tier: { not: "FREE" },
      emailAlerts: true,
    },
    select: { email: true, displayName: true, tierExpiresAt: true },
  });

  let reminded = 0;
  for (const u of aboutToExpire) {
    const daysLeft = Math.ceil(
      ((u.tierExpiresAt?.getTime() ?? 0) - now.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (daysLeft > 0 && daysLeft <= 3) {
      const { subject, html } = trialReminderEmail(u.displayName ?? "", daysLeft);
      await sendEmail({ to: u.email, subject, html });
      reminded++;
    }
  }

  return { expired: expired.count, reminded };
});
