"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
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
import { buildCardsUrl } from "@/lib/api/fetch-cards"

import { MarketRow, TableRowSkeleton } from "./market-row"
import { GridCard, GridCardSkeleton } from "./grid-card"
import { MobileCardItem, MobileCardSkeleton } from "./mobile-card-item"
import { Pagination } from "./pagination"
import {
  type TabId,
  type Tab,
  type SortKey,
  type PriceMode,
  type ViewMode,
  type ChangePeriod,
  type ColumnId,
  type CardRow,
  type ApiResponse,
  COLUMN_SORTS,
  CHANGE_PERIODS,
  parseSortColumn,
  PAGE_SIZE,
} from "./market-types"

export type { CardRow }

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

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

  const [activeTab, setActiveTab] = useState<TabId>("all")
  const [sort, setSort] = useState<SortKey>("price_desc")
  const [page, setPage] = useState(1)
  const [cards, setCards] = useState<CardRow[]>(initialCards)
  const [total, setTotal] = useState(initialTotal)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch ?? "")
  const [filters, setFilters] = useState<Record<string, string[]>>({})
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sparklines, setSparklines] = useState<Record<number, number[]>>({})
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d")
  const [priceMode, setPriceMode] = useState<PriceMode>("raw")
  const [filterOpen, setFilterOpen] = useState(false)
  const isInitialMount = useRef(true)
  const fetchAbortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setSearch(initialSearch ?? "")
  }, [initialSearch])

  const fetchCardsFn = useCallback(
    (tab: TabId, sortKey: SortKey, pg: number, q: string, f: Record<string, string[]>, pMin: string, pMax: string, mode: PriceMode = "raw") => {
      const tabDef = tabs.find((t) => t.id === tab) ?? tabs[0]
      const minP = parseInt(pMin)
      const maxP = parseInt(pMax)
      const filterParams: Record<string, string> = {}
      for (const [key, values] of Object.entries(f)) {
        if (values.length > 0) filterParams[key] = values.join(",")
      }

      const url = buildCardsUrl({
        sort: sortKey,
        page: pg,
        limit: PAGE_SIZE,
        search: q.trim() || undefined,
        minPrice: minP > 0 ? minP : undefined,
        maxPrice: maxP > 0 ? maxP : undefined,
        priceMode: mode === "psa10" ? "psa10" : undefined,
        ...tabDef.extraParams,
        ...filterParams,
      })

      fetchAbortRef.current?.abort()
      const controller = new AbortController()
      fetchAbortRef.current = controller

      startTransition(async () => {
        try {
          const res = await fetch(url, { signal: controller.signal })
          if (!res.ok) return
          const data: ApiResponse = await res.json()
          setCards(
            data.cards.map((c) => ({
              ...c,
              setCode: c.set?.code ?? c.setCode ?? "",
            }))
          )
          setTotal(data.total)
          setTotalPages(data.totalPages)
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return
          /* network error — keep stale data */
        }
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [latestSetCode]
  )

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (!initialSearch && priceMode === "raw") return
    }
    fetchCardsFn(activeTab, sort, page, search, filters, minPrice, maxPrice, priceMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sort, page, search, filters, minPrice, maxPrice, priceMode, fetchCardsFn])

  useEffect(() => {
    const ids = cards.map((c) => c.id).filter((id): id is number => id != null)
    if (ids.length === 0) return
    const controller = new AbortController()
    fetch(`/api/cards/sparklines?ids=${ids.join(",")}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(`Sparklines ${r.status}`); return r.json() })
      .then((data) => { if (data.sparklines) setSparklines(data.sparklines) })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== "AbortError") console.error("Sparkline fetch failed:", err)
      })
    return () => controller.abort()
  }, [cards])

  const handleTabChange = (tab: TabId) => {
    const tabDef = tabs.find((t) => t.id === tab) ?? tabs[0]
    setActiveTab(tab)
    setSort(tabDef.defaultSort)
    setPage(1)
  }

  const handleColumnSort = (col: ColumnId) => {
    const current = parseSortColumn(sort)
    if (current.col === col) {
      setSort(COLUMN_SORTS[col][current.dir === "desc" ? "asc" : "desc"])
    } else {
      setSort(COLUMN_SORTS[col].desc)
    }
    setPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = search.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    } else {
      setPage(1)
    }
  }

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }))
    setPage(1)
  }

  const activeFilterCount =
    Object.values(filters).reduce((sum, v) => sum + v.length, 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0)

  const clearAllFilters = () => {
    setSearch("")
    setFilters({})
    setMinPrice("")
    setMaxPrice("")
    setPage(1)
  }

  const { col: sortCol, dir: sortDir } = parseSortColumn(sort)
  const showViews = activeTab === "popular"

  return (
    <div className="space-y-6">
      {/* Hero search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="text"
            placeholder={t(lang, "searchLong")}
            className="h-12 w-full rounded-xl border border-border/60 bg-card pl-12 pr-11 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20 md:h-11 md:text-sm"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (e.target.value === "") setPage(1)
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); setPage(1) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 md:h-11"
        >
          {t(lang, "searchButton")}
        </button>
      </form>

      {children}

      {/* Main table panel */}
    <div className="panel overflow-hidden">
      {/* Toolbar row 1: Tabs + filter + view */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {viewMode === "grid" && (
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1 shadow-sm">
              <TrendingUpDown className="size-3.5 text-muted-foreground" />
              {CHANGE_PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setChangePeriod(p)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums transition-all",
                    changePeriod === p
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setFilterOpen((o) => !o)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
              filterOpen || activeFilterCount > 0
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            <span className="hidden sm:inline">{t(lang, "filter")}</span>
            {activeFilterCount > 0 && (
              <span className={cn(
                "flex size-4.5 items-center justify-center rounded-full text-[10px] font-bold",
                filterOpen || activeFilterCount > 0
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary/10 text-primary"
              )}>
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Table view"
            >
              <List className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "grid"
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
            aria-pressed={priceMode === "raw"}
            onClick={() => { setPriceMode("raw"); setPage(1) }}
            className={cn(
              "rounded-md border px-3 py-1 text-xs font-semibold transition-all",
              priceMode === "raw"
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            Raw
          </button>
          <button
            aria-pressed={priceMode === "psa10"}
            onClick={() => { setPriceMode("psa10"); setPage(1) }}
            className={cn(
              "flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-semibold transition-all",
              priceMode === "psa10"
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
      {filterOpen && (
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <FilterChips
              filters={allFilterDefs}
              selected={filters}
              onChange={handleFilterChange}
            />

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{t(lang, "priceLabel")}</span>
              <input
                type="number"
                placeholder={t(lang, "min")}
                className="h-8 w-20 rounded-lg border border-border bg-card px-2 text-sm tabular-nums outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
                min={0}
              />
              <span className="text-xs text-muted-foreground">–</span>
              <input
                type="number"
                placeholder={t(lang, "max")}
                className="h-8 w-20 rounded-lg border border-border bg-card px-2 text-sm tabular-nums outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
                min={0}
              />
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
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
      {viewMode === "table" ? (
        <>
        <div className={cn("divide-y divide-border/40 sm:hidden", isPending && "opacity-50 transition-opacity")}>
          {isPending && cards.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <MobileCardSkeleton key={i} />)
            : cards.map((card, i) => (
                <MobileCardItem
                  key={card.cardCode}
                  card={card}
                  rank={(page - 1) * PAGE_SIZE + i + 1}
                  priceMode={priceMode}
                />
              ))}
          {!isPending && cards.length === 0 && (
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
                <SortableHeader label={t(lang, "price")} column="price" activeCol={sortCol} dir={sortDir} onClick={handleColumnSort} align="right" />
                <SortableHeader label="24h" column="change24h" activeCol={sortCol} dir={sortDir} onClick={handleColumnSort} align="right" />
                {showViews ? (
                  <th className="hidden py-2.5 pr-3 text-right font-medium md:table-cell">
                    {t(lang, "visits")}
                  </th>
                ) : (
                  <>
                    <SortableHeader label="7d" column="change7d" activeCol={sortCol} dir={sortDir} onClick={handleColumnSort} align="right" className="hidden md:table-cell" />
                    <SortableHeader label="30d" column="change30d" activeCol={sortCol} dir={sortDir} onClick={handleColumnSort} align="right" className="hidden lg:table-cell" />
                  </>
                )}
                <th className="hidden py-2.5 pr-4 font-medium xl:table-cell">
                  {t(lang, "sparkline7d")}
                </th>
              </tr>
            </thead>
            <tbody className={cn(isPending && "opacity-50 transition-opacity")}>
              {isPending && cards.length === 0
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <TableRowSkeleton key={i} />)
                : cards.map((card, i) => (
                    <MarketRow
                      key={card.cardCode}
                      card={card}
                      rank={(page - 1) * PAGE_SIZE + i + 1}
                      showViews={showViews}
                      sparklineData={card.id != null ? sparklines[card.id] : undefined}
                      priceMode={priceMode}
                    />
                  ))}
            </tbody>
          </table>

          {!isPending && cards.length === 0 && (
            <p className="hidden py-12 text-center text-sm text-muted-foreground sm:block">
              {t(lang, "noData")}
            </p>
          )}
        </div>
        </>
      ) : (
        <div className={cn("p-4", isPending && "opacity-50 transition-opacity")}>
          {isPending && cards.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <GridCardSkeleton key={i} />)}
            </div>
          ) : cards.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t(lang, "noData")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {cards.map((card) => (
                <GridCard key={card.cardCode} card={card} changePeriod={changePeriod} priceMode={priceMode} />
              ))}
            </div>
          )}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        isPending={isPending}
        onPageChange={setPage}
      />
    </div>
    </div>
  )
}

