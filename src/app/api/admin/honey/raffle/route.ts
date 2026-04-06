import { NextRequest, NextResponse } from "next/server";
import { unauthorized, parseJsonBody } from "@/lib/api/admin-helpers";
import { checkIsAdmin } from "@/lib/auth/check-admin";
import { prisma } from "@/lib/db";
import { drawWinner } from "@/lib/honey-raffle";

export async function GET() {
  if (!(await checkIsAdmin())) return unauthorized();

  const raffles = await prisma.monthlyRaffle.findMany({
    orderBy: [{ month: "desc" }, { sortOrder: "asc" }],
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

type RaffleBody = {
  action?: string;
  raffleId?: number;
  month: string;
  slug: string;
  title: string;
  titleEn?: string;
  titleTh?: string;
  description?: string;
  imageUrl?: string;
  color?: string;
  prizes: { rank: number; name: string; imageUrl?: string; honeyBonus?: number }[];
  ticketCost?: number;
  maxTickets?: number;
  freeThreshold?: number;
  sortOrder?: number;
};

export async function POST(req: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const parsed = await parseJsonBody<RaffleBody>(req);
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

  const slug = body.slug || "default";

  const raffle = await prisma.monthlyRaffle.upsert({
    where: { month_slug: { month: body.month, slug } },
    update: {
      title: body.title,
      titleEn: body.titleEn,
      titleTh: body.titleTh,
      description: body.description,
      imageUrl: body.imageUrl ?? null,
      color: body.color ?? null,
      prizes: body.prizes as object,
      ticketCost: body.ticketCost ?? 50,
      maxTickets: body.maxTickets ?? 5,
      freeThreshold: body.freeThreshold ?? 7,
      sortOrder: body.sortOrder ?? 0,
    },
    create: {
      month: body.month,
      slug,
      title: body.title,
      titleEn: body.titleEn,
      titleTh: body.titleTh,
      description: body.description,
      imageUrl: body.imageUrl ?? null,
      color: body.color ?? null,
      prizes: body.prizes as object,
      ticketCost: body.ticketCost ?? 50,
      maxTickets: body.maxTickets ?? 5,
      freeThreshold: body.freeThreshold ?? 7,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json({ raffle });
}

export async function PUT(req: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const parsed = await parseJsonBody<{
    id: number;
    title?: string;
    titleEn?: string;
    titleTh?: string;
    description?: string;
    imageUrl?: string | null;
    color?: string | null;
    prizes?: { rank: number; name: string; imageUrl?: string; honeyBonus?: number }[];
    ticketCost?: number;
    maxTickets?: number;
    freeThreshold?: number;
    sortOrder?: number;
    isActive?: boolean;
  }>(req);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.titleEn !== undefined) data.titleEn = body.titleEn;
  if (body.titleTh !== undefined) data.titleTh = body.titleTh;
  if (body.description !== undefined) data.description = body.description;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.color !== undefined) data.color = body.color;
  if (body.prizes !== undefined) data.prizes = body.prizes as object;
  if (body.ticketCost !== undefined) data.ticketCost = body.ticketCost;
  if (body.maxTickets !== undefined) data.maxTickets = body.maxTickets;
  if (body.freeThreshold !== undefined) data.freeThreshold = body.freeThreshold;
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const raffle = await prisma.monthlyRaffle.update({
    where: { id: body.id },
    data,
  });

  return NextResponse.json({ raffle });
}

export async function DELETE(req: NextRequest) {
  if (!(await checkIsAdmin())) return unauthorized();

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const raffle = await prisma.monthlyRaffle.findUnique({ where: { id } });
  if (!raffle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (raffle.drawnAt) {
    return NextResponse.json({ error: "Cannot delete a drawn raffle" }, { status: 400 });
  }

  await prisma.raffleTicket.deleteMany({ where: { raffleId: id } });
  await prisma.monthlyRaffle.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
