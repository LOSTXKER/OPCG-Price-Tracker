"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BellPlus, ChevronRight } from "lucide-react"

import type { CardListing } from "@/components/cards/card-detail/types"
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"

import { FilterModal } from "@/components/shared/filter-modal"
import { FilterButton } from "@/components/ui/toolbar"

import { RANGE_DAYS, type ChartRange } from "./card-chart"
import { FeedScrollBox } from "./feed-scroll-box"
import { PriceRangeControl } from "./price-range-control"
import { type Currency } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"

import {
  MARKET_TABLE_CLASS,
  MarketTableColGroup,
  getMarketFeedPreview,
  marketPrimaryCell,
  marketTdLead,
  marketTdPrice,
  marketThLead,
  marketThPrice,
} from "./market-table-layout"
import {
  ConditionChip,
  ConditionFilter,
  FeedPriceCell,
  formatFeedDate,
  gradeFilterLabel,
} from "./market-feed-shared"

function compactGradeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/** Used by card-detail's buy box to filter listings by the page-selected grade. */
export function listingMatchesGrade(condition: string | null | undefined, gradeLabel: string | null | undefined) {
  if (!gradeLabel) return true
  const conditionKey = compactGradeText(condition ?? "")
  const gradeKey = compactGradeText(gradeLabel)
  if (gradeKey.startsWith("raw")) return !/(psa|bgs|cgc|ars)/.test(conditionKey)
  return conditionKey.includes(gradeKey)
}

function isGradedCondition(condition: string) {
  return /^(psa|bgs|cgc|ars)\s/i.test(condition)
}

function sellerName(listing: CardListing, lang: Language) {
  return listing.user?.displayName ?? t(lang, "anonymous")
}

function sellerInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?"
}

function UserCell({ listing, lang, withArrow = false }: { listing: CardListing; lang: Language; withArrow?: boolean }) {
  const name = sellerName(listing, lang)
  return (
    <span className={marketPrimaryCell}>
      <Avatar className="size-5 shrink-0 after:border-hair">
        {listing.user?.avatarUrl ? <AvatarImage src={listing.user.avatarUrl} alt="" /> : null}
        <AvatarFallback className="text-micro font-bold">{sellerInitial(name)}</AvatarFallback>
      </Avatar>
      <span className="truncate text-label font-medium text-foreground">{name}</span>
      {withArrow && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />}
    </span>
  )
}

/** Skeleton matches the capped preview length to avoid a hydration layout jump. */
function FeedSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-3 py-1" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <Skeleton className="h-3.5 w-16" />
        </div>
      ))}
    </div>
  )
}

/**
 * "Selling on Meecard" — a capped, card-scoped preview of REAL active listings.
 * Filtering happens over the complete row set before the cap; the Marketplace
 * owns the full list. The old fabricated "sample listings" mode was removed:
 * mock rows must never reach indexable HTML, and with the marketplace flag off
 * this simply renders the honest "no listings yet" state.
 */
