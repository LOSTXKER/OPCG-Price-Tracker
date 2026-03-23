"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Package, Store } from "lucide-react"

import { PriceDisplay } from "@/components/shared/price-display"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8+M9QDwADggGAgxkG+QAAAABJRU5ErkJggg=="

export interface CardDetailProps {
  card: {
    cardCode: string
    nameJp: string
    nameEn?: string | null
    rarity: string
    cardType: string
    color: string
    colorEn?: string | null
    cost?: number | null
    power?: number | null
    counter?: number | null
    life?: number | null
    attribute?: string | null
    trait?: string | null
    effectJp?: string | null
    imageUrl?: string | null
    isParallel: boolean
    viewCount: number
    set: { code: string; name: string; nameEn?: string | null }
  }
  latestPrice?: {
    priceJpy: number
    priceThb?: number | null
    inStock: boolean
  } | null
  priceChange24h?: number | null
  priceChange7d?: number | null
  /** When provided, replaces the default price history placeholder. */
  priceHistorySlot?: React.ReactNode
  /** When provided, replaces the default marketplace placeholder. */
  marketplaceSlot?: React.ReactNode
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="font-mono text-sm font-medium">{value ?? "—"}</div>
    </div>
  )
}

export function CardDetail({
  card,
  latestPrice,
  priceChange24h,
  priceChange7d,
  priceHistorySlot,
  marketplaceSlot,
}: CardDetailProps) {
  const set = card.set
  const imgUnopt =
    !!card.imageUrl &&
    (card.imageUrl.startsWith("http://") ||
      card.imageUrl.startsWith("https://"))

  return (
    <div className="space-y-6">
      <nav
        className="text-muted-foreground hidden flex-wrap items-center gap-1 text-sm lg:flex"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden />
        <Link href="/cards" className="hover:text-foreground transition-colors">
          Cards
        </Link>
        <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden />
        <Link
          href={`/sets/${set.code}`}
          className="hover:text-foreground transition-colors"
        >
          {set.code}
        </Link>
        <ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden />
        <span className="text-foreground font-mono">{card.cardCode}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="space-y-4 lg:col-span-5">
          <div className="bg-muted/40 relative mx-auto aspect-[63/88] w-full max-w-[280px] overflow-hidden rounded-xl lg:max-w-none">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={card.nameJp}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 280px, 40vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                priority
                unoptimized={imgUnopt}
              />
            ) : (
              <Skeleton className="absolute inset-0 size-full rounded-xl" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl font-semibold leading-tight sm:text-2xl">
                {card.nameJp}
              </h1>
              {card.isParallel && (
                <Badge variant="secondary" className="shrink-0">
                  Parallel
                </Badge>
              )}
            </div>
            {card.nameEn && (
              <p className="text-muted-foreground text-sm">{card.nameEn}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-sm">
                {set.code}-{card.cardCode}
              </span>
              <RarityBadge rarity={card.rarity} size="md" />
              <Badge variant="outline">{card.cardType}</Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              <Link
                href={`/sets/${set.code}`}
                className="hover:text-foreground font-medium underline-offset-4 hover:underline"
              >
                {set.name}
              </Link>
              {set.nameEn ? (
                <span className="text-muted-foreground"> · {set.nameEn}</span>
              ) : null}
            </p>
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
              <span>
                Color:{" "}
                <span className="text-foreground">
                  {card.colorEn ?? card.color}
                </span>
              </span>
              <span>·</span>
              <span>{card.viewCount.toLocaleString()} views</span>
            </div>
          </div>

          {card.effectJp && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Effect</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                  {card.effectJp}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <PriceDisplay
                  priceJpy={latestPrice?.priceJpy}
                  priceThb={latestPrice?.priceThb ?? undefined}
                  change={priceChange24h ?? undefined}
                  size="lg"
                  showChange
                />
                <div className="flex flex-col gap-1 text-sm">
                  {latestPrice && (
                    <Badge
                      variant={latestPrice.inStock ? "secondary" : "destructive"}
                      className="w-fit"
                    >
                      {latestPrice.inStock ? "In stock" : "Out of stock"}
                    </Badge>
                  )}
                  {priceChange7d != null && (
                    <span className="text-muted-foreground">
                      7d:{" "}
                      <span
                        className={cn(
                          "font-mono font-medium",
                          priceChange7d > 0 && "text-emerald-600 dark:text-emerald-400",
                          priceChange7d < 0 && "text-red-600 dark:text-red-400"
                        )}
                      >
                        {priceChange7d > 0 ? "+" : ""}
                        {priceChange7d.toFixed(1)}%
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-sm font-medium">Stats</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Cost" value={card.cost} />
              <Stat label="Power" value={card.power} />
              <Stat label="Counter" value={card.counter} />
              <Stat label="Life" value={card.life} />
              <Stat label="Attribute" value={card.attribute} />
              <Stat label="Trait" value={card.trait} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Price history</CardTitle>
            </CardHeader>
            <CardContent>
              {priceHistorySlot !== undefined ? (
                priceHistorySlot
              ) : (
                <div className="bg-muted/40 flex min-h-[220px] items-center justify-center rounded-lg border border-dashed">
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Package className="size-4" aria-hidden />
                    Chart loads on this page via{" "}
                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                      PriceChart
                    </code>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marketplace</CardTitle>
            </CardHeader>
            <CardContent>
              {marketplaceSlot !== undefined ? (
                marketplaceSlot
              ) : (
                <div className="bg-muted/40 flex min-h-[100px] items-center justify-center rounded-lg border border-dashed">
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Store className="size-4" aria-hidden />
                    Marketplace links coming soon
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="lg:hidden" />
    </div>
  )
}
