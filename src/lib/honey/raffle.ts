import { prisma } from "@/lib/db";
import { earnHoneyDirect } from ".";
import { currentMonthKey } from "./utils";
import { RafflePrizesSchema, parseJsonField } from "./schemas";

export const TICKET_COST_DEFAULT = 50;
export const MAX_TICKETS_DEFAULT = 5;
export const FREE_STREAK_THRESHOLD = 7;

export async function getActiveRaffles() {
  const month = currentMonthKey();
  return prisma.monthlyRaffle.findMany({
    where: { isActive: true, month },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { tickets: true } },
    },
  });
}

/** @deprecated Use getActiveRaffles() for multi-machine support */
export async function getActiveRaffle() {
  const raffles = await getActiveRaffles();
  return raffles[0] ?? null;
}

export async function getUserTickets(userId: string, raffleId: number) {
  return prisma.raffleTicket.findMany({
    where: { userId, raffleId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getUserTicketsForMonth(userId: string, month: string) {
  return prisma.raffleTicket.findMany({
    where: {
      userId,
      raffle: { month },
    },
    select: { id: true, raffleId: true, isFree: true },
  });
}

export async function buyTicket(
  userId: string,
  raffleId: number,
): Promise<{ success: true; ticketId: number; ticketBalance: number } | { success: false; error: string }> {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ticketBalance: true },
  });

  if (!user || user.ticketBalance < 1) {
    return { success: false, error: "No tickets available" };
  }

  const [updatedUser, ticket] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { ticketBalance: { decrement: 1 } },
      select: { ticketBalance: true },
    }),
    prisma.raffleTicket.create({
      data: { userId, raffleId },
    }),
  ]);

  return { success: true, ticketId: ticket.id, ticketBalance: updatedUser.ticketBalance };
}

export async function claimFreeTicket(
  userId: string,
): Promise<{ success: true; ticketBalance: number } | { success: false; error: string }> {
  const month = currentMonthKey();

  const existingFree = await prisma.raffleTicket.findFirst({
    where: {
      userId,
      isFree: true,
      raffle: { month },
    },
  });

  if (existingFree) {
    return { success: false, error: "Free ticket already claimed this month" };
  }

  const raffles = await prisma.monthlyRaffle.findMany({
    where: { isActive: true, month },
  });

  const minThreshold = raffles.length > 0
    ? Math.min(...raffles.map((r) => r.freeThreshold))
    : FREE_STREAK_THRESHOLD;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { checkinStreak: true },
  });

  if (!user || user.checkinStreak < minThreshold) {
    return { success: false, error: `Need ${minThreshold}-day streak for free ticket` };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { ticketBalance: { increment: 1 } },
    select: { ticketBalance: true },
  });

  return { success: true, ticketBalance: updatedUser.ticketBalance };
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
