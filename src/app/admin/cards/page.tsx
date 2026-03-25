import { prisma } from "@/lib/db";
import { CardsBrowser } from "./cards-browser";

async function getFilterOptions() {
  const [sets, products, rarities] = await Promise.all([
    prisma.cardSet.findMany({
      select: { code: true, name: true, nameEn: true },
      orderBy: { code: "asc" },
    }),
    prisma.product.findMany({
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
    products: products.map((p) => ({
      code: p.code,
      label: p.nameEn || p.name,
    })),
    rarities: rarities.map((r) => r.rarity),
  };
}

export default async function AdminCardsPage() {
  const filters = await getFilterOptions();
  return <CardsBrowser filterOptions={filters} />;
}
