"use client"

import Image from "next/image"
import { useState } from "react"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import type { CardListing } from "@/components/cards/card-listings-section"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t, getCardName, getSetName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { useTierLimits } from "@/hooks/use-tier-limits"

import { CardDetailActions } from "./card-detail/actions"
import { CardDetailHeader } from "./card-detail/header"
import { CardPriceHub } from "./card-detail/price-hub"
import { CardDetailInfoTabs } from "./card-detail/info-tabs"
import { SiblingGrid } from "./card-detail-sibling-grid"
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

export function CardDetail({
  card,
  siblings,
  communityPrice: _communityPrice,
  relatedCards,
  snkrdunkPrices,
  availableSources,
  sourcePricesRaw,
  sourcePricesPsa10,
  listings,
}: CardDetailProps) {
  const lang = useUIStore((s) => s.language)
  const { limits } = useTierLimits()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [chartPeriod, setChartPeriod] = useState("30d")
  const [priceMode, setPriceMode] = useState<"raw" | "psa10">("raw")
  const hasPsa10 = !!(
    snkrdunkPrices?.psa10SoldUsd != null || snkrdunkPrices?.psa10AskUsd != null
  )
  const set = card.set
  const displayName = getCardName(lang, card)
  const setName = getSetName(lang, set)

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
        {/* Left column — card image + sibling variants. The sibling grid
            sits directly under the artwork so collectors can scan related
            versions without leaving the main image's visual neighbourhood. */}
        <div className="space-y-6 lg:col-span-5">
          <button
            type="button"
            onClick={() => card.imageUrl && setLightboxOpen(true)}
            className="panel relative mx-auto aspect-[63/88] w-full max-w-[400px] cursor-zoom-in overflow-hidden ring-border transition-shadow hover:ring-2 hover:ring-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:max-w-none"
            aria-label={card.nameEn ?? card.nameJp}
          >
            {card.imageUrl ? (
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
            ) : (
              <Skeleton className="absolute inset-0 size-full" />
            )}
          </button>

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
            <div>
              <p className="mb-3 text-meta">
                {t(lang, "otherVersions")} ({siblings.length})
              </p>
              <SiblingGrid
                siblings={siblings}
                lang={lang}
                cols={3}
                smCols={4}
                mainCardCode={card.cardCode}
              />
            </div>
          )}
        </div>

        {/* Right column — header + actions, price hub (with embedded source
            strip), then info tabs (specs / effect / listings). Actions sit
            with the headline so the primary CTA is visible above the fold
            instead of being pushed below the tall card image. */}
        <div className="space-y-5 lg:col-span-7">
          <CardDetailHeader
            card={card}
            setCode={set.code}
            setName={setName}
            displayName={displayName}
            lang={lang}
          />

          <CardDetailActions
            cardId={card.id}
            cardCode={card.cardCode}
            displayName={displayName}
            rarity={card.rarity}
            imageUrl={card.imageUrl}
            currentPriceJpy={card.price?.priceJpy ?? card.latestPriceJpy}
          />

          <CardPriceHub
            card={card}
            snkrdunkPrices={snkrdunkPrices}
            hasPsa10={hasPsa10}
            priceMode={priceMode}
            onPriceModeChange={setPriceMode}
            chartPeriod={chartPeriod}
            onChartPeriodChange={setChartPeriod}
            availableSources={availableSources}
            sourcePricesRaw={sourcePricesRaw}
            sourcePricesPsa10={sourcePricesPsa10}
            maxDays={limits.priceHistoryDays}
            lang={lang}
          />

          <CardDetailInfoTabs
            card={card}
            cardCode={card.cardCode}
            cardName={displayName}
            listings={listings ?? []}
            lang={lang}
          />
        </div>
      </div>

      <CardDetailRelated relatedCards={relatedCards ?? []} set={set} lang={lang} />
    </div>
  )
}
