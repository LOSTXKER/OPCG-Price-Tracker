import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { drawWinner } from "@/lib/honey-raffle";

export const dynamic = "force-dynamic";

export const GET = cronHandler(async () => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const month = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const raffle = await prisma.monthlyRaffle.findFirst({
    where: { month, drawnAt: null, isActive: true },
  });

  if (!raffle) {
    return { drawn: false, reason: `No active raffle for ${month}` };
  }

  const result = await drawWinner(raffle.id);
  return { drawn: result.success, month, ...result };
});
