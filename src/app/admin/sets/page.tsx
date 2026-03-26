import { prisma } from "@/lib/db";
import { SetsManager } from "./sets-manager";

export const dynamic = "force-dynamic";

async function getSets() {
  const sets = await prisma.cardSet.findMany({
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      nameEn: true,
      nameTh: true,
      type: true,
      releaseDate: true,
      cardCount: true,
      packsPerBox: true,
      cardsPerPack: true,
      _count: { select: { cards: true } },
    },
  });

  const products = await prisma.product.findMany({
    select: {
      code: true,
      _count: { select: { cards: true } },
    },
  });
  const productCardCounts = new Map(
    products.map((p) => [p.code, p._count.cards])
  );

  const enriched = await Promise.all(
    sets.map(async (s) => {
      const [missingEn, missingImage] = await Promise.all([
        prisma.card.count({ where: { setId: s.id, nameEn: null } }),
        prisma.card.count({
          where: {
            setId: s.id,
            OR: [{ imageUrl: null }, { imageUrl: "" }],
          },
        }),
      ]);
      const actual = s._count.cards;
      const productCards = productCardCounts.get(s.code) ?? 0;
      return {
        id: s.id,
        code: s.code,
        name: s.name,
        nameEn: s.nameEn,
        nameTh: s.nameTh,
        type: s.type,
        releaseDate: s.releaseDate?.toISOString() ?? null,
        cardCount: s.cardCount,
        packsPerBox: s.packsPerBox,
        cardsPerPack: s.cardsPerPack,
        actualCardCount: actual,
        productCardCount: productCards,
        missingEn,
        missingImage,
        completeness: actual > 0 ? Math.round(((actual - missingEn) / actual) * 100) : 0,
      };
    })
  );

  return enriched;
}

export default async function AdminSetsPage() {
  const sets = await getSets();
  return <SetsManager initialSets={sets} />;
}
