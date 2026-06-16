"use client"

import { useState } from "react"
import Link from "next/link"
import { BellPlus, ChevronRight, Store } from "lucide-react"

import type { CardListing } from "@/components/cards/card-listings-section"
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"
import { formatByCurrency, jpyToDisplayValue, type Currency } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

function compactGradeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

export function listingMatchesGrade(condition: string | null | undefined, gradeLabel: string | null | undefined) {
  if (!gradeLabel) return true
  const conditionKey = compactGradeText(condition ?? "")
  const gradeKey = compactGradeText(gradeLabel)
  if (gradeKey.startsWith("raw")) return !/(psa|bgs|cgc)/.test(conditionKey)
  return conditionKey.includes(gradeKey)
}

/**
 * "Selling on Meecard" — active asks for THIS card from our marketplace, the
 * present-tense complement to the center "recent sales" tab (settled past sales).
 * Fed by the real CardListing[] the page already loads. The marketplace is
 * flag-gated, so the EMPTY STATE is the common default — it's a real notify /
 * list-this-card surface, not a dead box. Neutral/outline only (no second gold).
 */
export function MeecardAsksRail({
  cardId,
  cardCode,
  cardName,
  listings,
  currentPriceJpy,
  currency,
  selectedGradeLabel,
  rangeHigh,
  embedded = false,
  lang,
}: {
  cardId: number
  cardCode: string
  cardName: string
  listings: CardListing[]
  currentPriceJpy: number | null
  currency: Currency
  selectedGradeLabel?: string
  rangeHigh?: number | null
  embedded?: boolean
  lang: Language
}) {
  const [alertOpen, setAlertOpen] = useState(false)
  const marketHref = `/marketplace?cardCode=${encodeURIComponent(cardCode)}`
  const sellHref = `/seller/listings/new?cardCode=${encodeURIComponent(cardCode)}`

  const sorted = [...(listings ?? [])]
    .filter((listing) => listingMatchesGrade(listing.condition, selectedGradeLabel))
    .sort((a, b) => a.priceJpy - b.priceJpy)
  const best = sorted[0]
  const rows = sorted.slice(0, 3)
  const extra = sorted.length - rows.length
  const bestAboveMarket =
    best != null && rangeHigh != null && jpyToDisplayValue(best.priceJpy, currency) > rangeHigh

  return (
    <div className={cn("overflow-hidden", embedded ? "" : "surface-1 hairline rounded-2xl")}>
      {sorted.length === 0 ? (
        <>
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <p className="text-eyebrow">
              {t(lang, "sellingNow")}
              {selectedGradeLabel && <span className="text-meta normal-case"> · {selectedGradeLabel}</span>}
            </p>
            <span className="surface-2 rounded-full px-2 py-1 text-micro font-semibold text-muted-foreground">
              {t(lang, "firstListingBadge")}
            </span>
          </div>
          <div className="px-4 py-4">
            <div className="surface-2 rounded-xl p-3 ring-1 ring-[var(--p-hair)]">
              <div className="flex gap-3 text-left">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background/55 text-muted-foreground">
                  <Store className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t(lang, "noActiveListings")}</p>
                  <p className="text-meta mt-0.5">{t(lang, "noActiveListingsDesc")}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => setAlertOpen(true)}
                  className="ease-chrome inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-background/40 px-3 text-sm font-semibold text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <BellPlus className="size-4" aria-hidden /> {t(lang, "notifyWhenListed")}
                </button>
                <Link
                  href={sellHref}
                  className="ease-chrome inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                >
                  {t(lang, "listThisCard")}
                </Link>
              </div>
            </div>
          </div>
          {/*
            Keep the empty-state actionable but quieter than the price story:
            one message, two obvious recovery paths, no large dead vertical space.
          */}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 pt-4">
            <p className="text-eyebrow">
              {t(lang, "sellingNow")}
              {selectedGradeLabel && <span className="text-meta normal-case"> · {selectedGradeLabel}</span>}
              <span className="text-meta tnum"> ({sorted.length})</span>
            </p>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--success)" }} />
              <span className="text-micro text-muted-foreground">{t(lang, "liveLabel")}</span>
            </span>
          </div>

          {/* Lowest-ask summary only earns its place when 2+ listings exist —
              with a single listing it just restates that one row verbatim. */}
          {sorted.length > 1 && (
            <div className="hairline-t mt-3 flex items-center justify-between gap-2 px-4 py-3">
              <span className="text-eyebrow">{t(lang, "lowestAsk")}</span>
              <span className="flex min-w-0 flex-col items-end gap-1 text-right">
                <span className="flex items-center gap-2">
                  <span className="surface-2 rounded px-1.5 py-0.5 text-overlay text-muted-foreground">{best.condition}</span>
                  <span className="text-h4 tnum text-foreground">
                    {formatByCurrency(best.priceJpy, currency, best.priceThb).primary}
                  </span>
                </span>
                {bestAboveMarket && (
                  <span className="text-overlay text-muted-foreground">{t(lang, "askAboveMarketSingleSeller")}</span>
                )}
              </span>
            </div>
          )}

          {rows.map((l, i) => {
            const seller = l.user?.displayName ?? t(lang, "anonymous")
            const showRating = l.user?.sellerRating != null && l.user.sellerReviewCount > 0
            return (
              <Link
                key={l.id}
                href={`/marketplace/${l.id}`}
                className={cn(
                  "hairline-t ease-chrome flex items-center gap-3 px-4 py-3 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  // no summary row above when there's a single listing — give the
                  // first (only) row the gap the summary would have provided.
                  i === 0 && sorted.length <= 1 && "mt-3",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{seller}</span>
                  <span className="text-meta inline-flex items-center gap-1">
                    {l.condition}
                    {showRating && <span>· ★ {l.user!.sellerRating!.toFixed(1)}</span>}
                  </span>
                </span>
                <span className="tnum ml-auto shrink-0 text-right text-sm font-semibold text-foreground">
                  {formatByCurrency(l.priceJpy, currency, l.priceThb).primary}
                </span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
              </Link>
            )
          })}

          <Link
            href={marketHref}
            className="hairline-t ease-chrome flex items-center justify-center gap-1 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {extra > 0 ? `+${extra} · ` : ""}
            {t(lang, "viewAllListings")} <ChevronRight className="size-3" aria-hidden />
          </Link>
        </>
      )}

      <CardSetAlertDialog
        cardId={cardId}
        cardName={cardName}
        currentPriceJpy={currentPriceJpy}
        open={alertOpen}
        onOpenChange={setAlertOpen}
      />
    </div>
  )
}
