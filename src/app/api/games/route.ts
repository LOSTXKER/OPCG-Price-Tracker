import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { sets: true } },
      },
    });

    return NextResponse.json({
      games: games.map((g) => ({
        id: g.id,
        slug: g.slug,
        name: g.name,
        nameEn: g.nameEn,
        logoUrl: g.logoUrl,
        setCount: g._count.sets,
      })),
    });
  } catch (error) {
    console.error("GET /api/games:", error);
    return NextResponse.json({ error: "Failed to load games" }, { status: 500 });
  }
}
