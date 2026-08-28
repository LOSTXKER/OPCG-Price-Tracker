import type { Metadata } from "next"

import { getHomeData, mapCardToTrending } from "@/lib/data/home"

import { MobileHomeCompare } from "./mobile-home-compare"

// Same ISR cadence as the real home page — the comparison is only honest if it
// renders the same data the same way. No searchParams read on purpose.
export const revalidate = 300

export const metadata: Metadata = {
  title: "หน้าเทียบหน้าแรกมือถือ",
}

/**
 * /proto/mobile-home — the mobile home page rebuilt twice for an owner
 * decision: variant A ("จัดระเบียบ") tidies gutters/hero/controls in place,
 * variant B adds the market-highlight strip that today exists only on desktop.
 * Real data via getHomeData(); the winning layout gets migrated into
 * src/app/page.tsx + HomeMarketOverview in a later round.
 */
export default async function MobileHomeProtoPage() {
  const {
    topGainers,
    topLosers,
    highestPriced,
    totalCards,
    initialTableCards,
    initialTableTotalPages,
    lastUpdated,
    sets,
    recentSets,
  } = await getHomeData()

  // Pre-formatted per language on the server, same reasoning as page.tsx:
  // the route is ISR and client-side Date formatting risks hydration drift.
  const dateOpts = { day: "numeric", month: "long", year: "numeric" } as const
  const updatedLabels = lastUpdated
    ? {
        TH: new Date(lastUpdated).toLocaleDateString("th-TH", dateOpts),
        EN: new Date(lastUpdated).toLocaleDateString("en-GB", dateOpts),
        JP: new Date(lastUpdated).toLocaleDateString("ja-JP", dateOpts),
      }
    : null

  if (totalCards === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 text-center text-sm text-muted-foreground">
        ยังไม่มีข้อมูลการ์ดในฐานข้อมูล — หน้าเทียบนี้ใช้ข้อมูลจริงเท่านั้น
      </main>
    )
  }

  const tableCards = initialTableCards.map(({ prices, ...c }) => ({
    ...c,
    setCode: c.set.code,
    psa10PriceUsd: prices?.[0]?.priceUsd ?? null,
  }))

  const featured = highestPriced[0] ? mapCardToTrending(highestPriced[0]) : null
  const gainers = topGainers.map(mapCardToTrending).slice(0, 3)
  const losers = topLosers.map(mapCardToTrending).slice(0, 3)

  const setOptions = sets.map((s) => ({
    code: s.code,
    name: s.name,
    nameEn: s.nameEn,
    nameTh: s.nameTh,
    type: s.type,
    imageUrl: s.boxImageUrl,
    releaseDate: s.releaseDate ? s.releaseDate.toISOString() : null,
  }))

  return (
    <MobileHomeCompare
      totalCards={totalCards}
      totalSets={sets.length}
      updatedLabels={updatedLabels}
      featured={featured}
      gainers={gainers}
      losers={losers}
      recentSets={recentSets}
      tableCards={tableCards}
      tableTotalPages={initialTableTotalPages}
      sets={setOptions}
    />
  )
}
