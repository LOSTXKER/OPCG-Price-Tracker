"use client"

import { useMemo, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

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

import { SourceLogo, sourceLabel } from "./source-logo"
import type { MockSale } from "./mock"
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
          className="ease-chrome surface-1 hairline inline-flex h-8 min-w-[9rem] items-center gap-1.5 rounded-full px-2.5 text-label font-semibold text-foreground hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
 * Table on ≥sm, list on <sm. Shares its filter / chip / price / date primitives with
 * MeecardAsksRail via market-feed-shared so the two feeds stay one visual dialect.
 */
export function RecentSales({
  sales,
  isSample = false,
  currency,
  lang,
}: {
  sales: MockSale[]
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

  const shown = sales.filter(
    (s) =>
      (activeSource === "all" || s.source === activeSource) &&
      (activeGrade === "all" || (activeGrade === "raw" ? s.family == null : s.family === activeGrade)),
  )
  // Distinguish "no data at all" from "filters excluded everything".
  const emptyCopy = sales.length === 0 ? t(lang, "noLatestSales") : t(lang, "noMatchingFilter")

  return (
    <div>
      <div className="mb-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-h3">{t(lang, "saleHistoryTitle")}</h2>
          {isSample && <SampleBadge lang={lang} />}
        </div>
        <p className="text-meta mt-0.5">{t(lang, "saleHistoryDesc")}</p>
      </div>

      {/* filters — client-only (Radix dropdown + interactive state). SSR skips
          this block so server/client HTML always agree; same pattern as the chart. */}
      {hydrated && (grades.length > 1 || sources.length > 1) && (
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
          {/* desktop table (≥sm) — ~5 rows visible, scroll for more */}
          <MarketFeedScroll className="hidden sm:block" scrollClassName={marketFeedTableScroll} lang={lang} label={t(lang, "saleHistoryTitle")} revalidateKey={shown.length}>
            <table className={MARKET_TABLE_CLASS}>
              <MarketTableColGroup />
              <thead className={marketFeedStickyHead}>
                <tr className="text-eyebrow border-b border-[var(--p-hair)]">
                  <th scope="col" className={marketThLead}>{t(lang, "sourceCol")}</th>
                  <th scope="col" className={marketThLead}>{t(lang, "saleDate")}</th>
                  <th scope="col" className={marketThLead}>{t(lang, "condition")}</th>
                  <th scope="col" className={marketThPrice}>{t(lang, "priceCol")}</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((s, i) => (
                  <tr key={`${s.source}-${i}`} className="border-b border-[var(--p-hair)] last:border-b-0">
                    <td className={marketTdLead}>
                      <span className={marketPrimaryCell}>
                        <SourceLogo source={s.source} size={18} />
                        <span className="truncate text-label font-medium text-foreground">{sourceLabel(s.source)}</span>
                      </span>
                    </td>
                    <td className={marketTdLead}>
                      <span className="text-meta tnum">{formatFeedDate(s.soldAtIso)}</span>
                    </td>
                    <td className={marketTdLead}><ConditionChip condition={s.condition} graded={s.family != null} /></td>
                    <td className={marketTdPrice}><FeedPriceCell jpy={s.priceJpy} currency={currency} right /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </MarketFeedScroll>

          {/* mobile list (<sm) — ~5 rows visible, scroll for more */}
          <MarketFeedScroll className="sm:hidden" scrollClassName={marketFeedListScroll} lang={lang} label={t(lang, "saleHistoryTitle")} revalidateKey={shown.length}>
            {shown.map((s, i) => (
              <div key={`${s.source}-${i}`} className="flex items-center justify-between gap-3 py-3 pl-0.5 pr-2">
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <SourceLogo source={s.source} size={18} />
                    <span className="truncate text-label font-medium text-foreground">{sourceLabel(s.source)}</span>
                    <ConditionChip condition={s.condition} graded={s.family != null} />
                  </span>
                  <span className="tnum mt-1 block text-meta">{formatFeedDate(s.soldAtIso)}</span>
                </span>
                <FeedPriceCell jpy={s.priceJpy} currency={currency} right />
              </div>
            ))}
          </MarketFeedScroll>
        </>
      )}
    </div>
  )
}
