import { cronHandler } from "@/lib/api/cron-auth";
import { prisma } from "@/lib/db";
import { drawWinner } from "@/lib/honey/raffle";

export const dynamic = "force-dynamic";

export const GET = cronHandler(async () => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const month = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const raffles = await prisma.monthlyRaffle.findMany({
    where: { month, drawnAt: null, isActive: true },
  });

  if (raffles.length === 0) {
    return { drawn: false, reason: `No active machines for ${month}` };
  }

  const results = [];
  for (const raffle of raffles) {
    const result = await drawWinner(raffle.id);
    results.push({ raffleId: raffle.id, slug: raffle.slug, ...result });
  }

  return { drawn: true, month, machines: results };
});
