import Image from "next/image"
import Link from "next/link"
import { MessageCircle, Star, Store } from "lucide-react"

import { PriceDisplay } from "@/components/shared/price-display"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatJpy } from "@/lib/utils/currency"

export interface ListingCardProps {
  id: number
  card: {
    cardCode: string
    nameJp: string
    rarity: string
    imageUrl?: string | null
    latestPriceJpy?: number | null
  }
  priceJpy: number
  priceThb?: number | null
  condition: string
  seller: {
    displayName?: string | null
    avatarUrl?: string | null
    sellerRating?: number | null
    sellerReviewCount: number
  }
  shipping: string[]
  location?: string | null
  isFeatured: boolean
}

function conditionStyles(condition: string) {
  const c = condition.toUpperCase()
  if (c === "NM")
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (c === "LP")
    return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
  if (c === "MP")
    return "border-orange-500/40 bg-orange-500/10 text-orange-800 dark:text-orange-200"
  if (c === "HP")
    return "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200"
  if (c === "DMG")
    return "border-muted-foreground/40 bg-muted text-muted-foreground"
  return "border-border bg-muted/60 text-foreground"
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < full ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  )
}

export function ListingCard({
  id,
  card,
  priceJpy,
  priceThb,
  condition,
  seller,
  shipping,
  location,
  isFeatured,
}: ListingCardProps) {
  const market = card.latestPriceJpy
  const diffPct =
    market != null && market > 0 ? ((priceJpy - market) / market) * 100 : null
  const isDeal = diffPct != null && diffPct <= -5
  const cardHref = `/cards/${encodeURIComponent(card.cardCode)}`

  return (
    <article
      data-listing-id={id}
      className={cn(
        "bg-card flex gap-3 rounded-xl border p-3 shadow-sm ring-1 ring-foreground/10 transition-shadow",
        isFeatured && "ring-2 ring-amber-400/50 shadow-amber-500/10"
      )}
    >
      <Link
        href={cardHref}
        className="bg-muted relative h-28 w-20 shrink-0 overflow-hidden rounded-lg"
        aria-label={`View ${card.nameJp}`}
      >
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.nameJp}
            fill
            sizes="80px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="text-muted-foreground flex size-full items-center justify-center text-xs">
            No image
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <Link
              href={cardHref}
              className="hover:text-primary line-clamp-2 font-medium leading-snug underline-offset-4 hover:underline"
            >
              {card.nameJp}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs">{card.cardCode}</span>
              <RarityBadge rarity={card.rarity} />
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  conditionStyles(condition)
                )}
              >
                {condition}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {isDeal ? (
              <Badge className="bg-amber-500/15 text-amber-800 border-amber-500/40 dark:text-amber-200">
                BEST DEAL
              </Badge>
            ) : null}
            {isFeatured ? (
              <Badge variant="outline" className="border-amber-400/60 text-amber-700 dark:text-amber-300">
                Featured
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <PriceDisplay
            priceJpy={priceJpy}
            priceThb={priceThb ?? undefined}
            showChange={false}
            size="md"
          />
          {market != null && diffPct != null ? (
            <p className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
              <span>vs {formatJpy(market)}</span>
              <span aria-hidden>🏷️</span>
              <span
                className={cn(
                  "font-mono font-medium",
                  diffPct < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {diffPct > 0 ? "+" : ""}
                {diffPct.toFixed(0)}%
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {seller.avatarUrl ? (
                <AvatarImage src={seller.avatarUrl} alt="" />
              ) : null}
              <AvatarFallback>
                {(seller.displayName ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium">{seller.displayName ?? "Seller"}</p>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                {seller.sellerRating != null ? (
                  <StarRow rating={seller.sellerRating} />
                ) : null}
                <span>({seller.sellerReviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-muted-foreground space-y-1 text-xs">
          {location ? <p>Location: {location}</p> : null}
          {shipping.length > 0 ? (
            <p>Shipping: {shipping.join(" · ")}</p>
          ) : (
            <p>Shipping: contact seller</p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <MessageCircle className="size-4" />
            Chat
          </Button>
          <Link
            href="/marketplace"
            className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "inline-flex gap-1.5")}
          >
            <Store className="size-4" />
            View Shop
          </Link>
        </div>
      </div>
    </article>
  )
}
