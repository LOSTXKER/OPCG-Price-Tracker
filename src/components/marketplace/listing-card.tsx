import { memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import { RatingStars } from "@/components/ui/rating-stars"

import { ConditionBadge } from "@/components/shared/condition-badge"
import { PriceTag } from "@/components/ui/price-tag"
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
        "panel ease-chrome flex flex-col overflow-hidden transition-colors hover:bg-muted/70",
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

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <RarityBadge rarity={card.rarity} size="sm" />
          <span className="font-mono text-xs text-muted-foreground">
            {card.cardCode}
          </span>
          <ConditionBadge condition={condition} />
        </div>
        <Link href={listingHref} className="ease-chrome transition-colors hover:text-primary">
          <p className="line-clamp-1 text-h5">
            {card.nameEn ?? card.nameJp}
          </p>
        </Link>

        <div className="space-y-0.5 pt-0.5">
          <PriceTag
            jpy={priceJpy}
            thb={priceThb ?? undefined}
            showChange={false}
            size="card"
          />
          {market != null && diffPct != null && (
            <p className="text-meta text-muted-foreground">
              vs <Price jpy={market} />{" "}
              <PriceTag
                change={diffPct}
                changeOnly
                changeStyle="plain"
                decimals={0}
                showArrow={false}
                invert
                size="sm"
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
              <RatingStars value={seller.sellerRating} size="sm" />
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
