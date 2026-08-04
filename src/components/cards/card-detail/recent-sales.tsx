"use client"

import { useMemo, useState } from "react"
import { ExternalLink } from "lucide-react"

import { FilterModal } from "@/components/shared/filter-modal"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { FilterButton } from "@/components/ui/toolbar"
import { useHydrated } from "@/hooks/use-hydrated"
import { type Currency } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { FeedScrollBox } from "./feed-scroll-box"
import { SourceLogo, sourceLabel, sourceUrl } from "./source-logo"
import { RANGE_DAYS, type ChartRange } from "./card-chart"
import { PriceRangeControl } from "./price-range-control"
import type { SaleRow } from "./sold-feed"
import {
  MARKET_TABLE_CLASS,
  MarketTableColGroup,
  MARKET_FEED_REAL_PREVIEW_COUNT,
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
} from "./market-feed-shared"

/**
 * Source identity cell — logo + label, with a trailing external-link icon and an
 * outbound link to the source marketplace when a reference URL is known. Settled
 * sales have no stable deep-link, so we point at the source homepage so shoppers
 * can verify/browse comparable listings. Unmapped sources render a plain cell.
 */
function SourceRef({ source, interactive = true }: { source: string; interactive?: boolean }) {
  const href = interactive ? sourceUrl(source) : null
  const label = sourceLabel(source)
  const inner = (
    <>
      <SourceLogo source={source} size={18} />
      <span className="truncate text-label font-medium text-foreground">{label}</span>
      {href && <ExternalLink className="size-3 shrink-0 text-muted-foreground/50" aria-hidden />}
    </>
  )
  if (!href) return <span className={marketPrimaryCell}>{inner}</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        marketPrimaryCell,
        "ease-chrome inline-flex min-h-11 rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0",
      )}
    >
      {inner}
    </a>
  )
}

/** Source facet — a pill rail like the other two filters, with the market logo
 *  inside each pill (SegmentedControl takes a ReactNode label). It replaced a
 *  dropdown: one dropdown wedged between two pill rails read as a different
 *  kind of control doing a different kind of job. */
function SourceFilter({
  sources,
  active,
  onSelect,
  label,
  allLabel,
}: {
  sources: string[]
  active: string
  onSelect: (v: string) => void
  label: string
  allLabel: string
}) {
  return (
    <div className="min-w-0">
      <p className="text-eyebrow mb-1.5">{label}</p>
      <div className="no-sb max-w-full overflow-x-auto">
        <SegmentedControl
          value={active}
          onChange={onSelect}
          options={["all", ...sources].map((value) => ({
            value,
            label:
              value === "all" ? (
                allLabel
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <SourceLogo source={value} size={14} />
                  {sourceLabel(value)}
                </span>
              ),
          }))}
          size="sm"
          variant="pill"
          ariaLabel={label}
          className="shrink-0"
        />
      </div>
    </div>
  )
}

/**
 * "ประวัติการซื้อขายล่าสุด" — pooled recent sales across several markets (our edge
 * over a single-source competitor page). Each row: source · date · condition · price.
 * Table on ≥sm, list on <sm. Sample rows are a short, non-interactive preview;
 * real feeds expand in the page flow so phones never get a nested vertical scroll.
 */
