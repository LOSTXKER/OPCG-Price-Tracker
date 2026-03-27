import { prisma } from "@/lib/db";
import { CardsBrowser } from "./cards-browser";

async function getFilterOptions() {
  const [sets, rarities] = await Promise.all([
    prisma.cardSet.findMany({
      select: { code: true, name: true, nameEn: true },
      orderBy: { code: "asc" },
    }),
    prisma.card.findMany({
      select: { rarity: true },
      distinct: ["rarity"],
      orderBy: { rarity: "asc" },
    }),
  ]);

  return {
    sets: sets.map((s) => ({
      code: s.code,
      label: s.nameEn || s.name,
    })),
    rarities: rarities.map((r) => r.rarity),
  };
}

export default async function AdminCardsPage() {
  const filters = await getFilterOptions();
  return <CardsBrowser filterOptions={filters} />;
}
