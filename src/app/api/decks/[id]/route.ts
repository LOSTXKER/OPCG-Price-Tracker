import { syncAppUser } from "@/lib/auth/sync-app-user";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        leader: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, imageUrl: true, latestPriceJpy: true, rarity: true } },
        cards: {
          include: {
            card: { select: { id: true, cardCode: true, nameJp: true, nameEn: true, rarity: true, imageUrl: true, latestPriceJpy: true, cardType: true } },
          },
        },
        user: { select: { displayName: true, avatarUrl: true } },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    if (!deck.isPublic) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const dbUser = await syncAppUser(user);
      if (deck.userId !== dbUser.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ deck });
  } catch (error) {
    console.error("GET /api/decks/[id]:", error);
    return NextResponse.json({ error: "Failed to load deck" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await syncAppUser(user);

    const existing = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!existing || existing.userId !== dbUser.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json() as {
      name?: string;
      leaderId?: number | null;
      isPublic?: boolean;
      addCards?: { cardId: number; quantity: number }[];
      removeCardIds?: number[];
    };

    if (body.removeCardIds?.length) {
      await prisma.deckCard.deleteMany({
        where: { deckId, cardId: { in: body.removeCardIds } },
      });
    }

    if (body.addCards?.length) {
      for (const c of body.addCards) {
        await prisma.deckCard.upsert({
          where: { deckId_cardId: { deckId, cardId: c.cardId } },
          update: { quantity: c.quantity || 1 },
          create: { deckId, cardId: c.cardId, quantity: c.quantity || 1 },
        });
      }
    }

    const deck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        ...(body.name ? { name: body.name.trim() } : {}),
        ...(body.leaderId !== undefined ? { leaderId: body.leaderId } : {}),
        ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
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

    return NextResponse.json({ deck });
  } catch (error) {
    console.error("PATCH /api/decks/[id]:", error);
    return NextResponse.json({ error: "Failed to update deck" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id, 10);
    if (isNaN(deckId)) {
      return NextResponse.json({ error: "Invalid deck ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await syncAppUser(user);

    const existing = await prisma.deck.findUnique({ where: { id: deckId } });
    if (!existing || existing.userId !== dbUser.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.deck.delete({ where: { id: deckId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/decks/[id]:", error);
    return NextResponse.json({ error: "Failed to delete deck" }, { status: 500 });
  }
}
