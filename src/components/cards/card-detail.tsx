"use client"

import Image from "next/image"
import Link from "next/link"

import { Breadcrumb } from "@/components/shared/breadcrumb"
import { PriceDisplay } from "@/components/shared/price-display"
import { Price } from "@/components/shared/price-inline"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { CardAddToPortfolio } from "@/components/cards/card-add-to-portfolio"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { t, getCardName, getCardEffect, getSetName } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"

import { CardDetailPriceChart } from "./card-detail-price-chart"

export interface SiblingCard {
  id: number
  cardCode: string
  nameJp: string
  nameEn: string | null
  rarity: string
  isParallel: boolean
  imageUrl: string | null
  latestPriceJpy: number | null
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
    set: { code: string; name: string; nameEn?: string | null; nameTh?: string | null }
    price: { priceJpy: number; priceThb: number | null; inStock: boolean } | null
    chartData: { scrapedAt: string; priceJpy: number | null; priceThb: number | null; source?: string }[]
  }
  siblings: SiblingCard[]
  communityPrice?: { avgThb: number | null; reportCount: number } | null
}

export function CardDetail({ card, siblings, communityPrice }: CardDetailProps) {
  const lang = useUIStore((s) => s.language)
  const set = card.set
  const displayName = getCardName(lang, card)
  const setName = getSetName(lang, set)
  const effectText = getCardEffect(lang, card)

  return (
    <div className="space-y-6">
      <Breadcrumb
        className="hidden lg:flex"
        items={[
          { label: t(lang, "market"), href: "/" },
          { label: t(lang, "cards"), href: "/cards" },
          { label: set.code.toUpperCase(), href: `/sets/${set.code}` },
          { label: card.baseCode ?? card.cardCode },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Image column */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="relative mx-auto aspect-[63/88] w-full max-w-[340px] overflow-hidden rounded bg-card border border-border lg:max-w-none">
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.nameEn ?? card.nameJp}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 340px, 40vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  priority
                />
              ) : (
                <Skeleton className="absolute inset-0 size-full" />
              )}
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              {card.viewCount.toLocaleString()} {t(lang, "views")}
            </p>
          </div>

          {/* Other versions — below main image */}
          {siblings.length > 0 && (
            <div>
              <p className="mb-3 text-xs text-muted-foreground">
                {t(lang, "otherVersions")} ({siblings.length})
              </p>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4">
                {siblings.map((s) => (
                  <Link
                    key={s.id}
                    href={`/cards/${s.cardCode}`}
                    className="group flex flex-col gap-1.5 text-center"
                  >
                    <div className="relative aspect-[63/88] w-full overflow-hidden rounded border border-border bg-muted transition-colors group-hover:border-primary/30">
                      {s.imageUrl ? (
                        <Image src={s.imageUrl} alt={getCardName(lang, s)} fill className="object-contain" sizes="100px" />
                      ) : (
                        <Skeleton className="absolute inset-0 size-full" />
                      )}
                    </div>
                    <div>
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

          {/* Market Price */}
          <div className="panel p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t(lang, "marketPrice")}
                </p>
                <div className="mt-1">
                  <PriceDisplay
                    priceJpy={card.price?.priceJpy}
                    priceThb={card.price?.priceThb ?? undefined}
                    change={card.priceChange24h ?? undefined}
                    size="lg"
                    showChange
                  />
                </div>
              </div>
              {card.priceChange7d != null && (
                <p className="text-xs text-muted-foreground">
                  7d:{" "}
                  <span className={`font-price font-medium ${card.priceChange7d > 0 ? "text-price-up" : card.priceChange7d < 0 ? "text-price-down" : ""}`}>
                    {card.priceChange7d > 0 ? "+" : ""}{card.priceChange7d.toFixed(1)}%
                  </span>
                </p>
              )}
            </div>

            {communityPrice && communityPrice.avgThb != null && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground">
                  ราคาตลาดไทย
                </p>
                <p className="mt-0.5 font-price text-lg font-bold">
                  {communityPrice.avgThb} ฿
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({communityPrice.reportCount} รายงาน)
                  </span>
                </p>
              </div>
            )}

          </div>

          {/* Price Chart */}
          <div className="panel p-5">
            <p className="mb-3 text-xs text-muted-foreground">
              {t(lang, "priceHistory")}
            </p>
            {card.chartData.length > 0 ? (
              <CardDetailPriceChart data={card.chartData} />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">{t(lang, "noPriceHistory")}</p>
            )}
          </div>

          {/* Card Specs */}
          <div className="panel p-5">
            <p className="mb-3 text-xs text-muted-foreground">
              {t(lang, "details")}
            </p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3 sm:grid-cols-6">
              {[
                { label: t(lang, "type"), value: card.cardType },
                { label: t(lang, "color"), value: card.colorEn ?? card.color },
                { label: t(lang, "cost"), value: card.cost },
                { label: t(lang, "power"), value: card.power },
                { label: t(lang, "counter"), value: card.counter },
                { label: t(lang, "life"), value: card.life },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 font-price text-sm font-semibold">{s.value ?? "—"}</p>
                </div>
              ))}
            </div>
            {(card.attribute || card.trait) && (
              <div className="mt-3 grid grid-cols-2 gap-4 border-t border-border pt-3">
                {card.attribute && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t(lang, "attribute")}</p>
                    <p className="mt-0.5 text-sm">{card.attribute}</p>
                  </div>
                )}
                {card.trait && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t(lang, "trait")}</p>
                    <p className="mt-0.5 text-sm">{card.trait}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Effect */}
          {effectText && (
            <details open className="panel overflow-hidden">
              <summary className="cursor-pointer px-5 py-3 text-xs text-muted-foreground hover:text-foreground">
                {t(lang, "effect")}
              </summary>
              <div className="border-t border-border px-5 py-4">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {effectText}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>

    </div>
  )
}