export function RecentSales({
  sales,
  isSample = false,
  currency,
  lang,
  range = "1M",
  onRangeChange,
}: {
  sales: SaleRow[]
  isSample?: boolean
  currency: Currency
  lang: Language
  /** Shared page range — the same selector the chart and price history use. */
  range?: ChartRange
  onRangeChange?: (range: ChartRange) => void
}) {
  const hydrated = useHydrated()
  const sources = useMemo(() => Array.from(new Set(sales.map((s) => s.source))), [sales])
  // Condition facet lists the FULL condition of every row ("PSA 10", "BGS 9.5",
  // "Raw") rather than the grading family ("psa"), so a reader can pick the
  // exact grade they care about instead of a bucket.
  const grades = useMemo(
    () => Array.from(new Set(sales.map((s) => s.condition))).sort(),
    [sales],
  )
  const [activeSource, setActiveSource] = useState<string>("all")
  const [activeGrade, setActiveGrade] = useState<string>("all")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Measured back from the NEWEST row, not from `Date.now()`: the render must
  // stay pure (server and client agree, no clock read), and a feed whose last
  // recorded sale is weeks old would otherwise filter down to nothing on every
  // option.
  const newestMs = useMemo(
    () =>
      sales.reduce((max, s) => {
        const ms = new Date(s.soldAtIso).getTime()
        return Number.isNaN(ms) ? max : Math.max(max, ms)
      }, 0),
    [sales],
  )

  const shown = sales.filter((s) => {
    if (activeSource !== "all" && s.source !== activeSource) return false
    if (activeGrade !== "all" && s.condition !== activeGrade) return false
    const ms = new Date(s.soldAtIso).getTime()
    if (Number.isNaN(ms)) return false
    if (ms < newestMs - RANGE_DAYS[range] * 86_400_000) return false
    return true
  })
  // Counts the MODAL's facets only. The range sits outside in plain view, so
  // folding it into the badge would report a filter the reader can already see.
  const activeFilterCount =
    (activeGrade !== "all" ? 1 : 0) + (activeSource !== "all" ? 1 : 0)

  const resetFilters = () => {
    setActiveGrade("all")
    setActiveSource("all")
  }

  // Distinguish "no data at all" from "filters excluded everything".
  const emptyCopy = sales.length === 0 ? t(lang, "noLatestSales") : t(lang, "noMatchingFilter")
  const hasMore = !isSample && shown.length > MARKET_FEED_REAL_PREVIEW_COUNT
  const visibleSales =
    hasMore && !expanded ? shown.slice(0, MARKET_FEED_REAL_PREVIEW_COUNT) : shown

  const table = (
    <table className={MARKET_TABLE_CLASS}>
      <MarketTableColGroup />
      <thead className="sticky top-0 z-10 bg-background">
        <tr className="text-eyebrow border-b border-hair">
          <th scope="col" className={marketThLead}>{t(lang, "sourceCol")}</th>
          <th scope="col" className={marketThLead}>{t(lang, "saleDate")}</th>
          <th scope="col" className={marketThLead}>{t(lang, "condition")}</th>
          <th scope="col" className={marketThPrice}>{t(lang, "priceCol")}</th>
        </tr>
      </thead>
      <tbody>
        {visibleSales.map((sale, index) => (
          <tr key={`${sale.source}-${index}`} className="hover:bg-muted/40">
            <td className={marketTdLead}>
              <SourceRef source={sale.source} interactive={!isSample} />
            </td>
            <td className={marketTdLead}>
              <span className="text-meta tnum">{formatFeedDate(sale.soldAtIso)}</span>
            </td>
            <td className={marketTdLead}>
              <ConditionChip condition={sale.condition} graded={sale.family != null} />
            </td>
            <td className={marketTdPrice}>
              <FeedPriceCell jpy={sale.priceJpy} currency={currency} right />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )

  const mobileList = visibleSales.map((sale, index) => (
    <div key={`${sale.source}-${index}`} className="flex items-center justify-between gap-3 py-3 pl-0.5 pr-2">
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <SourceRef source={sale.source} interactive={!isSample} />
          <ConditionChip condition={sale.condition} graded={sale.family != null} />
        </span>
        <span className="tnum mt-1 block text-meta">{formatFeedDate(sale.soldAtIso)}</span>
      </span>
      <FeedPriceCell jpy={sale.priceJpy} currency={currency} right />
    </div>
  ))

  return (
    <div>
      <div className="mb-3 min-w-0">
        <h2 className="text-h3">
          {t(lang, isSample ? "saleHistorySampleTitle" : "saleHistoryTitle")}
        </h2>
        {/* The loud badge + boxed callout are gone at the owner's request — they
            dominated the section. One quiet line stays: these rows are invented,
            the site is public, and an unlabelled fake sale price on a price
            tracker is the one thing this page must never show. */}
        <p className="text-meta mt-0.5">
          {t(lang, isSample ? "saleHistorySampleDesc" : "saleHistoryDesc")}
        </p>
      </div>

      {/* Range stays OUTSIDE the modal and the facets go in — the project's
          own rule for this surface (AGENTS.md: prominent control outside, only
          facets inside). One row now, where three stacked rails used to run
          ~200px above a two-row table. */}
      {hydrated && !isSample && sales.length > 1 && (
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
            count={activeFilterCount}
            active={filtersOpen || activeFilterCount > 0}
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
        onReset={resetFilters}
        resetDisabled={activeFilterCount === 0}
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

        {sources.length > 0 && (
          <SourceFilter
            label={t(lang, "market")}
            sources={sources}
            active={activeSource}
            onSelect={setActiveSource}
            allLabel={t(lang, "filterAll")}
          />
        )}
      </FilterModal>

      {shown.length === 0 ? (
        <p className="text-meta py-6 text-center">{emptyCopy}</p>
      ) : (
        <>
          <FeedScrollBox className="hidden sm:block">{table}</FeedScrollBox>

          <FeedScrollBox variant="list" className="px-1 sm:hidden">{mobileList}</FeedScrollBox>

          {hasMore && (
            <div className="hairline-t mt-3 flex justify-end pt-3">
              <button
                type="button"
                className="ease-chrome min-h-11 rounded-lg px-3 text-label text-primary hover:bg-primary/5 sm:min-h-0"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
              >
                {t(lang, expanded ? "showLess" : "viewAll")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
