import type { Metadata } from "next"
import Link from "next/link"
import { GitCompareArrows, Layers, TrendingUp } from "lucide-react"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { RelatedPages } from "@/components/shared/related-pages"
import { JsonLd } from "@/lib/seo/json-ld-script"
import { breadcrumbJsonLd } from "@/lib/seo/json-ld"
import { prisma } from "@/lib/db"
import { MarketOverviewClient } from "./market-overview-client"

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

    prisma.$queryRaw<{ code: string; name: string; name_en: string | null; card_count: bigint; total_value: number }[]>`
      SELECT s.code, s.name, s."nameEn" as name_en,
             COUNT(c.id)::bigint as card_count,
             COALESCE(SUM(c."latestPriceJpy"), 0) as total_value
      FROM "CardSet" s
      JOIN "Card" c ON c."setId" = s.id
      WHERE c."latestPriceJpy" > 0
      GROUP BY s.id, s.code, s.name, s."nameEn"
      ORDER BY total_value DESC
      LIMIT 10
    `,
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
      cardCount: Number(s.card_count),
      totalValue: Number(s.total_value),
    })),
  }
}

export default async function MarketOverviewPage() {
  const data = await getMarketData()

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Market Overview", href: "/market-overview" }])} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Market Overview" }]} />
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
