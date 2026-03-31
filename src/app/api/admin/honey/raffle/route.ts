import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { drawWinner } from "@/lib/honey-raffle";

export async function GET() {
  if (!(await checkIsAdmin())) return unauthorized();

  const raffles = await prisma.monthlyRaffle.findMany({
    orderBy: { month: "desc" },
    include: {
      tickets: { select: { id: true, userId: true, isFree: true } },
    },
  });

  return NextResponse.json({
    raffles: raffles.map((r) => ({
      ...r,
      totalTickets: r.tickets.length,
      totalParticipants: new Set(r.tickets.map((t) => t.userId)).size,
      tickets: undefined,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const parsed = await parseJsonBody<{
    action?: string;
    raffleId?: number;
    month: string;
    title: string;
    titleEn?: string;
    titleTh?: string;
    description?: string;
    prizes: { rank: number; name: string; honeyBonus?: number }[];
    ticketCost?: number;
    maxTickets?: number;
    freeThreshold?: number;
  }>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (body.action === "draw" && body.raffleId) {
    const result = await drawWinner(body.raffleId);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  }

  if (!body.month || !body.title || !body.prizes?.length) {
    return NextResponse.json({ error: "month, title, prizes required" }, { status: 400 });
  }

  const raffle = await prisma.monthlyRaffle.upsert({
    where: { month: body.month },
    update: {
      title: body.title,
      titleEn: body.titleEn,
      titleTh: body.titleTh,
      description: body.description,
      prizes: body.prizes as object,
      ticketCost: body.ticketCost ?? 50,
      maxTickets: body.maxTickets ?? 5,
      freeThreshold: body.freeThreshold ?? 7,
    },
    create: {
      month: body.month,
      title: body.title,
      titleEn: body.titleEn,
      titleTh: body.titleTh,
      description: body.description,
      prizes: body.prizes as object,
      ticketCost: body.ticketCost ?? 50,
      maxTickets: body.maxTickets ?? 5,
      freeThreshold: body.freeThreshold ?? 7,
    },
  });

  return NextResponse.json({ raffle });
}
