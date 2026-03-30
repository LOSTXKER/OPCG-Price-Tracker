import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { sendEmail, weeklyDigestEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export const GET = cronHandler(async () => {
  const [topGainers, topLosers] = await Promise.all([
    prisma.card.findMany({
      where: { priceChange7d: { not: null } },
      orderBy: { priceChange7d: "desc" },
      take: 5,
      select: { cardCode: true, nameEn: true, nameJp: true, priceChange7d: true },
    }),
    prisma.card.findMany({
      where: { priceChange7d: { not: null } },
      orderBy: { priceChange7d: "asc" },
      take: 5,
      select: { cardCode: true, nameEn: true, nameJp: true, priceChange7d: true },
    }),
  ]);

  const gainers = topGainers.map((c) => ({
    name: c.nameEn ?? c.nameJp,
    code: c.cardCode,
    change: c.priceChange7d ?? 0,
  }));

  const losers = topLosers.map((c) => ({
    name: c.nameEn ?? c.nameJp,
    code: c.cardCode,
    change: c.priceChange7d ?? 0,
  }));

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const subscribers = await prisma.user.findMany({
    where: {
      weeklyDigest: true,
      OR: [{ lastDigestAt: null }, { lastDigestAt: { lte: oneWeekAgo } }],
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      portfolios: {
        take: 1,
        select: {
          snapshots: {
            take: 1,
            orderBy: { snapshotAt: "desc" },
            select: { totalJpy: true, pnl: true },
          },
        },
      },
    },
  });

  let sent = 0;
  const userIds: string[] = [];

  for (const sub of subscribers) {
    const snapshot = sub.portfolios[0]?.snapshots[0];
    const { subject, html } = weeklyDigestEmail(
      sub.displayName ?? "",
      gainers,
      losers,
      snapshot?.totalJpy,
      snapshot?.pnl,
    );

    const result = await sendEmail({ to: sub.email, subject, html });
    if (result) {
      sent++;
      userIds.push(sub.id);
    }
  }

  if (userIds.length > 0) {
    await prisma.user.updateMany({
      where: { id: { in: userIds } },
      data: { lastDigestAt: new Date() },
    });
  }

  return { subscribers: subscribers.length, sent };
});
