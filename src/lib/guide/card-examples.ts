import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/db";
import { jpyToThb } from "@/lib/utils/currency";

/**
 * Real catalogue examples for the /guide pages.
 *
 * Why this module exists: the guide pages that query Prisma (rarities,
 * card-types, colors, sets, getting-started) all have something to look at,
 * and the three that don't (authenticity, buying, versions) are pure walls of
 * text. Rather than let each of those grow its own ad-hoc query, they share
 * these — so the caching story is uniform and a page can't accidentally ship an
 * uncached scan.
 *
 * Rules every export here follows:
 *   - wrapped in `unstable_cache` (guide pages are `force-dynamic` because they
 *     read the language cookie, so an uncached query would hit the DB on every
 *     request — crawlers included)
 *   - `try/catch` returning an empty value, never a throw: a guide page must
 *     still render its prose if the database is unreachable
 *   - callers hide the surrounding block when the result is empty, so a figure
 *     is never an empty box
 */

export type GuideExampleCard = {
  cardCode: string;
  name: string;
  imageUrl: string | null;
  priceThb: number | null;
};

const CARD_SELECT = {
  cardCode: true,
  nameEn: true,
  nameJp: true,
  imageUrl: true,
  latestPriceJpy: true,
} as const;

type RawCard = {
  cardCode: string;
  nameEn: string | null;
  nameJp: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
};

function toExample(card: RawCard): GuideExampleCard {
  return {
    cardCode: card.cardCode,
    name: card.nameEn ?? card.nameJp,
    imageUrl: card.imageUrl,
    priceThb: card.latestPriceJpy == null ? null : Math.round(jpyToThb(card.latestPriceJpy)),
  };
}

/** Latest price-scrape timestamp — the freshness stamp under any price block. */
export const getGuidePriceSnapshot = unstable_cache(
  async (): Promise<string | null> => {
    try {
      const latest = await prisma.cardPrice.findFirst({
        orderBy: { scrapedAt: "desc" },
        select: { scrapedAt: true },
      });
      return latest?.scrapedAt ? latest.scrapedAt.toISOString() : null;
    } catch {
      return null;
    }
  },
  ["guide-price-snapshot"],
  { revalidate: 3600, tags: ["guide-cards"] },
);

/**
 * The priciest cards that have artwork — used where a page argues that value
 * is what attracts counterfeits, or simply needs to show what "expensive" looks
 * like instead of asserting it.
 */
export const getGuideTopCards = unstable_cache(
  async (take = 6): Promise<GuideExampleCard[]> => {
    try {
      const cards = await prisma.card.findMany({
        where: { imageUrl: { not: null }, latestPriceJpy: { not: null } },
        select: CARD_SELECT,
        orderBy: { latestPriceJpy: "desc" },
        take,
      });
      return cards.map(toExample);
    } catch {
      return [];
    }
  },
  ["guide-top-cards"],
  { revalidate: 3600, tags: ["guide-cards"] },
);

export type GuideParallelPair = {
  name: string;
  base: GuideExampleCard;
  parallel: GuideExampleCard;
};

/**
 * Floor for the *normal* print, in yen — keeps the comparison off ¥100 bulk
 * commons, where any ratio becomes noise (the catalogue holds true-but-useless
 * pairs at 800x–4000x).
 */
const PAIR_MIN_BASE_JPY = 500;
/** Ratio guard. Below 2x there is no story; above 100x it reads as a typo. */
const PAIR_MIN_RATIO = 2;
const PAIR_MAX_RATIO = 100;
/** How many priced candidates to art-check before giving up (2 HEAD requests each). */
const PAIR_MAX_CANDIDATES = 12;

/**
 * Content fingerprint for a card image, without downloading it.
 *
 * The card CDN returns an ETag equal to the file's MD5, so a HEAD request is an
 * exact identity check. Falls back to Content-Length, which is still a reliable
 * discriminator here. Returns null on any failure so callers treat the image as
 * unverifiable rather than assuming a match.
 */
async function imageFingerprint(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    return res.headers.get("etag") ?? res.headers.get("content-length");
  } catch {
    return null;
  }
}

