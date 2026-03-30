"use client"

import { useRouter } from "next/navigation"
import {
  LayoutGrid,
  List,
  Search,
  Shield,
  SlidersHorizontal,
  TrendingUpDown,
  X,
} from "lucide-react"

import { FilterChips, type FilterDefinition } from "@/components/shared/filter-chips"
import { SortableHeader } from "@/components/shared/sortable-header"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { getColorOptions } from "@/lib/constants/card-config"
import { useMarketCards } from "@/hooks/use-market-cards"

import { MarketRow, TableRowSkeleton } from "./market-row"
import { GridCard, GridCardSkeleton } from "./grid-card"
import { MobileCardItem, MobileCardSkeleton } from "./mobile-card-item"
import { Pagination } from "./pagination"
import {
  type Tab,
  type CardRow,
  CHANGE_PERIODS,
  PAGE_SIZE,
} from "./market-types"

export type { CardRow }

function buildTabs(latestSetCode: string | undefined, labels: { all: string; popular: string; latest: string }): Tab[] {
  const tabs: Tab[] = [
    { id: "all", label: labels.all, defaultSort: "price_desc" },
    { id: "popular", label: labels.popular, defaultSort: "views_desc" },
  ]
  if (latestSetCode) {
    tabs.push({
      id: "latest",
      label: labels.latest,
      defaultSort: "price_desc",
      extraParams: { set: latestSetCode },
    })
  }
  return tabs
}

