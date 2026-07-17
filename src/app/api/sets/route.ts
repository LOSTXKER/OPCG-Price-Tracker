import { apiHandler } from "@/lib/api/api-handler";
import { prisma } from "@/lib/db";
import { buildCardSetScope } from "@/lib/game/card-scope";
import { NextRequest, NextResponse } from "next/server";

export const GET = apiHandler(async (request: NextRequest) => {
  const game = request.nextUrl.searchParams.get("game") || "";

  const sets = await prisma.cardSet.findMany({
    // buildCardSetScope treats legacy null-game rows as the default game —
    // a bare `{ game: { slug } }` filter would return 0 sets until the backfill.
    where: buildCardSetScope(game || undefined),
    orderBy: { code: "asc" },
    include: { _count: { select: { cards: true } } },
  });
  return NextResponse.json({ sets });
});
