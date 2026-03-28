"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  TrendingUpDown,
  X,
} from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { FilterChips, type FilterDefinition } from "@/components/shared/filter-chips"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { Price } from "@/components/shared/price-inline"
import { Sparkline } from "@/components/shared/sparkline"
import { Skeleton } from "@/components/ui/skeleton"
import { getCardName } from "@/lib/i18n"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabId = "all" | "popular" | "latest"

interface Tab {
  id: TabId
  label: string
  defaultSort: SortKey
  extraParams?: Record<string, string>
}

type SortKey =
  | "price_desc"
  | "price_asc"
  | "change_desc"
  | "change_asc"
  | "change_7d_desc"
  | "change_7d_asc"
  | "change_30d_desc"
  | "change_30d_asc"
  | "views_desc"
  | "newest"

interface CardRow {
  id?: number
  cardCode: string
  baseCode?: string | null
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  isParallel: boolean
  imageUrl?: string | null
  latestPriceJpy?: number | null
  priceChange24h?: number | null
  priceChange7d?: number | null
  priceChange30d?: number | null
  viewCount?: number
  setCode?: string
  set?: { code: string; name?: string; nameEn?: string | null }
}

interface ApiResponse {
  cards: CardRow[]
  total: number
  page: number
  totalPages: number
}

/* ------------------------------------------------------------------ */
/*  Column sort mapping                                                */
/* ------------------------------------------------------------------ */

type ColumnId = "price" | "change24h" | "change7d" | "change30d"

const COLUMN_SORTS: Record<ColumnId, { desc: SortKey; asc: SortKey }> = {
  price: { desc: "price_desc", asc: "price_asc" },
  change24h: { desc: "change_desc", asc: "change_asc" },
  change7d: { desc: "change_7d_desc", asc: "change_7d_asc" },
  change30d: { desc: "change_30d_desc", asc: "change_30d_asc" },
}

