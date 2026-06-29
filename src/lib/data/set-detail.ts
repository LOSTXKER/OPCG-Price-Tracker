import { cache } from "react";

import { PRICE_SOURCE } from "@/lib/constants/prices";
import { RARITIES, raritySort } from "@/lib/constants/rarities";
import { prisma } from "@/lib/db";
import { pullChance, PACKS_PER_BOX } from "@/lib/utils/pull-rate";
import type {
  RarityGroup,
  CardData,
} from "@/components/sets/set-detail-content";

/**
 * Single source of truth for the set-detail page data (live page + proto share
 * it). `cache()` dedupes the base query across generateMetadata + the page.
 */
export const getSet = cache(async (setCode: string) => {
  const code = decodeURIComponent(setCode);
  const cardSet = await prisma.cardSet.findUnique({
    where: { code },
    include: { dropRates: true },
  });
  if (!cardSet) return null;

  const product = await prisma.product.findUnique({ where: { code } });
  const cards = await prisma.card.findMany({
    where: product
      ? { productCards: { some: { productId: product.id } } }
      : { setId: cardSet.id },
    orderBy: [{ latestPriceJpy: "desc" }],
    include: {
      set: { select: { code: true } },
      prices: {
        where: {
          source: PRICE_SOURCE.SNKRDUNK,
          gradeCondition: PRICE_SOURCE.PSA_10,
          type: "SELL",
        },
        orderBy: { scrapedAt: "desc" },
        take: 1,
        select: { priceUsd: true },
      },
    },
  });

  return { ...cardSet, cards, productCardCount: cards.length };
});

export type SetDetailTopCard = {
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
};

export type SetDetailData = {
  set: NonNullable<Awaited<ReturnType<typeof getSet>>>;
  cardCount: number;
  rarityGroups: RarityGroup[];
  totalValue: number;
  avgPrice: number;
  topCard: SetDetailTopCard | null;
  setName: string;
  boxImage: string | null;
  setType: string;
};

/** Build everything the set-detail page renders (derivations on top of getSet). */
export async function getSetDetailData(
  setCode: string,
): Promise<SetDetailData | null> {
  const set = await getSet(setCode);
  if (!set) return null;

  const { cards } = set;
  const withPrice = cards.filter(
    (c) => c.latestPriceJpy != null && c.latestPriceJpy > 0,
  );
  const totalValue = withPrice.reduce((s, c) => s + (c.latestPriceJpy ?? 0), 0);
  const avgPrice =
    withPrice.length > 0 ? Math.round(totalValue / withPrice.length) : 0;

  const top =
    withPrice.length > 0
      ? withPrice.reduce((a, b) =>
          (a.latestPriceJpy ?? 0) > (b.latestPriceJpy ?? 0) ? a : b,
        )
      : null;
  const topCard: SetDetailTopCard | null = top
    ? {
        cardCode: top.cardCode,
        nameJp: top.nameJp,
        nameEn: top.nameEn,
        rarity: top.rarity,
        imageUrl: top.imageUrl,
        latestPriceJpy: top.latestPriceJpy,
      }
    : null;

  const dropRateMap = new Map(set.dropRates.map((dr) => [dr.rarity, dr]));
  const groupsMap = new Map<string, typeof cards>();
  for (const c of cards) {
    if (!groupsMap.has(c.rarity)) groupsMap.set(c.rarity, []);
    groupsMap.get(c.rarity)!.push(c);
  }
  const sortedEntries = [...groupsMap.entries()].sort((a, b) =>
    raritySort(a[0], b[0]),
  );

  const rarityGroups: RarityGroup[] = sortedEntries.map(
    ([rarity, groupCards]) => {
      const info = RARITIES.find((r) => r.code === rarity);
      const dr = dropRateMap.get(rarity);
      const n = groupCards.length;
      const pullRate =
        dr?.avgPerBox != null
          ? {
              rarity,
              avgPerBox: dr.avgPerBox,
              ratePerPack: dr.ratePerPack ?? dr.avgPerBox / PACKS_PER_BOX,
            }
          : undefined;
      const perBox =
        dr?.avgPerBox && n > 0 ? pullChance(dr.avgPerBox, n) : undefined;

      return {
        rarity,
        name: info?.name ?? rarity,
        cards: groupCards.map(
          (c): CardData => ({
            id: c.id,
            cardCode: c.cardCode,
            nameJp: c.nameJp,
            nameEn: c.nameEn,
            rarity: c.rarity,
            isParallel: c.isParallel,
            imageUrl: c.imageUrl,
            latestPriceJpy: c.latestPriceJpy,
            latestPriceThb: c.latestPriceThb,
            priceChange24h: c.priceChange24h,
            priceChange7d: c.priceChange7d,
            priceChange30d: c.priceChange30d,
            setCode: c.set.code,
            psa10PriceUsd: c.prices?.[0]?.priceUsd ?? null,
            cardType: c.cardType,
            color: c.color,
          }),
        ),
        pullRate,
        pullChancePerBox: perBox,
      };
    },
  );

  return {
    set,
    cardCount: cards.length,
    rarityGroups,
    totalValue,
    avgPrice,
    topCard,
    setName: set.nameEn ?? set.name,
    boxImage: set.boxImageUrl ?? topCard?.imageUrl ?? null,
    setType: set.type.replaceAll("_", " "),
  };
}
