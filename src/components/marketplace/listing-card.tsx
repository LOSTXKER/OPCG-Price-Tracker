import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageCircle, Star } from "lucide-react"

import { ConditionBadge } from "@/components/shared/condition-badge"
import { DeltaText } from "@/components/shared/delta-text"
import { PriceDisplay } from "@/components/shared/price-display"
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

function StarRow({ rating }: { rating: number }) {
  const full = Math.round(rating)
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3",
            i < full ? "fill-foreground/80 text-foreground/80" : "text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  )
}

function ListingCardBase({
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
  const listingHref = `/marketplace/${id}`

  return (
    <article
      data-listing-id={id}
      className={cn(
        "panel flex flex-col overflow-hidden transition-colors hover:bg-muted/20",
        isFeatured && "border border-primary/30"
      )}
    >
      <Link
        href={listingHref}
        className={cn("relative h-44 w-full overflow-hidden", CARD_BG)}
      >
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.nameEn ?? card.nameJp}
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-contain"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-meta">
            No image
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={listingHref} className="hover:text-primary transition-colors">
          <p className="line-clamp-1 text-sm font-medium">{card.nameEn ?? card.nameJp}</p>
        </Link>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs text-muted-foreground">
            {card.cardCode}
          </span>
          <RarityBadge rarity={card.rarity} size="sm" />
          <ConditionBadge condition={condition} />
        </div>

        <div className="space-y-1">
          <PriceDisplay
            priceJpy={priceJpy}
            priceThb={priceThb ?? undefined}
            showChange={false}
            size="sm"
          />
          {market != null && diffPct != null && (
            <p className="text-meta text-muted-foreground">
              vs <Price jpy={market} />{" "}
              <DeltaText
                value={diffPct}
                decimals={0}
                showArrow={false}
                size="sm"
                invert
                className="ml-0.5"
              />
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-white/[0.04] pt-2">
          <Avatar size="sm">
            {seller.avatarUrl ? (
              <AvatarImage src={seller.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="text-xs">
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
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Send message"
              className="size-8 text-muted-foreground hover:text-primary"
            >
              <MessageCircle className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    </article>
  )
}

export const ListingCard = memo(ListingCardBase)