export function HomeMarketOverview({
  initialCards,
  initialTotal,
  initialTotalPages,
  latestSetCode,
  filterDefinitions,
  initialSearch,
  children,
}: {
  initialCards: CardRow[]
  initialTotal: number
  initialTotalPages: number
  latestSetCode?: string
  filterDefinitions: FilterDefinition[]
  initialSearch?: string
  children?: React.ReactNode
}) {
  const router = useRouter()
  const lang = useUIStore((s) => s.language)

  const allFilterDefs: FilterDefinition[] = [
    ...filterDefinitions.map((f) => ({
      ...f,
      label: f.key === "set" ? t(lang, "setFilter")
        : f.key === "rarity" ? t(lang, "rarity")
        : f.key === "type" ? t(lang, "type")
        : f.label,
    })),
    {
      key: "color",
      label: t(lang, "color"),
      options: getColorOptions(lang),
    },
    {
      key: "variant",
      label: t(lang, "variant"),
      options: [
        { value: "regular", label: t(lang, "regular") },
        { value: "parallel", label: t(lang, "parallel") },
      ],
    },
  ]

  const tabs = buildTabs(latestSetCode, {
    all: t(lang, "allTab"),
    popular: t(lang, "popular"),
    latest: t(lang, "latestSet"),
  })

  const m = useMarketCards({
    initialCards,
    initialTotal,
    initialTotalPages,
    tabs,
    initialSearch,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = m.search.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    } else {
      m.setPage(1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero search */}
      <form onSubmit={handleSearch} className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            placeholder={t(lang, "searchLong")}
            className="h-11 w-full rounded-l-xl border border-r-0 border-border/60 bg-card pl-12 pr-11 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            value={m.search}
            onChange={(e) => {
              m.setSearch(e.target.value)
              if (e.target.value === "") m.setPage(1)
            }}
          />
          {m.search && (
            <button
              type="button"
              onClick={() => { m.setSearch(""); m.setPage(1) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-11 shrink-0 rounded-r-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t(lang, "searchButton")}
        </button>
      </form>

      {children}

      {/* Main table panel */}
    <div className="panel overflow-hidden">
      {/* Toolbar: Tabs + filter + view */}
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
        <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => m.handleTabChange(tab.id)}
              className={cn(
                "relative shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-all",
                m.activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {m.viewMode === "grid" && (
            <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
              <TrendingUpDown className="mx-1 size-3 text-muted-foreground/60" />
              {CHANGE_PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => m.setChangePeriod(p)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums transition-all",
                    m.changePeriod === p
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => m.setFilterOpen((o) => !o)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              m.filterOpen || m.activeFilterCount > 0
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">{t(lang, "filter")}</span>
            {m.activeFilterCount > 0 && (
              <span className={cn(
                "flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold",
                m.filterOpen || m.activeFilterCount > 0
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary/10 text-primary"
              )}>
                {m.activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
            <button
              onClick={() => m.setViewMode("table")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                m.viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Table view"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => m.setViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                m.viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar row 2: Raw / PSA 10 price mode */}
      <div className="flex items-center gap-3 border-b border-border/50 bg-muted/20 px-4 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t(lang, "price")}
        </span>
        <div className="flex items-center gap-1">
          <button
            aria-pressed={m.priceMode === "raw"}
            onClick={() => { m.setPriceMode("raw"); m.setPage(1) }}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-semibold transition-all",
              m.priceMode === "raw"
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            Raw
          </button>
          <button
            aria-pressed={m.priceMode === "psa10"}
            onClick={() => { m.setPriceMode("psa10"); m.setPage(1) }}
            className={cn(
              "flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-semibold transition-all",
              m.priceMode === "psa10"
                ? "border-amber-600 bg-amber-500/15 text-amber-700 dark:text-amber-400 shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Shield className="size-3 text-amber-500" />
            PSA 10
          </button>
        </div>
      </div>

      {/* Collapsible advanced filter panel */}
      {m.filterOpen && (
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <FilterChips
              filters={allFilterDefs}
              selected={m.filters}
              onChange={m.handleFilterChange}
            />

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{t(lang, "priceLabel")}</span>
              <input
                type="number"
                placeholder={t(lang, "min")}
                className="h-8 w-20 rounded-lg border border-border bg-card px-2 text-sm tabular-nums outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                value={m.minPrice}
                onChange={(e) => { m.setMinPrice(e.target.value); m.setPage(1) }}
                min={0}
              />
              <span className="text-xs text-muted-foreground">–</span>
              <input
                type="number"
                placeholder={t(lang, "max")}
                className="h-8 w-20 rounded-lg border border-border bg-card px-2 text-sm tabular-nums outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                value={m.maxPrice}
                onChange={(e) => { m.setMaxPrice(e.target.value); m.setPage(1) }}
                min={0}
              />
            </div>

            {m.activeFilterCount > 0 && (
              <button
                onClick={m.clearAllFilters}
                className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
                {t(lang, "clearAll")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content: Table or Grid */}
      {m.viewMode === "table" ? (
        <>
        <div className={cn("divide-y divide-border/40 sm:hidden", m.isPending && "opacity-50 transition-opacity")}>
          {m.isPending && m.cards.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <MobileCardSkeleton key={i} />)
            : m.cards.map((card, i) => (
                <MobileCardItem
                  key={card.cardCode}
                  card={card}
                  rank={(m.page - 1) * PAGE_SIZE + i + 1}
                  priceMode={m.priceMode}
                />
              ))}
          {!m.isPending && m.cards.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">{t(lang, "noData")}</p>
          )}
        </div>
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                <th className="w-8 py-2.5 pl-3 pr-0 font-medium"></th>
                <th className="w-10 py-2.5 pr-1 pl-1 font-medium">#</th>
                <th className="py-2.5 pr-3 pl-2 font-medium">{t(lang, "card")}</th>
                <th className="hidden py-2.5 pr-3 font-medium md:table-cell">{t(lang, "set")}</th>
                <th className="hidden py-2.5 pr-3 font-medium sm:table-cell">{t(lang, "rarity")}</th>
                <SortableHeader label={t(lang, "price")} column="price" activeCol={m.sortCol} dir={m.sortDir} onClick={m.handleColumnSort} align="right" />
                <SortableHeader label="24h" column="change24h" activeCol={m.sortCol} dir={m.sortDir} onClick={m.handleColumnSort} align="right" />
                {m.showViews ? (
                  <th className="hidden py-2.5 pr-3 text-right font-medium md:table-cell">
                    {t(lang, "visits")}
                  </th>
                ) : (
                  <>
                    <SortableHeader label="7d" column="change7d" activeCol={m.sortCol} dir={m.sortDir} onClick={m.handleColumnSort} align="right" className="hidden md:table-cell" />
                    <SortableHeader label="30d" column="change30d" activeCol={m.sortCol} dir={m.sortDir} onClick={m.handleColumnSort} align="right" className="hidden lg:table-cell" />
                  </>
                )}
                <th className="hidden py-2.5 pr-4 font-medium xl:table-cell">
                  {t(lang, "sparkline7d")}
                </th>
              </tr>
            </thead>
            <tbody className={cn(m.isPending && "opacity-50 transition-opacity")}>
              {m.isPending && m.cards.length === 0
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <TableRowSkeleton key={i} />)
                : m.cards.map((card, i) => (
                    <MarketRow
                      key={card.cardCode}
                      card={card}
                      rank={(m.page - 1) * PAGE_SIZE + i + 1}
                      showViews={m.showViews}
                      sparklineData={card.id != null ? m.sparklines[card.id] : undefined}
                      priceMode={m.priceMode}
                    />
                  ))}
            </tbody>
          </table>

          {!m.isPending && m.cards.length === 0 && (
            <p className="hidden py-12 text-center text-sm text-muted-foreground sm:block">
              {t(lang, "noData")}
            </p>
          )}
        </div>
        </>
      ) : (
        <div className={cn("p-4", m.isPending && "opacity-50 transition-opacity")}>
          {m.isPending && m.cards.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <GridCardSkeleton key={i} />)}
            </div>
          ) : m.cards.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t(lang, "noData")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {m.cards.map((card) => (
                <GridCard key={card.cardCode} card={card} changePeriod={m.changePeriod} priceMode={m.priceMode} />
              ))}
            </div>
          )}
        </div>
      )}

      <Pagination
        page={m.page}
        totalPages={m.totalPages}
        total={m.total}
        pageSize={PAGE_SIZE}
        isPending={m.isPending}
        onPageChange={m.setPage}
      />
    </div>
    </div>
  )
}
