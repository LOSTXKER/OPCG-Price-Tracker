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
  // Consumers (SetInfo / SetPickerItem) read `imageUrl` — expose the packaging
  // art under that name here so every caller gets it without renaming locally.
  // Stays null for sets with no boxed product (e.g. `don`); callers fall back.
  return NextResponse.json({
    sets: sets.map((s) => ({ ...s, imageUrl: s.boxImageUrl })),
  });
});
