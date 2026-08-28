import { cache } from "react";

import { PRICE_SOURCE } from "@/lib/constants/prices";
import { RARITIES, raritySort } from "@/lib/constants/rarities";
import { resolveSetReleaseDate } from "@/lib/constants/sets";
import { prisma } from "@/lib/db";
import { getCardName, type Language } from "@/lib/i18n";
import { summarizeCardCodes } from "@/lib/cards/card-code";
import { pullChance, PACKS_PER_BOX } from "@/lib/utils/pull-rate";
import type { SetSeoData } from "@/lib/seo/copy/sets";
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

  // Freshness must come from the market rows themselves. Card.updatedAt also
  // changes for translations/admin edits, so it cannot support a price claim.
  const cardIds = cards.map((card) => card.id);
  const latestRawPrice = cardIds.length
    ? await prisma.cardPrice.findFirst({
        where: {
          cardId: { in: cardIds },
          source: PRICE_SOURCE.YUYUTEI,
          type: "SELL",
          gradeCondition: null,
          priceJpy: { gt: 0 },
        },
        orderBy: { scrapedAt: "desc" },
        select: { scrapedAt: true },
      })
    : null;

  const releaseDate = resolveSetReleaseDate(code, cardSet.releaseDate);

  return {
    ...cardSet,
    releaseDate,
    cards,
    latestRawPriceAt: latestRawPrice?.scrapedAt ?? null,
    productCardCount: cards.length,
  };
});

/** Every set code — feeds `generateStaticParams` for the ISR set-detail route.
 *  Returns [] when the DB is unreachable so a build never hard-fails; unlisted
 *  codes still render on demand (`dynamicParams` defaults to true). */
export const getAllSetCodes = cache(async (): Promise<string[]> => {
  try {
    const sets = await prisma.cardSet.findMany({ select: { code: true } });
    return sets.map((s) => s.code);
  } catch (error) {
    console.error("Failed to list set codes for static params:", error);
    return [];
  }
});

export type OtherSet = {
  id: number;
  code: string;
  name: string;
  nameEn: string | null;
  boxImageUrl: string | null;
};

/** A handful of other sets to browse from the bottom of a set-detail page.
 *  Falls back to a representative card image when a set has no box art (mirrors
 *  the sets-index tiles). */
export const getOtherSets = cache(
  async (excludeCode: string, take = 14): Promise<OtherSet[]> => {
    const code = decodeURIComponent(excludeCode);
    const sets = await prisma.cardSet.findMany({
      where: { code: { not: code } },
      orderBy: [{ releaseDate: "desc" }, { code: "asc" }],
      take,
      select: { id: true, code: true, name: true, nameEn: true, boxImageUrl: true },
    });

    const fallbackNeeded = sets.filter((s) => !s.boxImageUrl).map((s) => s.id);
    const imgMap = new Map<number, string>();
    if (fallbackNeeded.length) {
      const cards = await prisma.card.findMany({
        where: { setId: { in: fallbackNeeded }, imageUrl: { not: null } },
        orderBy: { cardCode: "asc" },
        select: { setId: true, imageUrl: true },
      });
      for (const c of cards) {
        if (c.imageUrl && !imgMap.has(c.setId)) imgMap.set(c.setId, c.imageUrl);
      }
    }

    return sets.map((s) => ({
      ...s,
      boxImageUrl: s.boxImageUrl ?? imgMap.get(s.id) ?? null,
    }));
  },
);

export type SetDetailTopCard = {
  cardCode: string;
  /** Public display code — no internal `_p*` variant suffix. */
  baseCode: string | null;
  nameJp: string;
  nameEn: string | null;
  /** Thai card name — populated for ~all cards; drives the Thai-first copy. */
  nameTh: string | null;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
};

export type SetDetailData = {
  set: NonNullable<Awaited<ReturnType<typeof getSet>>>;
  cardCount: number;
  baseCardCount: number;
  variantCount: number;
  rarityGroups: RarityGroup[];
  totalValue: number;
  avgPrice: number;
  topCard: SetDetailTopCard | null;
  setName: string;
  boxImage: string | null;
  setType: string;
};

/** Build everything the set-detail page renders (derivations on top of getSet).
 *  `cache()` so generateMetadata and the page body share one computation. */
export const getSetDetailData = cache(async (
  setCode: string,
): Promise<SetDetailData | null> => {
  const set = await getSet(setCode);
  if (!set) return null;

  const { cards } = set;
  const cardSummary = summarizeCardCodes(cards.map((card) => card.cardCode));
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
        baseCode: top.baseCode,
        nameJp: top.nameJp,
        nameEn: top.nameEn,
        nameTh: top.nameTh,
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
            // Thai name is in the DB for ~all cards; without it the card wall
            // (≈130 links per set page) renders English for Thai readers.
            nameTh: c.nameTh,
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
    baseCardCount: cardSummary.baseCardCount,
    variantCount: cardSummary.variantCount,
    rarityGroups,
    totalValue,
    avgPrice,
    topCard,
    setName: set.nameEn ?? set.name,
    boxImage: set.boxImageUrl ?? topCard?.imageUrl ?? null,
    setType: set.type.replaceAll("_", " "),
  };
});

/**
 * Flatten the set-detail payload into the shape the SEO copy builders consume
 * (metadata, intro prose, FAQ). Kept next to the query so the copy module never
 * has to know about Prisma or the card-wall component types.
 */
export function toSetSeoData(
  lang: Language,
  data: SetDetailData,
): SetSeoData {
  return {
    code: data.set.code,
    // CardSet.nameTh is NULL for every set in production — the English name is
    // the only real one, wrapped in Thai context words by the copy module.
    name: data.setName,
    type: data.set.type,
    releaseDate: data.set.releaseDate,
    cardCount: data.cardCount,
    baseCardCount: data.baseCardCount,
    variantCount: data.variantCount,
    latestPriceAt: data.set.latestRawPriceAt,
    packsPerBox: data.set.packsPerBox,
    cardsPerPack: data.set.cardsPerPack,
    rarities: data.rarityGroups.map((group) => ({
      rarity: group.rarity,
      name: group.name,
      count: group.cards.length,
      avgPerBox: group.pullRate?.avgPerBox,
      chancePerBoxPerCard: group.pullChancePerBox,
    })),
    topCard: data.topCard?.latestPriceJpy
      ? {
          name: getCardName(lang, data.topCard),
          // Public display code — copy/FAQ/JSON never print the `_p*` suffix.
          cardCode: data.topCard.baseCode ?? data.topCard.cardCode,
          rarity: data.topCard.rarity,
          priceJpy: data.topCard.latestPriceJpy,
        }
      : null,
  };
}
