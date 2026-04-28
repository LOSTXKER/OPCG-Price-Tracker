"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { getCardName } from "@/lib/i18n"
import { formatJpy, formatThb } from "@/lib/utils/currency"
import { useUIStore } from "@/stores/ui-store"

import type { MarketplaceBrowseListing } from "./types"

function ListingRow({ listing: l }: { listing: MarketplaceBrowseListing }) {
  const lang = useUIStore((s) => s.language)
  const market = l.card.latestPriceJpy
  const diffPct =
    market != null && market > 0 ? ((l.priceJpy - market) / market) * 100 : null
  const isDeal = diffPct != null && diffPct <= -10

  return (
    <Link
      href={`/marketplace/${l.id}`}
      className="flex items-center gap-4 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
    >
      <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {l.card.imageUrl ? (
          <img
            src={l.card.imageUrl}
            alt={getCardName(lang, l.card)}
            className="size-full object-contain"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-meta">
            N/A
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{l.card.nameEn ?? l.card.nameJp}</p>
          {isDeal && (
            <Badge className="bg-price-up/90 text-white border-0 text-xs">Best Deal</Badge>
          )}
        </div>
        <p className="text-meta">
          {l.card.cardCode} · {l.card.rarity} · {l.condition}
        </p>
        <p className="text-meta">
          {l.user.displayName ?? "Seller"}
          {l.user.sellerRating != null && ` · ★${l.user.sellerRating.toFixed(1)}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold tabular-nums">{formatJpy(l.priceJpy)}</p>
        {l.priceThb != null && (
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatThb(l.priceThb)}
          </p>
        )}
      </div>
    </Link>
  )
}

export function BrowseList({ listings }: { listings: MarketplaceBrowseListing[] }) {
  return (
    <div className="space-y-2">
      {listings.map((l) => (
        <ListingRow key={l.id} listing={l} />
      ))}
    </div>
  )
}
