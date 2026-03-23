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

    const communityPriceId =
      typeof body.communityPriceId === "number"
        ? body.communityPriceId
        : Number(body.communityPriceId);

    if (!Number.isInteger(communityPriceId) || communityPriceId < 1) {
      return NextResponse.json(
        { error: "Invalid communityPriceId" },
        { status: 400 }
      );
    }

    const existing = await prisma.communityPriceVote.findUnique({
      where: {
        communityPriceId_userId: {
          communityPriceId,
          userId: dbUser.id,
        },
      },
    });

    if (existing) {
      await prisma.communityPriceVote.delete({ where: { id: existing.id } });
      await prisma.communityPrice.update({
        where: { id: communityPriceId },
        data: { upvotes: { decrement: 1 } },
      });
      return NextResponse.json({ voted: false });
    }

    await prisma.communityPriceVote.create({
      data: { communityPriceId, userId: dbUser.id },
    });
    await prisma.communityPrice.update({
      where: { id: communityPriceId },
      data: { upvotes: { increment: 1 } },
    });

    return NextResponse.json({ voted: true });
  } catch (error) {
    console.error("POST /api/community-price/vote:", error);
    return NextResponse.json(
      { error: "Failed to vote" },
      { status: 500 }
    );
  }
}
