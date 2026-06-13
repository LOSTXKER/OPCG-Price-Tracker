import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { parseJsonBody } from "@/lib/api/request-body";
import { getActiveRaffles, getUserTicketsForMonth, buyTicket, claimFreeTicket } from "@/lib/honey/raffle";
import { currentMonthKey } from "@/lib/honey/utils";
import { prisma } from "@/lib/db";
import { RafflePrizesSchema, parseJsonField } from "@/lib/honey/schemas";
import { getEntitlements } from "@/lib/users/entitlements";

export const GET = apiHandler(async () => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;
  const user = auth.user;

  const raffles = await getActiveRaffles();
  const month = currentMonthKey();

  const raffleIds = raffles.map((r) => r.id);
  const [allUserTickets, participantCounts] = await Promise.all([
    getUserTicketsForMonth(user.id, month),
    raffleIds.length > 0
      ? prisma.raffleTicket.groupBy({
          by: ["raffleId", "userId"],
          where: { raffleId: { in: raffleIds } },
        }).then((rows) => {
          const map = new Map<number, Set<string>>();
          for (const row of rows) {
            let s = map.get(row.raffleId);
            if (!s) { s = new Set(); map.set(row.raffleId, s); }
            s.add(row.userId);
          }
          return map;
        })
      : Promise.resolve(new Map<number, Set<string>>()),
  ]);

  const myTickets: Record<number, number> = {};
  let freeClaimedThisMonth = false;
  for (const t of allUserTickets) {
    myTickets[t.raffleId] = (myTickets[t.raffleId] ?? 0) + 1;
    if (t.isFree) freeClaimedThisMonth = true;
  }

  const [dbUser, entitlements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { checkinStreak: true },
    }),
    getEntitlements(user.id),
  ]);
  const ticketBalance = entitlements.ticketBalance;

  const minFreeThreshold = raffles.length > 0
    ? Math.min(...raffles.map((r) => r.freeThreshold))
    : 7;
  const canClaimFree = (dbUser?.checkinStreak ?? 0) >= minFreeThreshold && !freeClaimedThisMonth;

  // Last winners from recent drawn raffles
  const recentDrawn = await prisma.monthlyRaffle.findMany({
    where: { drawnAt: { not: null }, winnerId: { not: null } },
    orderBy: { drawnAt: "desc" },
    take: 5,
    select: { month: true, winnerId: true, prizes: true, title: true, slug: true },
  });

  const winnerUserIds = [...new Set(recentDrawn.map((r) => r.winnerId!))];
  const winnerUsers = winnerUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: winnerUserIds } },
        select: { id: true, displayName: true },
      })
    : [];
  const userMap = Object.fromEntries(winnerUsers.map((u) => [u.id, u.displayName]));

  const lastWinners = recentDrawn.map((r) => {
    const prizes = parseJsonField(RafflePrizesSchema, r.prizes, "MonthlyRaffle.prizes", []);
    return {
      displayName: userMap[r.winnerId!] ?? null,
      month: r.month,
      prizeName: prizes[0]?.name ?? "Prize",
      machineTitle: r.title,
      machineSlug: r.slug,
    };
  });

  const currentMachineWinnerIds = [
    ...new Set(raffles.map((r) => r.winnerId).filter((id): id is string => Boolean(id))),
  ];
  const machineWinnerUsers = currentMachineWinnerIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: currentMachineWinnerIds } },
        select: { id: true, displayName: true, avatarUrl: true },
      })
    : [];
  const winnerById = new Map(machineWinnerUsers.map((u) => [u.id, u]));

  return NextResponse.json({
    machines: raffles.map((r) => ({
      id: r.id,
      month: r.month,
      slug: r.slug,
      title: r.title,
      titleEn: r.titleEn,
      titleTh: r.titleTh,
      description: r.description,
      imageUrl: r.imageUrl,
      color: r.color,
      prizes: r.prizes,
      ticketCost: r.ticketCost,
      maxTickets: r.maxTickets,
      freeThreshold: r.freeThreshold,
      totalTickets: r._count.tickets,
      totalParticipants: participantCounts.get(r.id)?.size ?? 0,
      drawnAt: r.drawnAt ? r.drawnAt.toISOString() : null,
      winner: r.winnerId ? winnerById.get(r.winnerId) ?? null : null,
    })),
    myTickets,
    ticketBalance,
    canClaimFree,
    lastWinners,
  });
});

export const POST = apiHandler(async (request) => {
  const auth = await requireAuthUser();
  if (!auth.ok) return auth.response;

  const parsed = await parseJsonBody<{ action: string; raffleId?: number }>(request);
  if (!parsed.ok) return parsed.response;

  const { action, raffleId } = parsed.body;

  if (action === "buy") {
    if (!raffleId) {
      return NextResponse.json({ error: "raffleId required" }, { status: 400 });
    }
    const result = await buyTicket(auth.user.id, raffleId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ticketId: result.ticketId, ticketBalance: result.ticketBalance });
  }

  if (action === "claim-free") {
    const result = await claimFreeTicket(auth.user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ticketBalance: result.ticketBalance });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
});
