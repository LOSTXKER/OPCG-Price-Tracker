import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const game = request.nextUrl.searchParams.get("game") || "";
    const where: Record<string, unknown> = {};
    if (game) {
      where.game = { slug: game };
    }

    const sets = await prisma.cardSet.findMany({
      where,
      orderBy: { code: "asc" },
      include: { _count: { select: { cards: true } } },
    });
    return NextResponse.json({ sets });
  } catch (error) {
    console.error("Error fetching sets:", error);
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 });
  }
}