export function MeecardAsksRail({
  cardId,
  cardCode,
  cardName,
  listings,
  currentPriceJpy,
  currency,
  lang,
  range = "1M",
  onRangeChange,
}: {
  cardId: number
  cardCode: string
  cardName: string
  listings: CardListing[]
  currentPriceJpy: number | null
  currency: Currency
  lang: Language
  /** Shared page range — same selector as the chart and the price history. */
  range?: ChartRange
  onRangeChange?: (range: ChartRange) => void
}) {
  const hydrated = useHydrated()
  const [alertOpen, setAlertOpen] = useState(false)
  const [activeGrade, setActiveGrade] = useState<string>("all")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const marketHref = `/marketplace?cardCode=${encodeURIComponent(cardCode)}`

  const sorted = useMemo(
    () => [...(listings ?? [])].sort((a, b) => a.priceJpy - b.priceJpy),
    [listings],
  )

  // Full condition of each listing ("PSA 10", "NM"…), not the grading family.
  const grades = useMemo(
    () => Array.from(new Set(sorted.map((l) => l.condition))).sort(),
    [sorted],
  )

  // "Listed within N days", measured from the NEWEST listing rather than the
  // clock: the render stays pure (server and client agree) and a demo dataset
  // whose newest listing is weeks old still exercises the control.
  const newestListedMs = useMemo(
    () =>
      sorted.reduce((max, l) => {
        const ms = l.listedAtIso ? new Date(l.listedAtIso).getTime() : NaN
        return Number.isNaN(ms) ? max : Math.max(max, ms)
      }, 0),
    [sorted],
  )

  const shown = useMemo(
    () =>
      sorted.filter((l) => {
        if (activeGrade !== "all" && l.condition !== activeGrade) return false
        const ms = l.listedAtIso ? new Date(l.listedAtIso).getTime() : NaN
        if (Number.isNaN(ms)) return false
        return ms >= newestListedMs - RANGE_DAYS[range] * 86_400_000
      }),
    [sorted, activeGrade, range, newestListedMs],
  )
  const preview = getMarketFeedPreview(shown, false)

  const rowClass = "flex items-center justify-between gap-3 py-3 pl-0.5 pr-2"
  const linkedRowClass =
    `ease-chrome ${rowClass} hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`

  const hasListings = sorted.length > 0

  return (
    <div>
      <div className="mb-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-h3">{t(lang, "sellingNow")}</h2>
          {hasListings && (
            <span className="inline-flex items-center gap-1" role="status">
              <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--success)" }} />
              <span className="text-meta">{t(lang, "liveLabel")}</span>
            </span>
          )}
        </div>
        <p className="text-meta mt-0.5">{t(lang, "sellingNowDesc")}</p>
      </div>

      {!hasListings ? (
        <div className="py-4 text-center">
          <p className="text-h5 text-foreground">{t(lang, "noActiveListings")}</p>
          <p className="text-meta mt-0.5">{t(lang, "noActiveListingsDesc")}</p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setAlertOpen(true)}
              className="ease-chrome inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-10"
            >
              <BellPlus className="size-4" aria-hidden /> {t(lang, "notifyWhenListed")}
            </button>
          </div>
        </div>
      ) : !hydrated ? (
        /* Table + filters are client-only (interactive + currency/lang sync). */
        <FeedSkeleton count={preview.length} />
      ) : (
        <>
          {/* Same shape as the sales feed: the page range stays visible outside,
              the facets live behind one "ตัวกรอง" button (AGENTS.md canon). */}
          {sorted.length > 1 && (
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {onRangeChange && (
                <div className="no-sb min-w-0 max-w-full overflow-x-auto pb-0.5">
                  <PriceRangeControl
                    lang={lang}
                    range={range}
                    onRangeChange={onRangeChange}
                    className="shrink-0"
                  />
                </div>
              )}
              <FilterButton
                count={activeGrade === "all" ? 0 : 1}
                active={filtersOpen || activeGrade !== "all"}
                appearance="outline"
                onClick={() => setFiltersOpen(true)}
                aria-label={t(lang, "filter")}
                aria-haspopup="dialog"
                aria-expanded={filtersOpen}
                className="shrink-0"
              >
                {t(lang, "filter")}
              </FilterButton>
            </div>
          )}

          <FilterModal
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            onReset={() => setActiveGrade("all")}
            resetDisabled={activeGrade === "all"}
          >
            {grades.length > 0 && (
              <ConditionFilter
                label={t(lang, "condition")}
                grades={grades}
                active={activeGrade}
                onSelect={setActiveGrade}
                render={(g) => (g === "all" ? t(lang, "filterAll") : g)}
              />
            )}
          </FilterModal>

          {shown.length === 0 ? (
            <p className="text-meta py-6 text-center">{t(lang, "noMatchingFilter")}</p>
          ) : (
            <>
              <FeedScrollBox className="hidden sm:block">
                <table className={MARKET_TABLE_CLASS}>
                  <MarketTableColGroup />
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr className="text-eyebrow border-b border-hair">
                      <th scope="col" className={marketThLead}>{t(lang, "seller")}</th>
                      <th scope="col" className={marketThLead}>{t(lang, "listedDate")}</th>
                      <th scope="col" className={marketThLead}>{t(lang, "condition")}</th>
                      <th scope="col" className={marketThPrice}>{t(lang, "priceCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((l) => (
                      <tr key={l.id} className="hover:bg-muted/40">
                        <td className={marketTdLead}>
                          <Link
                            href={`/marketplace/${l.id}`}
                            className="ease-chrome block min-w-0 rounded-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <UserCell listing={l} lang={lang} withArrow />
                          </Link>
                        </td>
                        <td className={marketTdLead}>
                          <span className="text-meta tnum">{formatFeedDate(l.listedAtIso)}</span>
                        </td>
                        <td className={marketTdLead}>
                          <ConditionChip condition={l.condition} graded={isGradedCondition(l.condition)} />
                        </td>
                        <td className={marketTdPrice}>
                          <FeedPriceCell jpy={l.priceJpy} currency={currency} right />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </FeedScrollBox>

              <FeedScrollBox variant="list" className="px-1 sm:hidden">
                {preview.map((l) => (
                  <Link key={l.id} href={`/marketplace/${l.id}`} className={linkedRowClass}>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <UserCell listing={l} lang={lang} withArrow />
                        <ConditionChip condition={l.condition} graded={isGradedCondition(l.condition)} />
                      </span>
                      <span className="tnum mt-1 block text-meta">{formatFeedDate(l.listedAtIso)}</span>
                    </span>
                    <FeedPriceCell jpy={l.priceJpy} currency={currency} right />
                  </Link>
                ))}
              </FeedScrollBox>

              <div className="hairline-t mt-4 flex justify-end pt-3">
                <Link
                  href={marketHref}
                  className="ease-chrome text-label inline-flex min-h-11 items-center gap-1 text-muted-foreground hover:text-foreground sm:min-h-0"
                >
                  {t(lang, "viewAllListings")}
                  <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </>
          )}
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
