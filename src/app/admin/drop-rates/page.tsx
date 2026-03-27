import { prisma } from "@/lib/db";
import { DropRatesManager } from "./drop-rates-manager";

export const dynamic = "force-dynamic";

async function getData() {
  const sets = await prisma.cardSet.findMany({
    where: { type: { in: ["BOOSTER", "EXTRA_BOOSTER"] } },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      nameEn: true,
      type: true,
      packsPerBox: true,
      cardsPerPack: true,
      dropRates: {
        select: { id: true, rarity: true, avgPerBox: true, ratePerPack: true },
        orderBy: { rarity: "asc" },
      },
    },
  });

  const rarityCounts = await prisma.card.groupBy({
    by: ["setId", "rarity", "isParallel"],
    _count: true,
  });

  const countMap = new Map<string, number>();
  for (const r of rarityCounts) {
    countMap.set(`${r.setId}-${r.rarity}-${r.isParallel}`, r._count);
  }

  return { sets, countMap: Object.fromEntries(countMap) };
}

export default async function DropRatesPage() {
  const { sets, countMap } = await getData();
  return <DropRatesManager initialSets={sets} rarityCounts={countMap} />;
}
