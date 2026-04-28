import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async (request: NextRequest) => {
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
});
