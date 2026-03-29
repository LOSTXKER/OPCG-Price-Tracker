import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { TrendingTabs, TrendingPageHeader } from "./trending-tabs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Trending Cards — Biggest Price Movers",
  description: "Cards with the most price movement in 24h, 7d, and 30d",
};

const TAKE = 50;

const TRENDING_INCLUDE = {
  set: { select: { code: true, name: true, nameEn: true } },
  prices: { orderBy: { scrapedAt: "desc" as const }, take: 7, select: { priceJpy: true } },
} as const;

type TrendingQuery = {
  key: string;
  where: Record<string, unknown>;
  orderBy: Record<string, "asc" | "desc">;
};

const TRENDING_QUERIES: TrendingQuery[] = [
  { key: "gainers24h",  where: { priceChange24h: { not: null, gt: 0 }, latestPriceJpy: { gt: 0 } }, orderBy: { priceChange24h: "desc" } },
  { key: "losers24h",   where: { priceChange24h: { not: null, lt: 0 }, latestPriceJpy: { gt: 0 } }, orderBy: { priceChange24h: "asc" } },
  { key: "gainers7d",   where: { priceChange7d:  { not: null, gt: 0 }, latestPriceJpy: { gt: 0 } }, orderBy: { priceChange7d: "desc" } },
  { key: "losers7d",    where: { priceChange7d:  { not: null, lt: 0 }, latestPriceJpy: { gt: 0 } }, orderBy: { priceChange7d: "asc" } },
  { key: "gainers30d",  where: { priceChange30d: { not: null, gt: 0 }, latestPriceJpy: { gt: 0 } }, orderBy: { priceChange30d: "desc" } },
  { key: "losers30d",   where: { priceChange30d: { not: null, lt: 0 }, latestPriceJpy: { gt: 0 } }, orderBy: { priceChange30d: "asc" } },
  { key: "mostViewed",  where: { viewCount: { gt: 0 }, latestPriceJpy: { gt: 0 } },                 orderBy: { viewCount: "desc" } },
];

async function getTrendingData() {
  const results = await Promise.all(
    TRENDING_QUERIES.map((q) =>
      prisma.card.findMany({
        where: q.where,
        orderBy: q.orderBy,
        take: TAKE,
        include: TRENDING_INCLUDE,
      })
    )
  );

  const keyed = Object.fromEntries(
    TRENDING_QUERIES.map((q, i) => [q.key, results[i]])
  ) as Record<string, typeof results[number]>;

  const { gainers24h, losers24h, gainers7d, losers7d, gainers30d, losers30d, mostViewed } = keyed;

  function mapCards(cards: typeof gainers24h) {
    return cards.map((c) => ({
      cardCode: c.cardCode,
      nameJp: c.nameJp,
      nameEn: c.nameEn,
      nameTh: c.nameTh,
      rarity: c.rarity,
      isParallel: c.isParallel,
      imageUrl: c.imageUrl,
      latestPriceJpy: c.latestPriceJpy,
      priceChange24h: c.priceChange24h,
      priceChange7d: c.priceChange7d,
      priceChange30d: c.priceChange30d,
      viewCount: c.viewCount,
      setCode: c.set.code,
      sparkline: c.prices.map((p) => p.priceJpy).filter((v): v is number => v != null).reverse(),
    }));
  }

  return {
    gainers24h: mapCards(gainers24h),
    losers24h: mapCards(losers24h),
    gainers7d: mapCards(gainers7d),
    losers7d: mapCards(losers7d),
    gainers30d: mapCards(gainers30d),
    losers30d: mapCards(losers30d),
    mostViewed: mapCards(mostViewed),
  };
}

export type TrendingCardRow = Awaited<ReturnType<typeof getTrendingData>>["gainers24h"][number];

export default async function TrendingPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const initialTab = typeof sp.tab === "string" ? sp.tab : "gainers";
  const data = await getTrendingData();

  return (
    <div className="space-y-6">
      <TrendingPageHeader />
      <TrendingTabs data={data} initialTab={initialTab} />
    </div>
  );
}
