import { prisma } from "@/lib/db";
import { RaffleManager } from "./raffle-manager";

export default async function AdminRafflePage() {
  const raffles = await prisma.monthlyRaffle.findMany({
    orderBy: { month: "desc" },
    include: {
      tickets: { select: { id: true, userId: true, isFree: true } },
    },
  });

  const serialized = raffles.map((r) => ({
    id: r.id,
    month: r.month,
    title: r.title,
    titleEn: r.titleEn,
    titleTh: r.titleTh,
    description: r.description,
    prizes: r.prizes as { rank: number; name: string; honeyBonus?: number }[],
    ticketCost: r.ticketCost,
    maxTickets: r.maxTickets,
    freeThreshold: r.freeThreshold,
    isActive: r.isActive,
    drawnAt: r.drawnAt?.toISOString() ?? null,
    winnerId: r.winnerId,
    totalTickets: r.tickets.length,
    totalParticipants: new Set(r.tickets.map((t) => t.userId)).size,
    createdAt: r.createdAt.toISOString(),
  }));

  return <RaffleManager initialRaffles={serialized} />;
}
