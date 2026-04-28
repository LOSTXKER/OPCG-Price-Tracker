"use client"

import { ListingCard } from "@/components/marketplace/listing-card"

import type { MarketplaceBrowseListing } from "./types"

export function BrowseGrid({ listings }: { listings: MarketplaceBrowseListing[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((l) => (
        <ListingCard
          key={l.id}
          id={l.id}
          card={{
            cardCode: l.card.cardCode,
            nameJp: l.card.nameJp,
            nameEn: l.card.nameEn,
            rarity: l.card.rarity,
            imageUrl: l.card.imageUrl,
            latestPriceJpy: l.card.latestPriceJpy,
          }}
          priceJpy={l.priceJpy}
          priceThb={l.priceThb}
          condition={l.condition}
          seller={{
            displayName: l.user.displayName,
            avatarUrl: l.user.avatarUrl,
            sellerRating: l.user.sellerRating,
            sellerReviewCount: l.user.sellerReviewCount,
          }}
          shipping={l.shipping}
          location={l.location}
          isFeatured={l.isFeatured}
        />
      ))}
    </div>
  )
}
