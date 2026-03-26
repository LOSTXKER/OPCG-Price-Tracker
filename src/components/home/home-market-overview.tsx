"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  X,
} from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { FilterChips, type FilterDefinition } from "@/components/shared/filter-chips"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { Price } from "@/components/shared/price-inline"
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

type ColumnId = "price" | "change24h" | "change7d"

const COLUMN_SORTS: Record<ColumnId, { desc: SortKey; asc: SortKey }> = {
  price: { desc: "price_desc", asc: "price_asc" },
  change24h: { desc: "change_desc", asc: "change_asc" },
  change7d: { desc: "change_7d_desc", asc: "change_7d_asc" },
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
}: {
  initialCards: CardRow[]
  initialTotal: number
  initialTotalPages: number
  latestSetCode?: string
  filterDefinitions: FilterDefinition[]
  initialSearch?: string
}) {
  const tabs = buildTabs(latestSetCode)

  type ViewMode = "table" | "grid"

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
  const isInitialMount = useRef(true)

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
    setPage(1)
  }

  const handleFilterChange = (key: string, values: string[]) => {
    setFilters((prev) => ({ ...prev, [key]: values }))
    setPage(1)
  }

  const hasFilters =
    search.trim() !== "" ||
    Object.values(filters).some((v) => v.length > 0) ||
    minPrice !== "" ||
    maxPrice !== ""

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
    <div className="panel overflow-hidden">
      {/* Tab bar + search */}
      <div className="space-y-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative ml-auto max-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="ค้นหาการ์ด..."
              className="h-8 w-full rounded-lg border-0 bg-muted/60 pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-muted focus:ring-1 focus:ring-border"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (e.target.value === "") setPage(1)
              }}
            />
          </form>
        </div>

        {/* Filter chips + price range + view toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips
            filters={filterDefinitions}
            selected={filters}
            onChange={handleFilterChange}
          />

          {/* Price range */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="¥ ต่ำสุด"
              className="h-7 w-20 rounded-md border-0 bg-muted/60 px-2 text-[13px] tabular-nums outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-muted focus:ring-1 focus:ring-border"
              value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
              min={0}
            />
            <span className="text-[11px] text-muted-foreground">–</span>
            <input
              type="number"
              placeholder="¥ สูงสุด"
              className="h-7 w-20 rounded-md border-0 bg-muted/60 px-2 text-[13px] tabular-nums outline-none transition-colors placeholder:text-muted-foreground/60 focus:bg-muted focus:ring-1 focus:ring-border"
              value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
              min={0}
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearAllFilters}
              className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3" />
              ล้าง
            </button>
          )}

          {/* View toggle */}
          <div className="ml-auto flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
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

      {/* Content: Table or Grid */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                  <th className="hidden py-2.5 pr-4 text-right font-medium md:table-cell">
                    เข้าชม
                  </th>
                ) : (
                  <SortableHeader
                    label="7 วัน"
                    column="change7d"
                    activeCol={sortCol}
                    dir={sortDir}
                    onClick={handleColumnSort}
                    align="right"
                    className="hidden md:table-cell"
                  />
                )}
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
                    />
                  ))}
            </tbody>
          </table>

          {!isPending && cards.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">
              ไม่มีข้อมูล
            </p>
          )}
        </div>
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
                <GridCard key={card.cardCode} card={card} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            {total.toLocaleString()} การ์ด
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

function MarketRow({ card, rank, showViews }: { card: CardRow; rank: number; showViews?: boolean }) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const c24 = card.priceChange24h
  const c7 = card.priceChange7d
  const setCode = card.set?.code ?? card.setCode ?? ""

  return (
    <tr className="border-b border-border/40 transition-colors hover:bg-muted/40">
      <td className="py-2.5 pl-3 pr-0 align-middle">
        {card.id != null && <WatchlistStar cardId={card.id} size="sm" />}
      </td>
      <td className="py-2.5 pr-1 pl-1 align-middle">
        <span className="font-price text-xs text-muted-foreground">{rank}</span>
      </td>
      <td className="py-2.5 pr-3 pl-2 align-middle">
        <Link
          href={`/cards/${card.cardCode}`}
          className="flex items-center gap-3"
        >
          <div className="relative size-9 shrink-0 overflow-hidden rounded bg-muted">
            {card.imageUrl ? (
              <Image
                src={card.imageUrl}
                alt={name}
                fill
                className="object-contain"
                sizes="36px"
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
      <td className="hidden py-2.5 pr-3 align-middle font-mono text-xs text-muted-foreground md:table-cell">
        {setCode.toUpperCase()}
      </td>
      <td className="hidden py-2.5 pr-3 align-middle sm:table-cell">
        <RarityBadge rarity={card.rarity} size="sm" />
      </td>
      <td className="py-2.5 pr-3 text-right align-middle font-price text-sm font-semibold">
        {card.latestPriceJpy != null ? (
          <Price jpy={card.latestPriceJpy} />
        ) : (
          "—"
        )}
      </td>
      <td className="py-2.5 pr-3 text-right align-middle">
        <ChangeCell value={c24} />
      </td>
      <td className="hidden py-2.5 pr-4 text-right align-middle md:table-cell">
        {showViews ? (
          <span className="font-price text-xs text-muted-foreground">
            {(card.viewCount ?? 0).toLocaleString()}
          </span>
        ) : (
          <ChangeCell value={c7} />
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
      <td className="hidden py-2.5 pr-4 md:table-cell">
        <Skeleton className="ml-auto h-4 w-10" />
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
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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

function GridCard({ card }: { card: CardRow }) {
  const lang = useUIStore((s) => s.language)
  const name = getCardName(lang, card)
  const setCode = card.set?.code ?? card.setCode ?? ""

  return (
    <Link
      href={`/cards/${card.cardCode}`}
      className="group/card block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/30">
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
            <span className="absolute right-1.5 top-1.5 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
              P
            </span>
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
              change={card.priceChange7d}
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
    <div className="overflow-hidden rounded-lg border border-border bg-card">
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
