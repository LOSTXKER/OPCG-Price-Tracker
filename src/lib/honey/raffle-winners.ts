import { prisma } from "@/lib/db";
import { RafflePrizesSchema, parseJsonField } from "./schemas";
import type { RafflePrizeParsed } from "./schemas";

export type DrawnRaffleSummary = {
  id: number;
  month: string;
  slug: string;
  title: string;
  titleEn: string | null;
  titleTh: string | null;
  description: string | null;
  imageUrl: string | null;
  color: string | null;
  prizes: RafflePrizeParsed[];
  drawnAt: string;
  totalTickets: number;
  winner: {
    displayName: string | null;
    avatarUrl: string | null;
  };
};

/**
 * Public, read-only fetch of historical drawn raffles for the public
 * winners announcement page. Returns flattened, JSON-safe data sorted by
 * most recent draw first (DESC by month, then by sortOrder ASC within month).
 */
export async function getDrawnRaffles({
  limit = 60,
}: { limit?: number } = {}): Promise<DrawnRaffleSummary[]> {
  const raffles = await prisma.monthlyRaffle.findMany({
    where: { drawnAt: { not: null }, winnerId: { not: null } },
    orderBy: [{ month: "desc" }, { sortOrder: "asc" }],
    take: limit,
    select: {
      id: true,
      month: true,
      slug: true,
      title: true,
      titleEn: true,
      titleTh: true,
      description: true,
      imageUrl: true,
      color: true,
      prizes: true,
      drawnAt: true,
      winnerId: true,
      _count: { select: { tickets: true } },
    },
  });

  if (raffles.length === 0) return [];

  const winnerIds = [...new Set(raffles.map((r) => r.winnerId!))];
  const winners = await prisma.user.findMany({
    where: { id: { in: winnerIds } },
    select: { id: true, displayName: true, avatarUrl: true },
  });
  const winnerMap = new Map(winners.map((u) => [u.id, u]));

  return raffles.map((r) => {
    const winner = winnerMap.get(r.winnerId!);
    return {
      id: r.id,
      month: r.month,
      slug: r.slug,
      title: r.title,
      titleEn: r.titleEn,
      titleTh: r.titleTh,
      description: r.description,
      imageUrl: r.imageUrl,
      color: r.color,
      prizes: parseJsonField(
        RafflePrizesSchema,
        r.prizes,
        "MonthlyRaffle.prizes",
        [],
      ),
      drawnAt: r.drawnAt!.toISOString(),
      totalTickets: r._count.tickets,
      winner: {
        displayName: winner?.displayName ?? null,
        avatarUrl: winner?.avatarUrl ?? null,
      },
    };
  });
}

/**
 * Group drawn raffles by month key (e.g. "2026-04"). Months are returned
 * in DESC order; within each month entries keep their original order.
 */
export function groupRafflesByMonth(
  raffles: DrawnRaffleSummary[],
): Array<{ month: string; raffles: DrawnRaffleSummary[] }> {
  const map = new Map<string, DrawnRaffleSummary[]>();
  for (const r of raffles) {
    let arr = map.get(r.month);
    if (!arr) {
      arr = [];
      map.set(r.month, arr);
    }
    arr.push(r);
  }
  return Array.from(map.entries()).map(([month, raffles]) => ({
    month,
    raffles,
  }));
}
