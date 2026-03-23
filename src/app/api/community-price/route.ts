import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const cardId = typeof body.cardId === "number" ? body.cardId : Number(body.cardId);
    const priceThb = typeof body.priceThb === "number" ? body.priceThb : Number(body.priceThb);

    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }
    if (!Number.isInteger(priceThb) || priceThb < 1) {
      return NextResponse.json({ error: "priceThb must be a positive integer (THB)" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const report = await prisma.communityPrice.create({
      data: {
        userId: dbUser.id,
        cardId,
        priceThb,
      },
      include: {
        card: {
          include: { set: { select: { code: true, name: true, nameEn: true } } },
        },
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("POST /api/community-price:", error);
    return NextResponse.json({ error: "Failed to submit community price" }, { status: 500 });
  }
}
