import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = cronHandler(async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const usersToExpire = await prisma.user.findMany({
    where: {
      honeyPoints: { gt: 0 },
      honeyTransactions: {
        none: { createdAt: { gte: sixMonthsAgo } },
      },
    },
    select: { id: true, honeyPoints: true },
  });

  let expired = 0;

  for (const user of usersToExpire) {
    await prisma.$transaction([
      prisma.honeyTransaction.create({
        data: {
          userId: user.id,
          amount: -user.honeyPoints,
          type: "EXPIRED",
          reason: "Points expired due to 6 months of inactivity",
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { honeyPoints: 0 },
      }),
    ]);
    expired++;
  }

  return { expired, usersChecked: usersToExpire.length };
});
