import { syncAppUser } from "@/lib/auth/sync-app-user";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await syncAppUser(user);

    const decks = await prisma.deck.findMany({
      where: { userId: dbUser.id },
      orderBy: { updatedAt: "desc" },
      include: {
        leader: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, imageUrl: true, latestPriceJpy: true } },
        cards: {
          include: {
            card: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, rarity: true, imageUrl: true, latestPriceJpy: true, cardType: true } },
          },
        },
        _count: { select: { cards: true } },
      },
    });

    return NextResponse.json({ decks });
  } catch (error) {
    console.error("GET /api/decks:", error);
    return NextResponse.json({ error: "Failed to load decks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await syncAppUser(user);

    const body = await request.json() as { name?: string; leaderId?: number; cardIds?: { cardId: number; quantity: number }[] };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const deck = await prisma.deck.create({
      data: {
        userId: dbUser.id,
        name,
        leaderId: body.leaderId ?? null,
        cards: body.cardIds?.length
          ? {
              create: body.cardIds.map((c) => ({
                cardId: c.cardId,
                quantity: c.quantity || 1,
              })),
            }
          : undefined,
      },
      include: {
        leader: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, imageUrl: true, latestPriceJpy: true } },
        cards: {
          include: {
            card: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, rarity: true, imageUrl: true, latestPriceJpy: true, cardType: true } },
          },
        },
      },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error("POST /api/decks:", error);
    return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
  }
}
