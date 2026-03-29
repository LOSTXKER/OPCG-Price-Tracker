"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  Swords,
  Palette,
  Coins,
  Zap,
  Shield,
  Heart,
  Crosshair,
  Fingerprint,
  Layers,
  ArrowRight,
  Expand,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PriceDisplay } from "@/components/shared/price-display"
import { Price } from "@/components/shared/price-inline"
import { PriceUsd } from "@/components/shared/price-usd"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t, getCardName, getCardEffect, getSetName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { formatPct } from "@/lib/utils/currency"

import { CardDetailPriceChart } from "./card-detail-price-chart"
import { SourceMarketsTable } from "./source-markets-table"

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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [chartPeriod, setChartPeriod] = useState("30d")
  const [priceMode, setPriceMode] = useState<"raw" | "psa10">("raw")
  const hasPsa10 = !!(snkrdunkPrices?.psa10SoldUsd != null || snkrdunkPrices?.psa10AskUsd != null)
  const set = card.set
  const displayName = getCardName(lang, card)
  const setName = getSetName(lang, set)
  const effectText = getCardEffect(lang, card)

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

          {/* Image lightbox */}
          {lightboxOpen && card.imageUrl && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              onClick={() => setLightboxOpen(false)}
            >
              <button
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="size-6" />
              </button>
              <div
                className="relative max-h-[90vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={card.imageUrl}
                  alt={card.nameEn ?? card.nameJp}
                  width={800}
                  height={1120}
                  className="max-h-[90vh] w-auto rounded-lg object-contain"
                  priority
                />
              </div>
            </div>
          )}

          {/* Other versions — desktop only (mobile version rendered below the grid) */}
          {siblings.length > 0 && (
            <div className="hidden lg:block">
              <p className="mb-3 text-xs text-muted-foreground">
                {t(lang, "otherVersions")} ({siblings.length})
              </p>
              <div className="grid grid-cols-4 gap-2">
                {siblings.map((s) => (
                  <Link
                    key={s.id}
                    href={`/cards/${s.cardCode}`}
                    className="group flex flex-col gap-1.5 text-center transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="panel relative aspect-[63/88] w-full overflow-hidden">
                      {s.imageUrl ? (
                        <Image src={s.imageUrl} alt={getCardName(lang, s)} fill className="object-contain" sizes="100px" />
                      ) : (
                        <Skeleton className="absolute inset-0 size-full" />
                      )}
                    </div>
                    <div>
                      <span className="inline-block rounded bg-muted px-1 py-px font-price text-[10px] uppercase text-muted-foreground">
                        {s.set.code}
                      </span>
                      <RarityBadge rarity={s.rarity} size="sm" />
                      {s.latestPriceJpy != null && (
                        <p className="mt-0.5 font-price text-xs font-semibold">
                          <Price jpy={s.latestPriceJpy} />
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {displayName}
              </h1>
              <WatchlistStar cardId={card.id} size="md" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              <Link href={`/sets/${set.code}`} className="hover:text-foreground hover:underline underline-offset-4">
                {set.code.toUpperCase()} &middot; {setName}
              </Link>
            </p>
            <div className="mt-3">
              <CardAddToPortfolio cardId={card.id} cardName={displayName} />
            </div>
          </div>

          {/* Unified price + chart panel */}
          <div className="panel overflow-hidden">
            {/* Mode toggle */}
            {hasPsa10 && (
              <div className="flex gap-1 px-5 pt-4">
                <button
                  onClick={() => setPriceMode("raw")}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                    priceMode === "raw"
                      ? "bg-foreground/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground/80",
                  )}
                >
                  Raw
                </button>
                <button
                  onClick={() => setPriceMode("psa10")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                    priceMode === "psa10"
                      ? "bg-foreground/10 text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground/80",
                  )}
                >
                  <Shield className="size-3 text-amber-500" />
                  PSA 10
                </button>
              </div>
            )}

            {/* Price row: ราคาตลาด + ขายล่าสุด */}
            <div className="grid grid-cols-2 gap-px px-5 py-4">
              {/* ราคาตลาด */}
              <div>
                <p className="text-[11px] text-muted-foreground">{t(lang, "marketPrice")}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  {priceMode === "raw" ? (
                    <PriceDisplay
                      priceJpy={card.price?.priceJpy}
                      priceThb={card.price?.priceThb ?? undefined}
                      size="lg"
                      showChange={false}
                    />
                  ) : (
                    <p className="font-price text-3xl font-bold tabular-nums">
                      {snkrdunkPrices?.psa10AskUsd != null
                        ? <PriceUsd usd={snkrdunkPrices.psa10AskUsd} />
                        : snkrdunkPrices?.psa10SoldUsd != null
                          ? <PriceUsd usd={snkrdunkPrices.psa10SoldUsd} />
                          : <span className="text-muted-foreground/40">—</span>
                      }
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
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md px-1.5 py-0.5 font-price text-[11px] font-medium",
                          v > 0 ? "bg-price-up/10 text-price-up" : v < 0 ? "bg-price-down/10 text-price-down" : "text-muted-foreground",
                        )}
                      >
                        {item.label} {v > 0 ? "+" : ""}{formatPct(v)}%
                      </span>
                    )
                  })()}
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground/50">
                  {priceMode === "raw" ? "Yuyu-tei" : "SNKRDUNK"}
                </p>
              </div>

              {/* ขายล่าสุด */}
              <div className="border-l border-border/30 pl-5">
                <p className="text-[11px] text-muted-foreground">{t(lang, "lastSold")}</p>
                <p className="mt-1 font-price text-2xl font-bold tabular-nums">
                  {priceMode === "raw"
                    ? (snkrdunkPrices?.lastSoldUsd != null
                        ? <PriceUsd usd={snkrdunkPrices.lastSoldUsd} />
                        : <span className="text-muted-foreground/40">—</span>)
                    : (snkrdunkPrices?.psa10SoldUsd != null
                        ? <PriceUsd usd={snkrdunkPrices.psa10SoldUsd} />
                        : <span className="text-muted-foreground/40">—</span>)
                  }
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/50">SNKRDUNK</p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/30" />

            {/* Chart */}
            <div className="px-5 py-4">
              {card.chartData.length > 0 ? (
                <CardDetailPriceChart cardCode={card.cardCode} data={card.chartData} availableSources={availableSources} priceMode={priceMode} onPeriodChange={setChartPeriod} />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">{t(lang, "noPriceHistory")}</p>
              )}
            </div>

            {/* Markets reference table */}
            {(() => {
              const rows = priceMode === "psa10" ? sourcePricesPsa10 : sourcePricesRaw
              if (!rows || rows.length === 0) return null
              return (
                <>
                  <div className="border-t border-border/30" />
                  <div className="px-5 py-4">
                    <SourceMarketsTable rows={rows} />
                  </div>
                </>
              )
            })()}
          </div>

          {/* Card Specs */}
          <div className="panel p-5">
            <p className="mb-3 text-xs text-muted-foreground">
              {t(lang, "details")}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {[
                { label: t(lang, "type"), value: card.cardType, icon: Swords },
                { label: t(lang, "color"), value: card.colorEn ?? card.color, icon: Palette },
                { label: t(lang, "cost"), value: card.cost, icon: Coins },
                { label: t(lang, "power"), value: card.power, icon: Zap },
                { label: t(lang, "counter"), value: card.counter, icon: Shield },
                { label: t(lang, "life"), value: card.life, icon: Heart },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/30 px-3 py-2.5">
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <s.icon className="size-3" />
                    {s.label}
                  </p>
                  <p className="mt-0.5 font-price text-sm font-semibold">{s.value ?? "—"}</p>
                </div>
              ))}
            </div>
            {(card.attribute || card.trait) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {card.attribute && (
                  <div className="rounded-lg bg-muted/30 px-3 py-2.5">
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Crosshair className="size-3" />
                      {t(lang, "attribute")}
                    </p>
                    <p className="mt-0.5 text-sm">{card.attribute}</p>
                  </div>
                )}
                {card.trait && (
                  <div className="rounded-lg bg-muted/30 px-3 py-2.5">
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Fingerprint className="size-3" />
                      {t(lang, "trait")}
                    </p>
                    <p className="mt-0.5 text-sm">{card.trait}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Effect */}
          {effectText && (
            <div className="panel p-5">
              <p className="mb-2 text-xs text-muted-foreground">
                {t(lang, "effect")}
              </p>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {effectText}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other versions — mobile only (desktop version is in the image column) */}
      {siblings.length > 0 && (
        <div className="lg:hidden">
          <p className="mb-3 text-xs text-muted-foreground">
            {t(lang, "otherVersions")} ({siblings.length})
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/cards/${s.cardCode}`}
                className="group flex flex-col gap-1.5 text-center transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="panel relative aspect-[63/88] w-full overflow-hidden">
                  {s.imageUrl ? (
                    <Image src={s.imageUrl} alt={getCardName(lang, s)} fill className="object-contain" sizes="100px" />
                  ) : (
                    <Skeleton className="absolute inset-0 size-full" />
                  )}
                </div>
                <div>
                  <span className="inline-block rounded bg-muted px-1 py-px font-price text-[10px] uppercase text-muted-foreground">
                    {s.set.code}
                  </span>
                  <RarityBadge rarity={s.rarity} size="sm" />
                  {s.latestPriceJpy != null && (
                    <p className="mt-0.5 font-price text-xs font-semibold">
                      <Price jpy={s.latestPriceJpy} />
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* From the same set */}
      <div className="mt-6 border-t border-border/40 pt-8">
        {relatedCards && relatedCards.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold">{t(lang, "otherCardsFrom")} {getSetName(lang, set)}</h2>
              <Link
                href={`/sets/${set.code}`}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t(lang, "viewAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {relatedCards.map((rc) => {
                const rcName = getCardName(lang, rc)
                return (
                  <Link
                    key={rc.id}
                    href={`/cards/${rc.cardCode}`}
                    className="group flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="panel relative aspect-[63/88] w-full overflow-hidden">
                      {rc.imageUrl ? (
                        <Image
                          src={rc.imageUrl}
                          alt={rcName}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 30vw, (max-width: 768px) 22vw, (max-width: 1024px) 18vw, 14vw"
                        />
                      ) : (
                        <div className="size-full bg-muted" />
                      )}
                    </div>
                    <div className="mt-1.5">
                      <p className="truncate text-xs font-medium leading-tight">{rcName}</p>
                      <div className="mt-0.5 flex items-center gap-1">
                        <RarityBadge rarity={rc.rarity} size="sm" />
                      </div>
                      {rc.latestPriceJpy != null && (
                        <p className="mt-0.5 font-price text-xs font-semibold">
                          <Price jpy={rc.latestPriceJpy} />
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {/* CTA to browse full set */}
        <Link
          href={`/sets/${set.code}`}
          className={`panel flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-all hover:bg-muted/50 hover:shadow-md active:scale-[0.99] ${relatedCards && relatedCards.length > 0 ? "mt-6" : ""}`}
        >
          <Layers className="size-4 text-primary" />
          {t(lang, "viewAllCardsIn")} {set.code.toUpperCase()}
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

    </div>
  )
}