function parseSortColumn(sort: SortKey): { col: ColumnId | null; dir: "asc" | "desc" } {
  for (const [col, keys] of Object.entries(COLUMN_SORTS) as [ColumnId, { desc: SortKey; asc: SortKey }][]) {
    if (sort === keys.desc) return { col, dir: "desc" }
    if (sort === keys.asc) return { col, dir: "asc" }
  }
  return { col: null, dir: "desc" }
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_SIZE = 20

function buildTabs(latestSetCode?: string): Tab[] {
  const tabs: Tab[] = [
    { id: "all", label: "ทั้งหมด", defaultSort: "price_desc" },
    { id: "popular", label: "ยอดนิยม", defaultSort: "views_desc" },
  ]
  if (latestSetCode) {
    tabs.push({
      id: "latest",
      label: "ชุดล่าสุด",
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
  const tabs = buildTabs(latestSetCode)

  type ViewMode = "table" | "grid"
  type ChangePeriod = "24h" | "7d" | "30d"

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
  const [filterOpen, setFilterOpen] = useState(false)
  const isInitialMount = useRef(true)

  useEffect(() => {
    setSearch(initialSearch ?? "")
  }, [initialSearch])

  const fetchCards = useCallback(
    (tab: TabId, sortKey: SortKey, pg: number, q: string, f: Record<string, string[]>, pMin: string, pMax: string) => {
      const tabDef = tabs.find((t) => t.id === tab) ?? tabs[0]
      const params = new URLSearchParams({
        sort: sortKey,
        page: String(pg),
        limit: String(PAGE_SIZE),
        ...(tabDef.extraParams ?? {}),
      })
      if (q.trim()) params.set("search", q.trim())
      for (const [key, values] of Object.entries(f)) {
        if (values.length > 0) params.set(key, values.join(","))
      }
      const minP = parseInt(pMin)
      const maxP = parseInt(pMax)
      if (minP > 0) params.set("minPrice", String(minP))
      if (maxP > 0) params.set("maxPrice", String(maxP))

      startTransition(async () => {
        try {
          const res = await fetch(`/api/cards?${params}`)
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
        } catch {
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
      if (!initialSearch) return
    }
    fetchCards(activeTab, sort, page, search, filters, minPrice, maxPrice)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sort, page, search, filters, minPrice, maxPrice, fetchCards])

  useEffect(() => {
    const ids = cards.map((c) => c.id).filter((id): id is number => id != null)
    if (ids.length === 0) return
    const controller = new AbortController()
    fetch(`/api/cards/sparklines?ids=${ids.join(",")}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => { if (data.sparklines) setSparklines(data.sparklines) })
      .catch(() => {})
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

  const hasFilters =
    search.trim() !== "" ||
    activeFilterCount > 0

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
      {/* Hero search — top of page, prominent */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="ค้นหาการ์ด เช่น Luffy, OP13-118, SEC..."
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
          ค้นหา
        </button>
      </form>

      {/* Stats + Highlights (passed from server component) */}
      {children}

      {/* Main table panel */}
    <div className="panel overflow-hidden">
      {/* Single-row toolbar: Tabs + filter button + period toggle (grid) + view toggle */}
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
          {/* Period toggle — grid view only */}
          {viewMode === "grid" && (
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-1.5 py-1 shadow-sm">
              <TrendingUpDown className="size-3.5 text-muted-foreground" />
              {(["24h", "7d", "30d"] as ChangePeriod[]).map((p) => (
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

          {/* Advanced filter toggle */}
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
            <span className="hidden sm:inline">ตัวกรอง</span>
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

          {/* View toggle */}
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

      {/* Collapsible advanced filter panel */}
      {filterOpen && (
        <div className="border-b border-border bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <FilterChips
              filters={filterDefinitions}
              selected={filters}
              onChange={handleFilterChange}
            />

            {/* Price range inline */}
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs text-muted-foreground">ราคา</span>
              <input
                type="number"
                placeholder="ต่ำสุด"
                className="h-8 w-20 rounded-lg border border-border bg-card px-2 text-sm tabular-nums outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
                min={0}
              />
              <span className="text-xs text-muted-foreground">–</span>
              <input
                type="number"
                placeholder="สูงสุด"
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
                ล้างทั้งหมด
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content: Table or Grid */}
      {viewMode === "table" ? (
        <>
        {/* Mobile card list (< sm) */}
        <div className={cn("divide-y divide-border/40 sm:hidden", isPending && "opacity-50 transition-opacity")}>
          {isPending && cards.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <MobileCardSkeleton key={i} />)
            : cards.map((card, i) => (
                <MobileCardItem
                  key={card.cardCode}
                  card={card}
                  rank={(page - 1) * PAGE_SIZE + i + 1}
                />
              ))}
          {!isPending && cards.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>
          )}
        </div>
        {/* Desktop table (>= sm) */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                <th className="w-8 py-2.5 pl-3 pr-0 font-medium"></th>
                <th className="w-10 py-2.5 pr-1 pl-1 font-medium">#</th>
                <th className="py-2.5 pr-3 pl-2 font-medium">การ์ด</th>
                <th className="hidden py-2.5 pr-3 font-medium md:table-cell">ชุด</th>
                <th className="hidden py-2.5 pr-3 font-medium sm:table-cell">ความหายาก</th>
                <SortableHeader
                  label="ราคา"
                  column="price"
                  activeCol={sortCol}
                  dir={sortDir}
                  onClick={handleColumnSort}
                  align="right"
                />
                <SortableHeader
                  label="24 ชม."
                  column="change24h"
                  activeCol={sortCol}
                  dir={sortDir}
                  onClick={handleColumnSort}
                  align="right"
                />
                {showViews ? (
                  <th className="hidden py-2.5 pr-3 text-right font-medium md:table-cell">
                    เข้าชม
                  </th>
                ) : (
                  <>
                    <SortableHeader
                      label="7 วัน"
                      column="change7d"
                      activeCol={sortCol}
                      dir={sortDir}
                      onClick={handleColumnSort}
                      align="right"
                      className="hidden md:table-cell"
                    />
                    <SortableHeader
                      label="30 วัน"
                      column="change30d"
                      activeCol={sortCol}
                      dir={sortDir}
                      onClick={handleColumnSort}
                      align="right"
                      className="hidden lg:table-cell"
                    />
                  </>
                )}
                <th className="hidden py-2.5 pr-4 font-medium xl:table-cell">
                  กราฟ 7 วัน
                </th>
              </tr>
            </thead>
            <tbody className={cn(isPending && "opacity-50 transition-opacity")}>
              {isPending && cards.length === 0
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))
                : cards.map((card, i) => (
                    <MarketRow
                      key={card.cardCode}
                      card={card}
                      rank={(page - 1) * PAGE_SIZE + i + 1}
                      showViews={showViews}
                      sparklineData={card.id != null ? sparklines[card.id] : undefined}
                    />
                  ))}
            </tbody>
          </table>

          {!isPending && cards.length === 0 && (
            <p className="hidden py-12 text-center text-sm text-muted-foreground sm:block">
              ไม่มีข้อมูล
            </p>
          )}
        </div>
        </>
      ) : (
        <div className={cn("p-4", isPending && "opacity-50 transition-opacity")}>
          {isPending && cards.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <GridCardSkeleton key={i} />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              ไม่มีข้อมูล
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {cards.map((card) => (
                <GridCard key={card.cardCode} card={card} changePeriod={changePeriod} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            แสดง {((page - 1) * PAGE_SIZE + 1).toLocaleString()}-{Math.min(page * PAGE_SIZE, total).toLocaleString()} จาก {total.toLocaleString()} การ์ด
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isPending}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <PageNumbers
              current={page}
              total={totalPages}
              onChange={setPage}
            />
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isPending}
              className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sortable header                                                    */
/* ------------------------------------------------------------------ */

function SortableHeader({
  label,
  column,
  activeCol,
  dir,
  onClick,
  align = "left",
  className,
}: {
  label: string
  column: ColumnId
  activeCol: ColumnId | null
  dir: "asc" | "desc"
  onClick: (col: ColumnId) => void
  align?: "left" | "right"
  className?: string
}) {
  const isActive = activeCol === column
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <th
      className={cn(
        "cursor-pointer select-none py-2.5 pr-3 font-medium transition-colors hover:text-foreground",
        align === "right" && "text-right",
        className
      )}
      onClick={() => onClick(column)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "flex-row-reverse"
        )}
      >
        {label}
        <Icon
          className={cn(
            "size-3",
            isActive ? "text-foreground" : "text-muted-foreground/50"
          )}
        />
      </span>
    </th>
  )
}

/* ------------------------------------------------------------------ */
/*  Table row                                                          */
/* ------------------------------------------------------------------ */

function MarketRow({ card, rank, showViews, sparklineData }: { card: CardRow; rank: number; showViews?: boolean; sparklineData?: number[] }) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const c24 = card.priceChange24h
  const c7 = card.priceChange7d
  const c30 = card.priceChange30d
  const setCode = card.set?.code ?? card.setCode ?? ""

  return (
    <tr className="border-b border-border/40 transition-all duration-150 hover:bg-muted/50">
      <td className="py-3 pl-3 pr-0 align-middle">
        {card.id != null && <WatchlistStar cardId={card.id} size="sm" />}
      </td>
      <td className="py-3 pr-1 pl-1 align-middle">
        <span className="font-price text-xs text-muted-foreground">{rank}</span>
      </td>
      <td className="py-3 pr-3 pl-2 align-middle">
        <Link
          href={`/cards/${card.cardCode}`}
          className="flex items-center gap-3"
        >
          <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="40px"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight hover:text-primary">
              {name}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {card.baseCode ?? card.cardCode}
              {card.isParallel && (
                <span className="ml-1 text-primary">P</span>
              )}
            </p>
          </div>
        </Link>
      </td>
      <td className="hidden py-3 pr-3 align-middle font-mono text-xs text-muted-foreground md:table-cell">
        {setCode.toUpperCase()}
      </td>
      <td className="hidden py-3 pr-3 align-middle sm:table-cell">
        <RarityBadge rarity={card.rarity} size="sm" />
      </td>
      <td className="py-3 pr-3 text-right align-middle font-price text-sm font-semibold">
        {card.latestPriceJpy != null ? (
          <Price jpy={card.latestPriceJpy} />
        ) : (
          "—"
        )}
      </td>
      <td className="py-3 pr-3 text-right align-middle">
        <ChangeCell value={c24} />
      </td>
      <td className="hidden py-3 pr-3 text-right align-middle md:table-cell">
        {showViews ? (
          <span className="font-price text-xs text-muted-foreground">
            {(card.viewCount ?? 0).toLocaleString()}
          </span>
        ) : (
          <ChangeCell value={c7} />
        )}
      </td>
      {!showViews && (
        <td className="hidden py-3 pr-3 text-right align-middle lg:table-cell">
          <ChangeCell value={c30} />
        </td>
      )}
      <td className="hidden py-3 pr-4 align-middle xl:table-cell">
        {sparklineData && sparklineData.length >= 2 ? (
          <Sparkline data={sparklineData} width={80} height={28} />
        ) : (
          <span className="text-muted-foreground/30">—</span>
        )}
      </td>
    </tr>
  )
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function ChangeCell({ value }: { value?: number | null }) {
  if (value == null)
    return <span className="font-price text-xs text-muted-foreground">—</span>
  const up = value > 0
  const down = value < 0
  return (
    <span
      className={cn(
        "font-price text-xs font-medium tabular-nums",
        up
          ? "text-price-up"
          : down
            ? "text-price-down"
            : "text-muted-foreground"
      )}
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  )
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-border/40">
      <td className="py-2.5 pl-3 pr-0">
        <Skeleton className="size-3.5 rounded-full" />
      </td>
      <td className="py-2.5 pr-1 pl-1">
        <Skeleton className="h-4 w-5" />
      </td>
      <td className="py-2.5 pr-3 pl-2">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
      </td>
      <td className="hidden py-2.5 pr-3 md:table-cell">
        <Skeleton className="h-3.5 w-10" />
      </td>
      <td className="hidden py-2.5 pr-3 sm:table-cell">
        <Skeleton className="h-5 w-10" />
      </td>
      <td className="py-2.5 pr-3">
        <Skeleton className="ml-auto h-4 w-14" />
      </td>
      <td className="py-2.5 pr-3">
        <Skeleton className="ml-auto h-4 w-10" />
      </td>
      <td className="hidden py-2.5 pr-3 md:table-cell">
        <Skeleton className="ml-auto h-4 w-10" />
      </td>
      <td className="hidden py-2.5 pr-3 lg:table-cell">
        <Skeleton className="ml-auto h-4 w-10" />
      </td>
      <td className="hidden py-2.5 pr-4 xl:table-cell">
        <Skeleton className="h-7 w-20" />
      </td>
    </tr>
  )
}

function PageNumbers({
  current,
  total,
  onChange,
}: {
  current: number
  total: number
  onChange: (page: number) => void
}) {
  const pages = buildPageRange(current, total)

  return (
    <>
      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="flex size-8 items-center justify-center text-xs text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
            className={cn(
              "flex size-8 items-center justify-center rounded-md text-xs font-medium transition-colors",
              current === p
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Grid card                                                          */
/* ------------------------------------------------------------------ */

function GridCard({ card, changePeriod = "7d" }: { card: CardRow; changePeriod?: "24h" | "7d" | "30d" }) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const setCode = card.set?.code ?? card.setCode ?? ""
  const activeChange =
    changePeriod === "24h" ? card.priceChange24h :
    changePeriod === "30d" ? card.priceChange30d :
    card.priceChange7d

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="group/card block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="panel relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative aspect-[63/88] w-full bg-muted">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 18vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : (
            <div className="size-full bg-muted" />
          )}
          <div className="absolute left-1.5 top-1.5 z-10">
            {card.id != null && <WatchlistStar cardId={card.id} size="sm" />}
          </div>
          {card.isParallel && (
            <div className="absolute right-1.5 top-1.5">
              <span className="rounded-md bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                P
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <RarityBadge rarity={card.rarity} size="sm" />
            {setCode && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {setCode.toUpperCase()}
              </span>
            )}
          </div>
          <p className="truncate text-[13px] font-medium leading-snug" title={name}>
            {name}
          </p>
          <div className="mt-auto pt-1.5">
            <PriceDisplay
              priceJpy={card.latestPriceJpy}
              change={activeChange}
              size="sm"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

function GridCardSkeleton() {
  return (
    <div className="panel overflow-hidden">
      <Skeleton className="aspect-[63/88] w-full" />
      <div className="space-y-2 p-2.5">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Mobile card list item                                              */
/* ------------------------------------------------------------------ */

function MobileCardItem({ card, rank }: { card: CardRow; rank: number }) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const c24 = card.priceChange24h

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted/40"
    >
      <span className="w-5 shrink-0 text-center font-price text-xs text-muted-foreground">{rank}</span>
      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
        {card.imageUrl ? (
          <Image src={card.imageUrl} alt={name} fill className="object-contain" sizes="44px" />
        ) : (
          <div className="size-full bg-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="font-mono">{card.baseCode ?? card.cardCode}</span>
          <RarityBadge rarity={card.rarity} size="sm" />
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-price text-sm font-semibold">
          {card.latestPriceJpy != null ? <Price jpy={card.latestPriceJpy} /> : "—"}
        </p>
        {c24 != null && c24 !== 0 && (
          <p className={cn(
            "font-price text-[11px] font-medium",
            c24 > 0 ? "text-price-up" : "text-price-down"
          )}>
            {c24 > 0 ? "+" : ""}{c24.toFixed(1)}%
          </p>
        )}
      </div>
    </Link>
  )
}

function MobileCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-4 w-5" />
      <Skeleton className="size-11 rounded-lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <div className="space-y-1">
        <Skeleton className="ml-auto h-4 w-14" />
        <Skeleton className="ml-auto h-3 w-8" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page range builder                                                 */
/* ------------------------------------------------------------------ */

function buildPageRange(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | "...")[] = []

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push("...", total)
  } else if (current >= total - 3) {
    pages.push(1, "...")
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total)
  }

  return pages
}
