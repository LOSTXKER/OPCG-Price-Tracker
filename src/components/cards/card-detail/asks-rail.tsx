"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BellPlus, ChevronRight } from "lucide-react"

import type { CardListing } from "@/components/cards/card-detail/types"
import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useHydrated } from "@/hooks/use-hydrated"
import { type Currency } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"

import {
  MARKET_TABLE_CLASS,
  MarketTableColGroup,
  marketFeedListScroll,
  marketFeedStickyHead,
  marketFeedTableScroll,
  marketPrimaryCell,
  marketTdLead,
  marketTdPrice,
  marketThLead,
  marketThPrice,
} from "./market-table-layout"
import { MarketFeedScroll } from "./market-feed-scroll"
import {
  ConditionChip,
  ConditionFilter,
  FeedPriceCell,
  SampleBadge,
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

function listingConditionFamily(condition: string): string | null {
  const m = condition.match(/^(psa|bgs|cgc|ars)\b/i)
  return m ? m[1].toLowerCase() : null
}

function listingMatchesConditionFilter(condition: string, activeGrade: string) {
  if (activeGrade === "all") return true
  if (activeGrade === "raw") return listingConditionFamily(condition) == null
  return listingConditionFamily(condition) === activeGrade
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
      <Avatar className="size-5 shrink-0 after:border-[var(--p-hair)]">
        {listing.user?.avatarUrl ? <AvatarImage src={listing.user.avatarUrl} alt="" /> : null}
        <AvatarFallback className="text-micro font-bold">{sellerInitial(name)}</AvatarFallback>
      </Avatar>
      <span className="truncate text-label font-medium text-foreground">{name}</span>
      {withArrow && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />}
    </span>
  )
}

/** Skeleton matching ~5 feed rows — keeps loading parity with the recent-sales
 *  section instead of a blank gap while the client hydrates. */
function FeedSkeleton() {
  return (
    <div className="space-y-3 py-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
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
 * "Selling on Meecard" — active asks with condition filter + table mirroring
 * RecentSales (seller · date · condition · price). Shares filter / chip / price /
 * date primitives with RecentSales via market-feed-shared.
 */
export function MeecardAsksRail({
  cardId,
  cardCode,
  cardName,
  listings,
  isSample = false,
  currentPriceJpy,
  currency,
  lang,
}: {
  cardId: number
  cardCode: string
  cardName: string
  listings: CardListing[]
  isSample?: boolean
  currentPriceJpy: number | null
  currency: Currency
  lang: Language
}) {
  const hydrated = useHydrated()
  const [alertOpen, setAlertOpen] = useState(false)
  const [activeGrade, setActiveGrade] = useState<string>("all")
  const marketHref = `/marketplace?cardCode=${encodeURIComponent(cardCode)}`

  const sorted = useMemo(
    () => [...(listings ?? [])].sort((a, b) => a.priceJpy - b.priceJpy),
    [listings],
  )

  const grades = useMemo(() => {
    const fams = Array.from(
      new Set(sorted.map((l) => listingConditionFamily(l.condition)).filter((f): f is string => f != null)),
    )
    return [...(sorted.some((l) => listingConditionFamily(l.condition) == null) ? ["raw"] : []), ...fams]
  }, [sorted])

  const shown = useMemo(
    () => sorted.filter((l) => listingMatchesConditionFilter(l.condition, activeGrade)),
    [sorted, activeGrade],
  )

  const rowClass =
    "ease-chrome flex items-center justify-between gap-3 py-3 pl-0.5 pr-2 hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"

  const hasListings = sorted.length > 0

  return (
    <div>
      <div className="mb-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-h3">{t(lang, "sellingNow")}</h2>
          {isSample && <SampleBadge lang={lang} />}
          {!isSample && hasListings && (
            <span className="inline-flex items-center gap-1" role="status">
              <span aria-hidden className="size-1.5 rounded-full" style={{ background: "var(--success)" }} />
              <span className="text-meta">{t(lang, "liveLabel")}</span>
            </span>
          )}
          {!isSample && hydrated && hasListings && (
            <span className="text-micro tnum rounded-full bg-foreground/[0.06] px-2 py-0.5 font-semibold text-muted-foreground ring-1 ring-[var(--p-hair)]">
              {sorted.length.toLocaleString()} {t(lang, "items")}
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
              className="ease-chrome inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BellPlus className="size-4" aria-hidden /> {t(lang, "notifyWhenListed")}
            </button>
          </div>
        </div>
      ) : !hydrated ? (
        /* Table + filters are client-only (interactive + currency/lang sync). */
        <FeedSkeleton />
      ) : (
        <>
          {grades.length > 1 && (
            <div className="mb-4">
              <ConditionFilter
                label={t(lang, "condition")}
                grades={grades}
                active={activeGrade}
                onSelect={setActiveGrade}
                render={(g) => (g === "all" ? t(lang, "filterAll") : gradeFilterLabel(lang, g))}
              />
            </div>
          )}

          {shown.length === 0 ? (
            <p className="text-meta py-6 text-center">{t(lang, "noMatchingFilter")}</p>
          ) : (
            <>
              <MarketFeedScroll className="hidden sm:block" scrollClassName={marketFeedTableScroll} lang={lang} label={t(lang, "sellingNow")} revalidateKey={shown.length}>
                <table className={MARKET_TABLE_CLASS}>
                  <MarketTableColGroup />
                  <thead className={marketFeedStickyHead}>
                    <tr className="text-eyebrow border-b border-[var(--p-hair)]">
                      <th scope="col" className={marketThLead}>{t(lang, "seller")}</th>
                      <th scope="col" className={marketThLead}>{t(lang, "listedDate")}</th>
                      <th scope="col" className={marketThLead}>{t(lang, "condition")}</th>
                      <th scope="col" className={marketThPrice}>{t(lang, "priceCol")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((l) => (
                      <tr
                        key={l.id}
                        className="border-b border-[var(--p-hair)] last:border-b-0"
                      >
                        <td className={marketTdLead}>
                          <Link
                            href={isSample ? marketHref : `/marketplace/${l.id}`}
                            className="ease-chrome block min-w-0 rounded hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              </MarketFeedScroll>

              <MarketFeedScroll className="sm:hidden" scrollClassName={marketFeedListScroll} lang={lang} label={t(lang, "sellingNow")} revalidateKey={shown.length}>
                {shown.map((l) => (
                  <Link
                    key={l.id}
                    href={isSample ? marketHref : `/marketplace/${l.id}`}
                    className={rowClass}
                  >
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
              </MarketFeedScroll>

              <div className="hairline-t mt-4 flex justify-end pt-3">
                <Link
                  href={marketHref}
                  className="ease-chrome text-label inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {t(lang, "viewAll")} <ChevronRight className="size-3.5" aria-hidden />
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
