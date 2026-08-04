"use client"

import { useMemo, useState } from "react"
import { Check, ChevronDown, ExternalLink } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useHydrated } from "@/hooks/use-hydrated"
import { type Currency } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

import { SourceLogo, sourceLabel, sourceUrl } from "./source-logo"
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
  gradeFilterLabel,
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

/** Source facet — compact dropdown (logos in menu; trigger shows current pick). */
function SourceDropdown({
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
  const picked = active === "all" ? allLabel : sourceLabel(active)

  return (
    <div className="shrink-0">
      <p className="text-eyebrow mb-1.5">{label}</p>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={label}
          className="ease-chrome surface-1 hairline inline-flex h-11 min-w-[9rem] items-center gap-1.5 rounded-full px-2.5 text-label font-semibold text-foreground hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-8"
        >
          {active !== "all" && <SourceLogo source={active} size={16} />}
          <span className="truncate">{picked}</span>
          <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[11rem]">
          <DropdownMenuItem
            onClick={() => onSelect("all")}
            className={cn("flex items-center gap-2", active === "all" && "bg-foreground/5")}
          >
            <span className="flex-1 font-medium">{allLabel}</span>
            {active === "all" && <Check className="size-3.5 shrink-0 text-foreground" aria-hidden />}
          </DropdownMenuItem>
          {sources.map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => onSelect(s)}
              className={cn("flex items-center gap-2", active === s && "bg-foreground/5")}
            >
              <SourceLogo source={s} size={16} />
              <span className="flex-1 font-medium">{sourceLabel(s)}</span>
              {active === s && <Check className="size-3.5 shrink-0 text-foreground" aria-hidden />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
}: {
  sales: SaleRow[]
  isSample?: boolean
  currency: Currency
  lang: Language
}) {
  const hydrated = useHydrated()
  const sources = useMemo(() => Array.from(new Set(sales.map((s) => s.source))), [sales])
  // Condition facet: "raw" (ungraded) + each grading family present in the feed.
  const grades = useMemo(() => {
    const fams = Array.from(new Set(sales.filter((s) => s.family).map((s) => s.family as string)))
    return [...(sales.some((s) => s.family == null) ? ["raw"] : []), ...fams]
  }, [sales])
  const [activeSource, setActiveSource] = useState<string>("all")
  const [activeGrade, setActiveGrade] = useState<string>("all")
  const [expanded, setExpanded] = useState(false)

  const shown = sales.filter(
    (s) =>
      (activeSource === "all" || s.source === activeSource) &&
      (activeGrade === "all" || (activeGrade === "raw" ? s.family == null : s.family === activeGrade)),
  )
  // Distinguish "no data at all" from "filters excluded everything".
  const emptyCopy = sales.length === 0 ? t(lang, "noLatestSales") : t(lang, "noMatchingFilter")
  const hasMore = !isSample && shown.length > MARKET_FEED_REAL_PREVIEW_COUNT
  const visibleSales =
    hasMore && !expanded ? shown.slice(0, MARKET_FEED_REAL_PREVIEW_COUNT) : shown

  const table = (
    <table className={MARKET_TABLE_CLASS}>
      <MarketTableColGroup />
      <thead className="bg-background">
        <tr className="text-eyebrow border-b border-hair">
          <th scope="col" className={marketThLead}>{t(lang, "sourceCol")}</th>
          <th scope="col" className={marketThLead}>{t(lang, "saleDate")}</th>
          <th scope="col" className={marketThLead}>{t(lang, "condition")}</th>
          <th scope="col" className={marketThPrice}>{t(lang, "priceCol")}</th>
        </tr>
      </thead>
      <tbody>
        {visibleSales.map((sale, index) => (
          <tr key={`${sale.source}-${index}`} className="border-b border-hair last:border-b-0">
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

      {/* filters — client-only (Radix dropdown + interactive state). SSR skips
          this block so server/client HTML always agree; same pattern as the chart. */}
      {hydrated && !isSample && (grades.length > 1 || sources.length > 1) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          {grades.length > 1 && (
            <div className="min-w-0 flex-1">
              <ConditionFilter
                label={t(lang, "condition")}
                grades={grades}
                active={activeGrade}
                onSelect={setActiveGrade}
                render={(g) => (g === "all" ? t(lang, "filterAll") : gradeFilterLabel(lang, g))}
              />
            </div>
          )}
          {sources.length > 1 && (
            <SourceDropdown
              label={t(lang, "market")}
              sources={sources}
              active={activeSource}
              onSelect={setActiveSource}
              allLabel={t(lang, "filterAll")}
            />
          )}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-meta py-6 text-center">{emptyCopy}</p>
      ) : (
        <>
          <div className="hidden sm:block">{table}</div>

          <div className="divide-y divide-hair px-1 sm:hidden">{mobileList}</div>

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
