import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/request-body";
import { getActiveRaffle, getUserTickets, buyTicket, claimFreeTicket } from "@/lib/honey-raffle";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const raffle = await getActiveRaffle();
  if (!raffle) {
    const lastRaffle = await prisma.monthlyRaffle.findFirst({
      where: { drawnAt: { not: null } },
      orderBy: { drawnAt: "desc" },
      select: {
        id: true, month: true, title: true, titleEn: true, titleTh: true,
        prizes: true, drawnAt: true, winnerId: true,
        tickets: { select: { id: true } },
      },
    });
    return NextResponse.json({ raffle: null, lastResult: lastRaffle });
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
    },
    myTickets: myTickets.length,
    hasFreeTicket,
    canClaimFree: streakEligible && !hasFreeTicket,
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{ action: string }>(request as never);
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
}
