import Image from "next/image"
import Link from "next/link"
import { MessageCircle, Star } from "lucide-react"

import { PriceDisplay } from "@/components/shared/price-display"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CARD_BG } from "@/lib/constants/ui"
import { cn } from "@/lib/utils"
import { Price } from "@/components/shared/price-inline"

export interface ListingCardProps {
  id: number
  card: {
    cardCode: string
    baseCode?: string | null
    nameJp: string
    nameEn?: string | null
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
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3",
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
  isFeatured,
}: ListingCardProps) {
  const market = card.latestPriceJpy
  const diffPct =
    market != null && market > 0 ? ((priceJpy - market) / market) * 100 : null
  const isDeal = diffPct != null && diffPct <= -10
  const cardHref = `/cards/${encodeURIComponent(card.baseCode ?? card.cardCode)}`

  return (
    <article
      data-listing-id={id}
      className={cn(
        "panel flex flex-col overflow-hidden transition-shadow hover:shadow-md",
        isFeatured && "ring-1 ring-gold/30"
      )}
    >
      <Link
        href={cardHref}
        className={cn("relative h-44 w-full overflow-hidden", CARD_BG)}
      >
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.nameEn ?? card.nameJp}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-contain transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No image
          </span>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isDeal && (
            <Badge className="bg-price-up/90 text-white border-0 text-[10px] shadow-sm">
              Best Deal
            </Badge>
          )}
          {isFeatured && (
            <Badge className="bg-muted/90 text-black border-0 text-[10px] shadow-sm">
              Featured
            </Badge>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm",
              conditionStyles(condition)
            )}
          >
            {condition}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={cardHref} className="hover:text-primary transition-colors">
          <p className="line-clamp-1 text-sm font-medium">{card.nameEn ?? card.nameJp}</p>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] text-muted-foreground">
            {card.cardCode}
          </span>
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>

        <div className="space-y-1">
          <PriceDisplay
            priceJpy={priceJpy}
            priceThb={priceThb ?? undefined}
            showChange={false}
            size="sm"
          />
          {market != null && diffPct != null && (
            <p className="text-muted-foreground text-xs">
              vs <Price jpy={market} />{" "}
              <span
                className={cn(
                  "font-mono font-semibold tabular-nums",
                  diffPct < 0
                    ? "text-price-up"
                    : "text-price-down"
                )}
              >
                {diffPct > 0 ? "+" : ""}
                {diffPct.toFixed(0)}%
              </span>
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-white/[0.04] pt-2">
          <Avatar size="sm">
            {seller.avatarUrl ? (
              <AvatarImage src={seller.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {(seller.displayName ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">
              {seller.displayName ?? "Seller"}
            </p>
            {seller.sellerRating != null && (
              <StarRow rating={seller.sellerRating} />
            )}
          </div>
          <Link href={`/messages/${id}`}>
            <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-primary">
              <MessageCircle className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}
