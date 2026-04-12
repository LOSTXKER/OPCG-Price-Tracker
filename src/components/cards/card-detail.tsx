"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Expand, Shield, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PriceDisplay } from "@/components/shared/price-display"
import { PriceUsd } from "@/components/shared/price-usd"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { CompareButton } from "@/components/shared/compare-button"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t, getCardName, getSetName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatPct } from "@/lib/utils/currency"
import { useTierLimits } from "@/hooks/use-tier-limits"

import dynamic from "next/dynamic"

const CardDetailPriceChart = dynamic(
  () => import("./card-detail-price-chart").then((m) => m.CardDetailPriceChart),
  { ssr: false, loading: () => <div className="h-[340px] animate-pulse rounded-xl bg-muted" /> }
)
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
}

export function CardDetail({ card, siblings, communityPrice: _communityPrice, relatedCards, snkrdunkPrices, availableSources, sourcePricesRaw, sourcePricesPsa10 }: CardDetailProps) {
  const lang = useUIStore((s) => s.language)
  const { limits } = useTierLimits()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [chartPeriod, setChartPeriod] = useState("30d")
  const [priceMode, setPriceMode] = useState<"raw" | "psa10">("raw")
  const hasPsa10 = !!(snkrdunkPrices?.psa10SoldUsd != null || snkrdunkPrices?.psa10AskUsd != null)
  const set = card.set
  const displayName = getCardName(lang, card)
  const setName = getSetName(lang, set)

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: t(lang, "home"), href: "/" },
          { label: t(lang, "sets"), href: "/sets" },
          { label: set.code.toUpperCase(), href: `/sets/${set.code}` },
          { label: card.baseCode ?? card.cardCode },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Image column */}
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
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {card.viewCount.toLocaleString()} {t(lang, "views")}
            </p>
          </div>

          {lightboxOpen && card.imageUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setLightboxOpen(false)}
            >
              <button
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close lightbox"
              >
                <X className="size-6" />
              </button>
              <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                <Image src={card.imageUrl} alt={card.nameEn ?? card.nameJp} width={800} height={1120} className="max-h-[90vh] w-auto rounded-lg object-contain" priority />
              </div>
            </div>
          )}

          {siblings.length > 0 && (
            <div className="hidden lg:block">
              <p className="mb-3 text-xs text-muted-foreground">
                {t(lang, "otherVersions")} ({siblings.length})
              </p>
              <SiblingGrid siblings={siblings} lang={lang} cols={4} />
            </div>
          )}
        </div>

        {/* Data column */}
        <div className="space-y-4 lg:col-span-7">
          {/* Title */}
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-price text-xs text-muted-foreground">{card.baseCode ?? card.cardCode}</span>
              <RarityBadge rarity={card.rarity} size="md" />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="page-header min-w-0 break-words">{displayName}</h1>
              <WatchlistStar cardId={card.id} size="md" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <Link href={`/sets/${set.code}`} className="hover:text-foreground hover:underline underline-offset-4">
                {set.code.toUpperCase()} &middot; {setName}
              </Link>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CardAddToPortfolio cardId={card.id} cardName={displayName} />
              <CompareButton
                item={{ cardCode: card.cardCode, name: displayName, imageUrl: card.imageUrl, rarity: card.rarity }}
                variant="label"
              />
            </div>
          </div>

          {/* Price + Chart panel */}
          <div className="panel overflow-hidden">
            {hasPsa10 && (
              <div className="flex items-center gap-2.5 px-5 pt-4">
                <span className="text-xs font-medium text-muted-foreground">{t(lang, "condition")}</span>
                <div className="flex rounded-full border border-border bg-muted p-0.5">
                  <button
                    onClick={() => setPriceMode("raw")}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                      priceMode === "raw" ? "bg-background text-foreground shadow ring-1 ring-border" : "text-muted-foreground hover:text-foreground/80",
                    )}
                  >Raw</button>
                  <button
                    onClick={() => setPriceMode("psa10")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                      priceMode === "psa10" ? "bg-background text-foreground shadow ring-1 ring-border" : "text-muted-foreground hover:text-foreground/80",
                    )}
                  >
                    <Shield className="size-3.5 text-amber-500" />PSA 10
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 sm:gap-px">
              <div>
                <p className="text-xs text-muted-foreground">{t(lang, "marketPrice")}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  {priceMode === "raw" ? (
                    <PriceDisplay priceJpy={card.price?.priceJpy} priceThb={card.price?.priceThb ?? undefined} size="lg" showChange={false} />
                  ) : (
                    <p className="font-price text-xl font-bold tabular-nums sm:text-3xl">
                      {snkrdunkPrices?.psa10AskUsd != null ? <PriceUsd usd={snkrdunkPrices.psa10AskUsd} />
                        : snkrdunkPrices?.psa10SoldUsd != null ? <PriceUsd usd={snkrdunkPrices.psa10SoldUsd} />
                        : <span className="text-muted-foreground/40">—</span>}
                    </p>
                  )}
                  {priceMode === "raw" && (() => {
                    const map: Record<string, { label: string; value: number | null }> = {
                      "24h": { label: "24h", value: card.priceChange24h },
                      "7d": { label: "7d", value: card.priceChange7d },
                      "30d": { label: "30d", value: card.priceChange30d },
                    }
                    const item = map[chartPeriod]
                    if (!item || item.value == null) return null
                    const v = item.value
                    return (
                      <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 font-price text-xs font-medium",
                        v > 0 ? "bg-price-up/10 text-price-up" : v < 0 ? "bg-price-down/10 text-price-down" : "text-muted-foreground",
                      )}>{item.label} {v > 0 ? "+" : ""}{formatPct(v)}%</span>
                    )
                  })()}
                </div>
                <p className="mt-1 text-xs text-muted-foreground/50">{priceMode === "raw" ? "Yuyu-tei" : "SNKRDUNK"}</p>
              </div>

              <div className="border-l border-border/30 pl-5">
                <p className="text-xs text-muted-foreground">{t(lang, "lastSold")}</p>
                <p className="mt-1 font-price text-2xl font-bold tabular-nums">
                  {priceMode === "raw"
                    ? (snkrdunkPrices?.lastSoldUsd != null ? <PriceUsd usd={snkrdunkPrices.lastSoldUsd} /> : <span className="text-muted-foreground/40">—</span>)
                    : (snkrdunkPrices?.psa10SoldUsd != null ? <PriceUsd usd={snkrdunkPrices.psa10SoldUsd} /> : <span className="text-muted-foreground/40">—</span>)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/50">SNKRDUNK</p>
              </div>
            </div>

            <div className="border-t border-border/30" />

            <div className="px-5 py-4">
              {card.chartData.length > 0 ? (
                <CardDetailPriceChart cardCode={card.cardCode} data={card.chartData} availableSources={availableSources} priceMode={priceMode} onPeriodChange={setChartPeriod} maxDays={limits.priceHistoryDays} />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">{t(lang, "noPriceHistory")}</p>
              )}
            </div>

            {(() => {
              const rows = priceMode === "psa10" ? sourcePricesPsa10 : sourcePricesRaw
              if (!rows || rows.length === 0) return null
              return (
                <>
                  <div className="border-t border-border/30" />
                  <div className="px-5 py-4"><SourceMarketsTable rows={rows} /></div>
                </>
              )
            })()}
          </div>

          <CardDetailSpecs card={card} lang={lang} />
        </div>
      </div>

      {siblings.length > 0 && (
        <div className="lg:hidden">
          <p className="mb-3 text-xs text-muted-foreground">
            {t(lang, "otherVersions")} ({siblings.length})
          </p>
          <SiblingGrid siblings={siblings} lang={lang} cols={4} smCols={5} />
        </div>
      )}

      <CardDetailRelated
        relatedCards={relatedCards ?? []}
        set={set}
        lang={lang}
      />
    </div>
  )
}
