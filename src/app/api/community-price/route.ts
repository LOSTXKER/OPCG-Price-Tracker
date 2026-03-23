import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const MAX_REPORTS_PER_DAY = 5;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cardId = parseInt(searchParams.get("cardId") ?? "", 10);
    if (!cardId || isNaN(cardId)) {
      return NextResponse.json({ error: "cardId is required" }, { status: 400 });
    }

    const reports = await prisma.communityPrice.findMany({
      where: { cardId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { displayName: true, avatarUrl: true } },
        _count: { select: { votes: true } },
      },
    });

    const avgResult = await prisma.communityPrice.aggregate({
      where: {
        cardId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _avg: { priceThb: true },
      _count: true,
    });

    return NextResponse.json({
      reports: reports.map((r) => ({
        id: r.id,
        priceThb: r.priceThb,
        upvotes: r.upvotes,
        voteCount: r._count.votes,
        user: r.user,
        createdAt: r.createdAt.toISOString(),
      })),
      average: avgResult._avg.priceThb
        ? Math.round(avgResult._avg.priceThb)
        : null,
      reportCount: avgResult._count,
    });
  } catch (error) {
    console.error("GET /api/community-price:", error);
    return NextResponse.json(
      { error: "Failed to load community prices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const cardId =
      typeof body.cardId === "number" ? body.cardId : Number(body.cardId);
    const priceThb =
      typeof body.priceThb === "number"
        ? body.priceThb
        : Number(body.priceThb);

    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }
    if (!Number.isInteger(priceThb) || priceThb < 1) {
      return NextResponse.json(
        { error: "priceThb must be a positive integer" },
        { status: 400 }
      );
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await prisma.communityPrice.count({
      where: {
        userId: dbUser.id,
        createdAt: { gte: startOfDay },
      },
    });

    if (todayCount >= MAX_REPORTS_PER_DAY) {
      return NextResponse.json(
        {
          error: `สามารถรายงานราคาได้สูงสุด ${MAX_REPORTS_PER_DAY} ครั้ง/วัน`,
        },
        { status: 429 }
      );
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const report = await prisma.communityPrice.create({
      data: { userId: dbUser.id, cardId, priceThb },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community-price:", error);
    return NextResponse.json(
      { error: "Failed to submit community price" },
      { status: 500 }
    );
  }
}