/**
 * One real card that exists as both a normal print and a parallel, with both
 * sides priced — the single most useful exhibit on the site, because "the same
 * card in two versions costs wildly different money" is the premise the whole
 * price tracker rests on.
 *
 * Deliberately NOT the widest gap in the catalogue. The extremes are real but
 * unrepresentative: they pair a ¥100-ish bulk print against a six-figure manga-art
 * parallel and land at 800x–4000x, which reads as a typo and teaches nothing.
 *
 * The art is then VERIFIED to actually differ, which matters more than the price
 * gap: roughly 60% of parallel rows in the catalogue currently point at an image
 * file byte-identical to their base card's (the alt art was never scraped), so
 * picking on price alone renders the same picture twice and the figure argues
 * against itself. Candidates are walked dearest-first and the first pair whose
 * images have different fingerprints wins. This self-heals — once the scraper
 * backfills the real alt art, better pairs start qualifying automatically.
 *
 * Returns null when nothing qualifies; callers drop the block.
 */
export const getGuideParallelPair = unstable_cache(
  async (): Promise<GuideParallelPair | null> => {
    try {
      const parallels = await prisma.card.findMany({
        where: {
          isParallel: true,
          imageUrl: { not: null },
          latestPriceJpy: { not: null },
          baseCode: { not: null },
        },
        select: { ...CARD_SELECT, baseCode: true },
        orderBy: { latestPriceJpy: "desc" },
      });
      if (parallels.length === 0) return null;

      const baseCodes = [...new Set(parallels.map((p) => p.baseCode).filter((c): c is string => !!c))];
      const bases = await prisma.card.findMany({
        where: {
          cardCode: { in: baseCodes },
          isParallel: false,
          imageUrl: { not: null },
          latestPriceJpy: { gte: PAIR_MIN_BASE_JPY },
        },
        select: CARD_SELECT,
      });
      const baseByCode = new Map(bases.map((b) => [b.cardCode, b]));

      // `parallels` is sorted dearest-first, so the first pair that clears both
      // the price band and the art check is the most eye-catching honest one.
      let checked = 0;
      for (const parallel of parallels) {
        if (checked >= PAIR_MAX_CANDIDATES) break;
        const base = parallel.baseCode ? baseByCode.get(parallel.baseCode) : undefined;
        if (!base?.latestPriceJpy || !parallel.latestPriceJpy) continue;
        if (!base.imageUrl || !parallel.imageUrl) continue;
        const ratio = parallel.latestPriceJpy / base.latestPriceJpy;
        if (ratio < PAIR_MIN_RATIO || ratio > PAIR_MAX_RATIO) continue;

        checked += 1;
        const [baseArt, parallelArt] = await Promise.all([
          imageFingerprint(base.imageUrl),
          imageFingerprint(parallel.imageUrl),
        ]);
        // Unverifiable (null) is treated as "don't risk it" — the whole point of
        // the figure is that the two pictures look different.
        if (!baseArt || !parallelArt || baseArt === parallelArt) continue;

        return {
          name: base.nameEn ?? base.nameJp,
          base: toExample(base),
          parallel: toExample(parallel),
        };
      }
      return null;
    } catch {
      return null;
    }
  },
  ["guide-parallel-pair-v3"],
  { revalidate: 3600, tags: ["guide-cards"] },
);

export type GuideBoosterSet = {
  code: string;
  name: string;
  boxImageUrl: string | null;
  cardCount: number;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  topCard: GuideExampleCard | null;
};

/**
 * The newest booster set plus its box maths and priciest card — turns the
 * "buy a box or buy singles?" section from an abstract argument into a concrete
 * one about a set the reader can actually go and buy.
 */
export const getGuideLatestBooster = unstable_cache(
  async (): Promise<GuideBoosterSet | null> => {
    try {
      const set = await prisma.cardSet.findFirst({
        where: { type: "BOOSTER" },
        orderBy: [{ releaseDate: "desc" }, { code: "desc" }],
        select: {
          id: true,
          code: true,
          name: true,
          nameTh: true,
          boxImageUrl: true,
          cardCount: true,
          packsPerBox: true,
          cardsPerPack: true,
        },
      });
      if (!set) return null;

      const topCard = await prisma.card.findFirst({
        where: { setId: set.id, imageUrl: { not: null }, latestPriceJpy: { not: null } },
        select: CARD_SELECT,
        orderBy: { latestPriceJpy: "desc" },
      });

      return {
        code: set.code,
        name: set.nameTh ?? set.name,
        boxImageUrl: set.boxImageUrl,
        cardCount: set.cardCount,
        packsPerBox: set.packsPerBox,
        cardsPerPack: set.cardsPerPack,
        topCard: topCard ? toExample(topCard) : null,
      };
    } catch {
      return null;
    }
  },
  ["guide-latest-booster"],
  { revalidate: 3600, tags: ["guide-cards"] },
);
