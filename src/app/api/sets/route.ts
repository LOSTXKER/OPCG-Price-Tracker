import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sets = await prisma.cardSet.findMany({
      orderBy: { code: "asc" },
      include: { _count: { select: { cards: true } } },
    });
    return NextResponse.json({ sets });
  } catch (error) {
    console.error("Error fetching sets:", error);
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 });
  }
}
