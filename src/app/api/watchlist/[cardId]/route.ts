import { requireAuthUser } from "@/lib/api/auth";
import { apiHandler } from "@/lib/api/api-handler";
import { cardInclude } from "@/lib/api/query-fragments";
import { parseJsonBody } from "@/lib/api/request-body";
import { prisma } from "@/lib/db";
import { UpdateWatchlistSchema } from "@/lib/watchlist/schemas";
import { NextRequest, NextResponse } from "next/server";

export const PATCH = apiHandler(
  async (request: NextRequest, ctx: { params: Promise<{ cardId: string }> }) => {
    const auth = await requireAuthUser();
    if (!auth.ok) return auth.response;

    const { cardId: cardIdParam } = await ctx.params;
    const cardId = Number(cardIdParam);
    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: "Invalid cardId" }, { status: 400 });
    }

    const parsed = await parseJsonBody(request, UpdateWatchlistSchema);
    if (!parsed.ok) return parsed.response;

    const existing = await prisma.watchlistItem.findUnique({
      where: { userId_cardId: { userId: auth.user.id, cardId } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Watchlist item not found" }, { status: 404 });
    }

    const data: { pinnedAt?: Date | null } = {};

    const pinnedAtRaw = parsed.body.pinnedAt;
    if (pinnedAtRaw !== undefined) {
      if (pinnedAtRaw === null) {
        data.pinnedAt = null;
      } else if (pinnedAtRaw === "toggle") {
        data.pinnedAt = existing.pinnedAt ? null : new Date();
      } else if (typeof pinnedAtRaw === "string") {
        const parsedDate = new Date(pinnedAtRaw);
        if (Number.isNaN(parsedDate.getTime())) {
          return NextResponse.json({ error: "Invalid pinnedAt" }, { status: 400 });
        }
        data.pinnedAt = parsedDate;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const item = await prisma.watchlistItem.update({
      where: { userId_cardId: { userId: auth.user.id, cardId } },
      data,
      include: { card: { include: cardInclude } },
    });

    return NextResponse.json({ item });
  }
);
