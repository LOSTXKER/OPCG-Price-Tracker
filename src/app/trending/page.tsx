import type { Metadata } from "next";
import { cache } from "react";

import { BarChart3, GitCompareArrows, Layers } from "lucide-react";
import { LocalizedBreadcrumb } from "@/components/shared/localized-breadcrumb";
import { RelatedPages } from "@/components/shared/related-pages";
import { JsonLd } from "@/lib/seo/json-ld-script";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/page-metadata";
import { prisma } from "@/lib/db";
import { getCardName } from "@/lib/i18n";
import {
  TOOL_PAGE_METADATA,
  buildTrendingHeading,
  buildTrendingSummary,
} from "@/lib/seo/copy/tools";
import { formatThb, jpyToThb } from "@/lib/utils/currency";
import { TrendingTabs, TrendingPageHeader } from "./trending-tabs";
import {
  TrendingMoversSections,
  TrendingWorthCollectingSection,
} from "./trending-movers-sections";

// ISR — trending data changes with the daily cron, not per request. The active
// tab reads from `?tab=` client-side (in the tiny URL bridge inside
// TrendingTabs) so the page stays static AND the default table is prerendered.
export const revalidate = 300;

// Thai-first: the crawler-facing language of this site is Thai (see
// doc/seo-content-plan.md §3.8) and reading the language cookie here would opt
// the whole route out of ISR.
const SEO_LANG = "TH" as const;

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

// cache() dedupes this across generateMetadata + the page body — same
// pattern as getSetDetailData() (lib/data/set-detail.ts) — so adding the
// og:image lookup below doesn't cost a second round trip to the DB.
const getTrendingData = cache(async function getTrendingData() {
  const [results, latestPrice] = await Promise.all([
    Promise.all(
      TRENDING_QUERIES.map((q) =>
        prisma.card.findMany({
          where: q.where,
          orderBy: q.orderBy,
          take: TAKE,
          include: TRENDING_INCLUDE,
        })
      )
    ),
    // Freshest scrape overall — feeds the "อัปเดตล่าสุด" meta row under the
    // H1 (SEO round 2, E-E-A-T). Same shape as getMostExpensiveData().
    prisma.cardPrice.findFirst({
      orderBy: { scrapedAt: "desc" },
      select: { scrapedAt: true },
    }),
  ]);

  const keyed = Object.fromEntries(
    TRENDING_QUERIES.map((q, i) => [q.key, results[i]])
  ) as Record<string, typeof results[number]>;

  const { gainers24h, losers24h, gainers7d, losers7d, gainers30d, losers30d, mostViewed } = keyed;

  function mapCards(cards: typeof gainers24h) {
    return cards.map((c) => ({
      cardCode: c.cardCode,
      baseCode: c.baseCode,
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
    lastUpdated: latestPrice?.scrapedAt ? latestPrice.scrapedAt.toISOString() : null,
  };
});

export type TrendingCardRow = Awaited<ReturnType<typeof getTrendingData>>["gainers24h"][number];

// title/description text lives in TOOL_PAGE_METADATA.trending (lib/seo/copy/
// tools.ts, owned by a different workstream) — this only adds the canonical
// og:url + a real og:image (today's top gainer) via the shared helper, same
// shape as every other converted page (SEO round 2).
export async function generateMetadata(): Promise<Metadata> {
  const data = await getTrendingData();
  const top = data.gainers24h[0] ?? null;

  return buildPageMetadata({
    title: TOOL_PAGE_METADATA.trending.title,
    description: TOOL_PAGE_METADATA.trending.description,
    canonical: TOOL_PAGE_METADATA.trending.canonical,
    ogImage: top?.imageUrl ?? null,
  });
}

export default async function TrendingPage() {
  const data = await getTrendingData();

  // Formatted on the server so the header interpolates one stable date
  // string (React 19 forbids Date work during a client render — same
  // constraint as /opcg/most-expensive's `updatedLabel`).
  const updatedLabel = data.lastUpdated
    ? new Date(data.lastUpdated).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const heading = buildTrendingHeading(SEO_LANG);
  const leader = data.gainers24h[0] ?? null;
  const summary = buildTrendingSummary(
    SEO_LANG,
    leader && leader.priceChange24h != null
      ? {
          name: getCardName(SEO_LANG, leader),
          // Public display code — never the internal `_p*` variant suffix.
          cardCode: leader.baseCode ?? leader.cardCode,
          changePct: leader.priceChange24h,
          priceThb: formatThb(Math.round(jpyToThb(leader.latestPriceJpy ?? 0))),
        }
      : null,
  );

  // Losers 24h (not gainers 24h) so this block doesn't repeat the default
  // gainers-24h tab table rendered right above it, and "ราคาลง" actually
  // appears in the server HTML — see trending-movers-sections.tsx docblock.
  const seoSections = [
    { period: "24h" as const, kind: "losers" as const, cards: data.losers24h.slice(0, 10) },
    { period: "7d" as const, kind: "gainers" as const, cards: data.gainers7d.slice(0, 10) },
    { period: "30d" as const, kind: "gainers" as const, cards: data.gainers30d.slice(0, 10) },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Trending", href: "/opcg/trending" }])} />
      <JsonLd
        data={itemListJsonLd(
          heading.h1,
          data.gainers24h.slice(0, 10).map((card) => ({
            // Display name carries the public code; the URL keeps the full
            // cardCode (the variant's real address).
            name: `${card.baseCode ?? card.cardCode} ${getCardName(SEO_LANG, card)}`,
            url: `/opcg/cards/${card.cardCode}`,
            image: card.imageUrl,
          })),
        )}
      />
      <LocalizedBreadcrumb items={[{ labelKey: "home", href: "/" }, { labelKey: "trendingTitle" }]} />
      <div className="space-y-6">
        {/* One keyword sentence under the H1 (server-built, carries today's
            top mover) — the tabs follow immediately. */}
        <TrendingPageHeader lead={summary} updatedLabel={updatedLabel} />

        <TrendingTabs data={data} />

        {/* The three period sections are H2s (one per window) so the page has a
            real heading outline; the wrapper only carries the lead-in copy. */}
        <div className="space-y-4 pt-2">
          <p className="text-body-sm text-muted-foreground">{heading.moversIntro}</p>
          <TrendingMoversSections lang={SEO_LANG} sections={seoSections} />
        </div>

        <TrendingWorthCollectingSection lang={SEO_LANG} />
      </div>
      <RelatedPages
        items={[
          { href: "/opcg/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่าประเมิน" },
          { href: "/opcg/market-overview", icon: BarChart3, title: "Market Overview", description: "สถิติตลาดภาพรวม" },
          { href: "/opcg/compare", icon: GitCompareArrows, title: "เปรียบเทียบ", description: "เทียบการ์ดหลายใบแบบ side-by-side" },
        ]}
      />
    </>
  );
}
