"use client"

import Image from "next/image"
import { useState } from "react"
import { Expand } from "lucide-react"

import { Breadcrumb } from "@/components/shared/breadcrumb"
import {
  CardListingsSection,
  type CardListing,
} from "@/components/cards/card-listings-section"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t, getCardName, getSetName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { useTierLimits } from "@/hooks/use-tier-limits"
import type { ChartStats } from "@/components/cards/price-chart"

import { CardDetailHeader } from "./card-detail/header"
import { CardPriceStatsPanel } from "./card-detail/price-stats"
import { SourceMarketsTable } from "./source-markets-table"
import { SiblingGrid } from "./card-detail-sibling-grid"
import { CardDetailSpecs } from "./card-detail-specs"
import { CardDetailRelated } from "./card-detail-related"

export interface SiblingCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export interface RelatedCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  nameTh?: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
  set: { code: string }
}

export interface CardDetailProps {
  card: {
    id: number
    cardCode: string
    baseCode: string | null
    nameJp: string
    nameEn?: string | null
    nameTh?: string | null
    cardType: string
    color: string
    colorEn?: string | null
    rarity: string
    isParallel: boolean
    cost?: number | null
    power?: number | null
    counter?: number | null
    life?: number | null
    attribute?: string | null
    trait?: string | null
    effectJp?: string | null
    effectEn?: string | null
    effectTh?: string | null
    viewCount: number
    imageUrl: string | null
    latestPriceJpy: number | null
    latestPriceThb: number | null
    priceChange24h: number | null
    priceChange7d: number | null
    priceChange30d: number | null
    set: { code: string; name: string; nameEn?: string | null; nameTh?: string | null }
    price: { priceJpy: number; priceThb: number | null; inStock: boolean } | null
    chartData: { scrapedAt: string; priceJpy: number | null; priceThb: number | null; priceUsd: number | null; source?: string; gradeCondition?: string | null }[]
  }
  siblings: SiblingCard[]
  communityPrice?: { avgThb: number | null; reportCount: number } | null
  relatedCards?: RelatedCard[]
  snkrdunkPrices?: {
    minPriceUsd: number | null
    psa10AskUsd: number | null
    psa10SoldUsd: number | null
    lastSoldUsd: number | null
  } | null
  availableSources?: { id: string; label: string; source?: string; grade?: string; currency: "JPY" | "USD" }[]
  sourcePricesRaw?: { source: string; askPriceJpy: number | null; askPriceThb: number | null; askPriceUsd: number | null; soldPriceJpy: number | null; soldPriceThb: number | null; soldPriceUsd: number | null; updatedAt: string | null }[]
  sourcePricesPsa10?: { source: string; askPriceJpy: number | null; askPriceThb: number | null; askPriceUsd: number | null; soldPriceJpy: number | null; soldPriceThb: number | null; soldPriceUsd: number | null; updatedAt: string | null }[]
  /** ISO timestamp of the most recent price observation across all sources. */
  latestUpdatedAt?: string | null
  /**
   * Days since `latestUpdatedAt` — pre-computed on the server because the
   * React 19 purity rule forbids `Date.now()` during render.
   */
  daysSinceUpdate?: number | null
  /** Active marketplace listings for this card (passed from server). */
  listings?: CardListing[]
}

const STALE_THRESHOLD_DAYS = 7

