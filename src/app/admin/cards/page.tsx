import { prisma } from "@/lib/db";
import { CardsBrowser } from "./cards-browser";

export const dynamic = "force-dynamic";

async function getFilterOptions() {
  const [sets, rarities] = await Promise.all([
    prisma.cardSet.findMany({
      select: {
        code: true,
        name: true,
        nameEn: true,
        nameTh: true,
        type: true,
        boxImageUrl: true,
        releaseDate: true,
      },
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
      name: s.name,
      nameEn: s.nameEn,
      nameTh: s.nameTh,
      type: s.type,
      imageUrl: s.boxImageUrl,
      releaseDate: s.releaseDate ? s.releaseDate.toISOString() : null,
    })),
    rarities: rarities.map((r) => r.rarity),
  };
}

export default async function AdminCardsPage() {
  const filters = await getFilterOptions();
  return <CardsBrowser filterOptions={filters} />;
}
