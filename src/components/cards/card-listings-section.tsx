"use client"

import Link from "next/link"
import { ArrowRight, Plus, Store } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Surface } from "@/components/ui/surface"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { formatByCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"

export type CardListing = {
  id: string | number
  priceJpy: number
  priceThb: number | null
  condition: string
  /** ISO timestamp — listing created date (UTC formatting on client). */
  listedAtIso?: string
  user: {
    displayName: string | null
    avatarUrl: string | null
    sellerRating: number | null
    sellerReviewCount: number
  } | null
}

const PREVIEW_LIMIT = 3

export function CardListingsSection({
  cardCode,
  cardName,
  listings,
}: {
  cardCode: string
  cardName: string
  listings: CardListing[]
}) {
  const lang = useUIStore((s) => s.language)
  const currency = useUIStore((s) => s.currency)

  if (!listings || listings.length === 0) {
    return (
      <Surface variant="panel" padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
            <Store className="size-4 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t(lang, "noActiveListings")}</p>
            <p className="text-meta">
              {t(lang, "noActiveListingsDesc")}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          render={
            <Link
              href={`/seller/listings/new?cardCode=${encodeURIComponent(cardCode)}`}
            />
          }
        >
          <Plus className="size-3.5" />
          {t(lang, "listThisCard")}
        </Button>
      </Surface>
    )
  }

  const preview = listings.slice(0, PREVIEW_LIMIT)
  const hasMore = listings.length > PREVIEW_LIMIT

  return (
    <Surface variant="panel" className="overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex items-center gap-2">
          <Store className="size-3.5 text-muted-foreground" />
          <h3 className="text-sm font-medium">
            {t(lang, "marketplaceListings")}
          </h3>
          <span className="font-price text-xs text-muted-foreground">
            ({listings.length})
          </span>
        </div>
        <Link
          href={`/marketplace?cardCode=${encodeURIComponent(cardCode)}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t(lang, "viewAllListings")}
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="divide-y divide-[var(--p-hair)]">
        {preview.map((l, i) => {
          const price = formatByCurrency(l.priceJpy, currency, l.priceThb).primary
          const sellerName = l.user?.displayName ?? t(lang, "anonymous")
          const isBest = i === 0
          return (
            <Link
              key={l.id}
              href={`/marketplace/${l.id}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40"
            >
              <span
                className={cn(
                  "font-price text-xs tabular-nums text-muted-foreground/60",
                )}
              >
                #{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{sellerName}</p>
                <p className="text-meta">
                  {l.condition}
                  {l.user?.sellerRating != null && l.user.sellerReviewCount > 0 && (
                    <span className="ml-1.5">★ {l.user.sellerRating.toFixed(1)}</span>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  "font-price text-sm font-semibold tabular-nums",
                  isBest ? "text-price-up" : "text-foreground",
                )}
              >
                {price}
              </span>
            </Link>
          )
        })}
      </div>

      {hasMore && (
        <div className="border-t border-[var(--p-hair)] px-4 py-2.5 text-center">
          <Link
            href={`/marketplace?cardCode=${encodeURIComponent(cardCode)}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            +{listings.length - PREVIEW_LIMIT} {t(lang, "items")} · {t(lang, "viewAllListings")}
          </Link>
        </div>
      )}

      <span className="sr-only">{cardName}</span>
    </Surface>
  )
}
