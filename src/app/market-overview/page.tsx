import type { Metadata } from "next"
import { GitCompareArrows, Layers, TrendingUp } from "lucide-react"
import { RelatedPages } from "@/components/shared/related-pages"
import { JsonLd } from "@/lib/seo/json-ld-script"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"
import { prisma } from "@/lib/db"
import { MarketOverviewClient } from "./market-overview-client"

// ISR only — the page reads no request data, so `force-dynamic` (a leftover from
// a build-error sweep) just made every visit re-run the aggregate queries.
export const revalidate = 300

export const metadata: Metadata = {
  title: "Market Overview",
  description:
    "Comprehensive OPCG market statistics — total cards, market value, average price, rarity breakdowns and top sets by value.",
  alternates: { canonical: "/market-overview" },
}

async function getMarketData() {
  const [
    totalCards,
    totalValueAgg,
    avgPriceAgg,
    setCount,
    rarityBreakdown,
    topSetsByValue,
    topCards,
    gainersCount,
    losersCount,
    flatCount,
    weightedDelta7dRow,
    lastUpdatedRow,
  ] = await Promise.all([
    prisma.card.count(),

    prisma.card.aggregate({
      _sum: { latestPriceJpy: true },
      where: { latestPriceJpy: { gt: 0 } },
    }),

    prisma.card.aggregate({
      _avg: { latestPriceJpy: true },
      where: { latestPriceJpy: { gt: 0 } },
    }),

    prisma.cardSet.count(),

    prisma.$queryRaw<{ rarity: string; count: bigint; total_value: number }[]>`
      SELECT rarity, COUNT(*)::bigint as count,
             COALESCE(SUM("latestPriceJpy"), 0) as total_value
      FROM "Card"
      WHERE "latestPriceJpy" > 0
      GROUP BY rarity
      ORDER BY total_value DESC
    `,

    prisma.$queryRaw<{
      code: string
      name: string
      name_en: string | null
      box_image_url: string | null
      card_count: bigint
      total_value: number
      change_7d: number | null
    }[]>`
      SELECT s.code, s.name, s."nameEn" as name_en,
             s."boxImageUrl" as box_image_url,
             COUNT(c.id)::bigint as card_count,
             COALESCE(SUM(c."latestPriceJpy"), 0) as total_value,
             CASE WHEN SUM(c."latestPriceJpy") > 0
                  THEN SUM(c."latestPriceJpy" * COALESCE(c."priceChange7d", 0))
                       / NULLIF(SUM(CASE WHEN c."priceChange7d" IS NOT NULL THEN c."latestPriceJpy" ELSE 0 END), 0)
             END as change_7d
      FROM "CardSet" s
      JOIN "Card" c ON c."setId" = s.id
      WHERE c."latestPriceJpy" > 0
      GROUP BY s.id, s.code, s.name, s."nameEn", s."boxImageUrl"
      ORDER BY total_value DESC
      LIMIT 10
    `,

    prisma.card.findMany({
      where: { latestPriceJpy: { gt: 0 } },
      orderBy: { latestPriceJpy: "desc" },
      take: 6,
      select: {
        cardCode: true,
        nameJp: true,
        nameEn: true,
        nameTh: true,
        rarity: true,
        imageUrl: true,
        latestPriceJpy: true,
        priceChange7d: true,
        set: { select: { code: true } },
      },
    }),

    prisma.card.count({
      where: { latestPriceJpy: { gt: 0 }, priceChange7d: { gt: 0 } },
    }),

    prisma.card.count({
      where: { latestPriceJpy: { gt: 0 }, priceChange7d: { lt: 0 } },
    }),

    prisma.card.count({
      where: {
        latestPriceJpy: { gt: 0 },
        OR: [{ priceChange7d: 0 }, { priceChange7d: null }],
      },
    }),

    prisma.$queryRaw<{ weighted_delta: number | null }[]>`
      SELECT
        SUM("latestPriceJpy" * "priceChange7d")
          / NULLIF(SUM(CASE WHEN "priceChange7d" IS NOT NULL THEN "latestPriceJpy" ELSE 0 END), 0)
          AS weighted_delta
      FROM "Card"
      WHERE "latestPriceJpy" > 0 AND "priceChange7d" IS NOT NULL
    `,

    prisma.cardPrice.aggregate({ _max: { scrapedAt: true } }),
  ])

  return {
    totalCards,
    totalValue: totalValueAgg._sum.latestPriceJpy ?? 0,
    avgPrice: Math.round(avgPriceAgg._avg.latestPriceJpy ?? 0),
    setCount,
    rarityBreakdown: rarityBreakdown.map((r) => ({
      rarity: r.rarity,
      count: Number(r.count),
      totalValue: Number(r.total_value),
    })),
    topSetsByValue: topSetsByValue.map((s) => ({
      code: s.code,
      name: s.name_en ?? s.name,
      boxImageUrl: s.box_image_url,
      cardCount: Number(s.card_count),
      totalValue: Number(s.total_value),
      change7d: s.change_7d == null ? null : Number(s.change_7d),
    })),
    topCards: topCards.map((c) => ({
      cardCode: c.cardCode,
      nameJp: c.nameJp,
      nameEn: c.nameEn,
      nameTh: c.nameTh,
      rarity: c.rarity,
      imageUrl: c.imageUrl,
      latestPriceJpy: c.latestPriceJpy ?? 0,
      priceChange7d: c.priceChange7d,
      setCode: c.set.code,
    })),
    movers: {
      up: gainersCount,
      down: losersCount,
      flat: flatCount,
    },
    weightedDelta7d:
      weightedDelta7dRow[0]?.weighted_delta == null
        ? null
        : Number(weightedDelta7dRow[0].weighted_delta),
    lastUpdatedAt: lastUpdatedRow._max.scrapedAt?.toISOString() ?? null,
  }
}

export type MarketOverviewData = Awaited<ReturnType<typeof getMarketData>>

export default async function MarketOverviewPage() {
  const data = await getMarketData()

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Market Overview", href: "/market-overview" }])} />
      <MarketOverviewClient data={data} />
      <RelatedPages
        items={[
          { href: "/trending", icon: TrendingUp, title: "Trending", description: "การ์ดที่ราคาขยับมากที่สุด" },
          { href: "/sets", icon: Layers, title: "ชุดการ์ด", description: "ดูทุกชุดการ์ดพร้อมมูลค่า" },
          { href: "/compare", icon: GitCompareArrows, title: "เปรียบเทียบ", description: "เทียบการ์ดหลายใบ" },
        ]}
      />
    </>
  )
}
