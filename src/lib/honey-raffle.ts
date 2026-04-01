import { prisma } from "@/lib/db";
import { spendHoney, earnHoneyDirect } from "@/lib/honey";
import { currentMonthKey } from "@/lib/honey-utils";
import { RafflePrizesSchema, parseJsonField } from "@/lib/honey-schemas";

export const TICKET_COST_DEFAULT = 50;
export const MAX_TICKETS_DEFAULT = 5;
export const FREE_STREAK_THRESHOLD = 7;

export async function getActiveRaffle() {
  const month = currentMonthKey();
  return prisma.monthlyRaffle.findFirst({
    where: { isActive: true, month },
    include: {
      tickets: { select: { id: true, userId: true, isFree: true } },
    },
  });
}

export async function getUserTickets(userId: string, raffleId: number) {
  return prisma.raffleTicket.findMany({
    where: { userId, raffleId },
    orderBy: { createdAt: "asc" },
  });
}

export async function buyTicket(
  userId: string,
  raffleId: number,
): Promise<{ success: true; ticketId: number; total: number } | { success: false; error: string }> {
  const raffle = await prisma.monthlyRaffle.findUnique({
    where: { id: raffleId },
    include: { tickets: { where: { userId } } },
  });

  if (!raffle || !raffle.isActive || raffle.drawnAt) {
    return { success: false, error: "Raffle not available" };
  }

  if (raffle.tickets.length >= raffle.maxTickets) {
    return { success: false, error: `Max ${raffle.maxTickets} tickets per raffle` };
  }

  const spend = await spendHoney(
    userId,
    raffle.ticketCost,
    `Raffle ticket: ${raffle.title}`,
    { raffleId, month: raffle.month },
    "RAFFLE_TICKET",
  );

  if (!spend.success) {
    return { success: false, error: "Insufficient honey" };
  }

  const ticket = await prisma.raffleTicket.create({
    data: { userId, raffleId },
  });

  return { success: true, ticketId: ticket.id, total: spend.total };
}

export async function claimFreeTicket(
  userId: string,
  raffleId: number,
): Promise<{ success: true; ticketId: number } | { success: false; error: string }> {
  const raffle = await prisma.monthlyRaffle.findUnique({
    where: { id: raffleId },
    include: { tickets: { where: { userId, isFree: true } } },
  });

  if (!raffle || !raffle.isActive || raffle.drawnAt) {
    return { success: false, error: "Raffle not available" };
  }

  if (raffle.tickets.length > 0) {
    return { success: false, error: "Free ticket already claimed" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { checkinStreak: true },
  });

  if (!user || user.checkinStreak < raffle.freeThreshold) {
    return { success: false, error: `Need ${raffle.freeThreshold}-day streak for free ticket` };
  }

  const ticket = await prisma.raffleTicket.create({
    data: { userId, raffleId, isFree: true },
  });

  return { success: true, ticketId: ticket.id };
}

export async function drawWinner(raffleId: number): Promise<{
  success: boolean;
  winnerId?: string;
  ticketId?: number;
  totalTickets?: number;
  error?: string;
}> {
  const raffle = await prisma.monthlyRaffle.findUnique({
    where: { id: raffleId },
    include: { tickets: true },
  });

  if (!raffle) return { success: false, error: "Raffle not found" };
  if (raffle.drawnAt) return { success: false, error: "Already drawn" };
  if (raffle.tickets.length === 0) return { success: false, error: "No tickets sold" };

  const winnerIdx = Math.floor(Math.random() * raffle.tickets.length);
  const winnerTicket = raffle.tickets[winnerIdx];

  await prisma.monthlyRaffle.update({
    where: { id: raffleId },
    data: {
      drawnAt: new Date(),
      winnerId: winnerTicket.userId,
      winnerTicketId: winnerTicket.id,
      isActive: false,
    },
  });

  const prizes = parseJsonField(RafflePrizesSchema, raffle.prizes, "MonthlyRaffle.prizes", []);
  const topPrize = prizes[0];
  if (topPrize?.honeyBonus) {
    await earnHoneyDirect(
      winnerTicket.userId,
      "RAFFLE_WIN",
      topPrize.honeyBonus,
      `Raffle winner: ${raffle.title} — ${topPrize.name}`,
      { raffleId, month: raffle.month, prize: topPrize.name },
    );
  }

  return {
    success: true,
    winnerId: winnerTicket.userId,
    ticketId: winnerTicket.id,
    totalTickets: raffle.tickets.length,
  };
}
