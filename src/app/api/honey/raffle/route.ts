import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { getActiveRaffle, getUserTickets, buyTicket, claimFreeTicket } from "@/lib/honey-raffle";
import { prisma } from "@/lib/db";
import { RafflePrizesSchema, parseJsonField } from "@/lib/honey-schemas";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const raffle = await getActiveRaffle();

  const lastDrawn = await prisma.monthlyRaffle.findFirst({
    where: { drawnAt: { not: null } },
    orderBy: { drawnAt: "desc" },
    select: {
      month: true, winnerId: true,
      prizes: true,
    },
  });

  let lastWinner: { displayName: string | null; month: string; prizeName: string } | null = null;
  if (lastDrawn?.winnerId) {
    const winner = await prisma.user.findUnique({
      where: { id: lastDrawn.winnerId },
      select: { displayName: true },
    });
    const prizes = parseJsonField(RafflePrizesSchema, lastDrawn.prizes, "MonthlyRaffle.prizes", []);
    lastWinner = {
      displayName: winner?.displayName ?? null,
      month: lastDrawn.month,
      prizeName: prizes[0]?.name ?? "Prize",
    };
  }

  if (!raffle) {
    return NextResponse.json({ raffle: null, lastWinner });
  }

  const myTickets = await getUserTickets(user.id, raffle.id);
  const hasFreeTicket = myTickets.some((t) => t.isFree);
  const streakEligible = user.checkinStreak >= raffle.freeThreshold;

  return NextResponse.json({
    raffle: {
      id: raffle.id,
      month: raffle.month,
      title: raffle.title,
      titleEn: raffle.titleEn,
      titleTh: raffle.titleTh,
      description: raffle.description,
      prizes: raffle.prizes,
      ticketCost: raffle.ticketCost,
      maxTickets: raffle.maxTickets,
      freeThreshold: raffle.freeThreshold,
      totalTickets: raffle.tickets.length,
      totalParticipants: new Set(raffle.tickets.map((t) => t.userId)).size,
      lastWinner,
    },
    myTickets: myTickets.length,
    hasFreeTicket,
    canClaimFree: streakEligible && !hasFreeTicket,
  });
});

export const POST = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{ action: string }>(request);
  if (!parsed.ok) return parsed.response;

  const raffle = await getActiveRaffle();
  if (!raffle) {
    return NextResponse.json({ error: "No active raffle" }, { status: 404 });
  }

  if (parsed.body.action === "buy") {
    const result = await buyTicket(auth.user.id, raffle.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ticketId: result.ticketId, total: result.total });
  }

  if (parsed.body.action === "claim-free") {
    const result = await claimFreeTicket(auth.user.id, raffle.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ticketId: result.ticketId });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});