export function CardDetail({
  card,
  siblings,
  communityPrice: _communityPrice,
  relatedCards,
  snkrdunkPrices,
  availableSources,
  sourcePricesRaw,
  sourcePricesPsa10,
  latestUpdatedAt,
  daysSinceUpdate,
  listings,
}: CardDetailProps) {
  const lang = useUIStore((s) => s.language)
  const { limits } = useTierLimits()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [chartPeriod, setChartPeriod] = useState("30d")
  const [chartStats, setChartStats] = useState<ChartStats | null>(null)
  const [priceMode, setPriceMode] = useState<"raw" | "psa10">("raw")
  const hasPsa10 = !!(
    snkrdunkPrices?.psa10SoldUsd != null || snkrdunkPrices?.psa10AskUsd != null
  )
  const set = card.set
  const displayName = getCardName(lang, card)
  const setName = getSetName(lang, set)

  // Stale-data evaluation lives on the server (see page.tsx) — we just use
  // the pre-computed `daysSinceUpdate` here so render stays pure.
  const isStale =
    daysSinceUpdate != null && daysSinceUpdate > STALE_THRESHOLD_DAYS

  // Source-table visibility — hide entirely when only one source is known so
  // we don't repeat info already shown in the price card.
  const visibleSourceRows = priceMode === "psa10" ? sourcePricesPsa10 : sourcePricesRaw
  const showSourceTable = (visibleSourceRows?.length ?? 0) > 1

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "sets"), href: "/sets" },
          { label: setName, href: `/sets/${set.code}` },
          { label: card.baseCode ?? card.cardCode },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-4">
          <div>
            <button
              type="button"
              onClick={() => card.imageUrl && setLightboxOpen(true)}
              className="panel group/img relative mx-auto aspect-[63/88] w-full max-w-[400px] cursor-zoom-in overflow-hidden lg:max-w-none"
            >
              {card.imageUrl ? (
                <>
                  <Image
                    src={card.imageUrl}
                    alt={card.nameEn ?? card.nameJp}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 400px, 40vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    priority
                  />
                  <span className="absolute right-2 top-2 rounded-lg bg-black/50 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/img:opacity-100">
                    <Expand className="size-4" />
                  </span>
                </>
              ) : (
                <Skeleton className="absolute inset-0 size-full" />
              )}
            </button>
          </div>

          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogContent className="max-w-[90vw] border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-[90vw] [&>[data-slot=dialog-close]]:text-white [&>[data-slot=dialog-close]]:hover:bg-white/20">
              <DialogTitle className="sr-only">{card.nameEn ?? card.nameJp}</DialogTitle>
              {card.imageUrl && (
                <Image
                  src={card.imageUrl}
                  alt={card.nameEn ?? card.nameJp}
                  width={800}
                  height={1120}
                  className="mx-auto max-h-[90vh] w-auto rounded-lg object-contain"
                  priority
                />
              )}
            </DialogContent>
          </Dialog>

          {siblings.length > 0 && (
            <div className="hidden lg:block">
              <p className="mb-3 text-meta">
                {t(lang, "otherVersions")} ({siblings.length})
              </p>
              <SiblingGrid
                siblings={siblings}
                lang={lang}
                cols={4}
                mainCardCode={card.cardCode}
              />
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-7">
          <CardDetailHeader
            card={card}
            setCode={set.code}
            setName={setName}
            displayName={displayName}
            lang={lang}
          />

          <CardPriceStatsPanel
            card={card}
            snkrdunkPrices={snkrdunkPrices}
            hasPsa10={hasPsa10}
            priceMode={priceMode}
            onPriceModeChange={setPriceMode}
            chartPeriod={chartPeriod}
            onChartPeriodChange={setChartPeriod}
            chartStats={chartStats}
            onChartStatsChange={(period, stats) => {
              setChartPeriod(period)
              setChartStats(stats)
            }}
            availableSources={availableSources}
            latestUpdatedAt={latestUpdatedAt}
            isStale={isStale}
            maxDays={limits.priceHistoryDays}
            lang={lang}
          />

          {/* Inline marketplace listings — surfaces seller activity that lives
              in the system but used to be impossible to discover from a card. */}
          <CardListingsSection
            cardCode={card.cardCode}
            cardName={displayName}
            listings={listings ?? []}
          />

          <CardDetailSpecs card={card} lang={lang} />

          {/* Reference markets — moved to the bottom and collapsed by default
              so the headline price + chart remain the focal point. The user
              can drill down here to compare other source markets when needed. */}
          {showSourceTable && (
            <SourceMarketsTable
              rows={visibleSourceRows ?? []}
              cardCode={card.baseCode ?? card.cardCode}
              headlinePriceJpy={priceMode === "raw" ? card.price?.priceJpy ?? null : null}
            />
          )}
        </div>
      </div>

      {siblings.length > 0 && (
        <div className="lg:hidden">
          <p className="mb-3 text-meta">
            {t(lang, "otherVersions")} ({siblings.length})
          </p>
          <SiblingGrid
            siblings={siblings}
            lang={lang}
            cols={4}
            smCols={5}
            mainCardCode={card.cardCode}
          />
        </div>
      )}

      <CardDetailRelated relatedCards={relatedCards ?? []} set={set} lang={lang} />
    </div>
  )
}
