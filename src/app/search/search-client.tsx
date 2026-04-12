"use client"

import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition, Suspense } from "react"
import {
  LayoutGrid,
  List,
  Search,
  TrendingUpDown,
  X,
} from "lucide-react"

import { SortableHeader } from "@/components/shared/sortable-header"
import { Skeleton } from "@/components/ui/skeleton"
import { GridCard, GridCardSkeleton } from "@/components/home/grid-card"
import { CardGrid } from "@/components/cards/card-grid"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { fetchCards } from "@/lib/api/fetch-cards"
import {
  type SortKey,
  type ColumnId,
  type ViewMode,
  type ChangePeriod,
  CHANGE_PERIODS,
  COLUMN_SORTS,
  parseSortColumn,
  PAGE_SIZE,
} from "@/components/home/market-types"
import { SearchTableRow, type CardRow } from "./search-table-row"
import { SearchPagination } from "./search-pagination"

type SetOption = { code: string; name: string }

const SORT_KEYS: { value: SortKey; key: "sortPriceDesc" | "sortPriceAsc" | "sortGain24h" | "sortLoss24h" | "sortGain7d" | "sortLoss7d" | "sortNewest" | "sortNameAz" }[] = [
  { value: "price_desc", key: "sortPriceDesc" },
  { value: "price_asc", key: "sortPriceAsc" },
  { value: "change_desc", key: "sortGain24h" },
  { value: "change_asc", key: "sortLoss24h" },
  { value: "change_7d_desc", key: "sortGain7d" },
  { value: "change_7d_asc", key: "sortLoss7d" },
  { value: "newest", key: "sortNewest" },
  { value: "name", key: "sortNameAz" },
]

function SearchContent({
  sets,
  rarities,
}: {
  sets: SetOption[]
  rarities: string[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lang = useUIStore((s) => s.language)
  const SORT_OPTIONS = SORT_KEYS.map((o) => ({ value: o.value, label: t(lang, o.key) }))

  const initialQuery = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(initialQuery)
  const [inputValue, setInputValue] = useState(initialQuery)
  const [sort, setSort] = useState<SortKey>("price_desc")
  const [page, setPage] = useState(1)
  const [cards, setCards] = useState<CardRow[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [hasSearched, setHasSearched] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d")
  const [selectedSet, setSelectedSet] = useState("")
  const [selectedRarity, setSelectedRarity] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const fetchAbortRef = useRef<AbortController | null>(null)
  const sortRef = useRef(sort)
  sortRef.current = sort
  const setRef = useRef(selectedSet)
  setRef.current = selectedSet
  const rarityRef = useRef(selectedRarity)
  rarityRef.current = selectedRarity

  const fetchResults = useCallback(
    (q: string, sortKey: SortKey, pg: number, filterSet?: string, filterRarity?: string) => {
      if (!q.trim()) {
        setCards([])
        setTotal(0)
        setTotalPages(0)
        return
      }
      fetchAbortRef.current?.abort()
      const controller = new AbortController()
      fetchAbortRef.current = controller

      startTransition(async () => {
        try {
          setFetchError(false)
          const data = await fetchCards(
            {
              search: q.trim(),
              sort: sortKey,
              page: pg,
              limit: PAGE_SIZE,
              set: filterSet || undefined,
              rarity: filterRarity || undefined,
            },
            { signal: controller.signal },
          )
          setCards(data.cards as CardRow[])
          setTotal(data.total ?? 0)
          setTotalPages(data.totalPages ?? 0)
          setHasSearched(true)
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return
          console.error("Search fetch failed:", e)
          setFetchError(true)
        }
      })
    },
    [],
  )

  useEffect(() => {
    const q = searchParams.get("q") ?? ""
    setQuery(q)
    setInputValue(q)
    setPage(1)
    if (q.trim()) fetchResults(q, sortRef.current, 1, setRef.current, rarityRef.current)
  }, [searchParams, fetchResults])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const refetch = useCallback(
    (overrides?: { sort?: SortKey; page?: number; set?: string; rarity?: string }) => {
      const s = overrides?.sort ?? sort
      const p = overrides?.page ?? 1
      const st = overrides?.set ?? selectedSet
      const r = overrides?.rarity ?? selectedRarity
      fetchResults(query, s, p, st, r)
    },
    [query, sort, selectedSet, selectedRarity, fetchResults],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSortChange = (newSort: SortKey) => {
    setSort(newSort)
    setPage(1)
    refetch({ sort: newSort, page: 1 })
  }

  const handleColumnSort = (col: ColumnId) => {
    const current = parseSortColumn(sort)
    const newSort = current.col === col
      ? COLUMN_SORTS[col][current.dir === "desc" ? "asc" : "desc"]
      : COLUMN_SORTS[col].desc
    handleSortChange(newSort)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchResults(query, sort, newPage, selectedSet, selectedRarity)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSetChange = (v: string) => {
    setSelectedSet(v)
    setPage(1)
    refetch({ set: v, page: 1 })
  }

  const handleRarityChange = (v: string) => {
    setSelectedRarity(v)
    setPage(1)
    refetch({ rarity: v, page: 1 })
  }

  const { col: sortCol, dir: sortDir } = parseSortColumn(sort)
  const activeFilterCount = (selectedSet ? 1 : 0) + (selectedRarity ? 1 : 0)

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t(lang, "searchLong")}
            className="h-12 w-full rounded-l-xl border border-r-0 border-border/60 bg-card pl-12 pr-11 text-base shadow-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => { setInputValue(""); inputRef.current?.focus() }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-r-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t(lang, "searchButton")}
        </button>
      </form>

      {/* Results summary + controls */}
      {hasSearched && query.trim() && (
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {t(lang, "resultsFor")} &ldquo;<span className="font-medium text-foreground">{query}</span>&rdquo;
              {total > 0 && <span className="ml-1.5 tabular-nums">({total.toLocaleString()} {t(lang, "items")})</span>}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { setSelectedSet(""); setSelectedRarity(""); setPage(1); refetch({ set: "", rarity: "", page: 1 }) }}
                className="text-xs text-primary hover:underline"
              >
                {t(lang, "clearAll")}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 bg-muted/20 px-4 py-2.5">
            {sets.length > 0 && (
              <select
                value={selectedSet}
                onChange={(e) => handleSetChange(e.target.value)}
                className="h-9 min-w-0 flex-1 truncate rounded-lg border border-border/50 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-border focus:border-primary/50 focus:outline-none sm:flex-none sm:min-w-[170px] sm:text-sm"
              >
                <option value="">{t(lang, "allSets")}</option>
                {sets.map((s) => (
                  <option key={s.code} value={s.code}>{s.code.toUpperCase()} · {s.name}</option>
                ))}
              </select>
            )}

            {rarities.length > 0 && (
              <select
                value={selectedRarity}
                onChange={(e) => handleRarityChange(e.target.value)}
                className="h-9 min-w-0 truncate rounded-lg border border-border/50 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-border focus:border-primary/50 focus:outline-none sm:min-w-[120px] sm:text-sm"
              >
                <option value="">{t(lang, "allRarities")}</option>
                {rarities.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            )}

            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value as SortKey)}
              className="hidden h-9 rounded-lg border border-border/50 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-border focus:border-primary/50 focus:outline-none sm:block sm:min-w-[140px] sm:text-sm"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div className="ml-auto flex items-center gap-1.5">
              {viewMode === "grid" && (
                <div className="hidden items-center gap-0.5 rounded-full border border-border/50 p-0.5 sm:flex">
                  <TrendingUpDown className="mx-1.5 size-3.5 text-muted-foreground/50" />
                  {CHANGE_PERIODS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setChangePeriod(p)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-all",
                        changePeriod === p
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-0.5 rounded-lg bg-muted/50 p-0.5">
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
        </div>
      )}

      {/* Loading */}
      {isPending && (
        viewMode === "grid" ? (
          <CardGrid>
            {Array.from({ length: 10 }).map((_, i) => (
              <GridCardSkeleton key={i} />
            ))}
          </CardGrid>
        ) : (
          <div className="panel divide-y divide-border/30">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
                <Skeleton className="hidden h-4 w-20 rounded sm:block" />
                <Skeleton className="hidden h-3.5 w-12 rounded sm:block" />
                <Skeleton className="hidden h-3.5 w-12 rounded md:block" />
              </div>
            ))}
          </div>
        )
      )}

      {/* Results — Grid view */}
      {!isPending && cards.length > 0 && viewMode === "grid" && (
        <CardGrid>
          {cards.map((card) => (
            <GridCard
              key={card.cardCode}
              card={card}
              changePeriod={changePeriod}
              priceMode="raw"
            />
          ))}
        </CardGrid>
      )}

      {/* Results — Table view */}
      {!isPending && cards.length > 0 && viewMode === "table" && (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 text-xs text-muted-foreground">
                  <th className="w-8 py-2.5 pl-3 pr-0" />
                  <th className="w-8 py-2.5 pr-1 pl-1 text-left font-medium">#</th>
                  <th className="py-2.5 pr-3 pl-2 text-left font-medium">{t(lang, "card")}</th>
                  <th className="hidden py-2.5 pr-3 text-left font-medium md:table-cell">{t(lang, "set")}</th>
                  <th className="hidden py-2.5 pr-3 text-left font-medium sm:table-cell">{t(lang, "rarity")}</th>
                  <SortableHeader label={t(lang, "price")} column="price" activeCol={sortCol} dir={sortDir} onClick={handleColumnSort} align="right" />
                  <SortableHeader label="24h" column="change24h" activeCol={sortCol} dir={sortDir} onClick={handleColumnSort} align="right" />
                  <SortableHeader label="7d" column="change7d" activeCol={sortCol} dir={sortDir} onClick={handleColumnSort} align="right" className="hidden md:table-cell" />
                  <SortableHeader label="30d" column="change30d" activeCol={sortCol} dir={sortDir} onClick={handleColumnSort} align="right" className="hidden lg:table-cell" />
                </tr>
              </thead>
              <tbody>
                {cards.map((card, i) => (
                  <SearchTableRow
                    key={card.cardCode}
                    card={card}
                    rank={(page - 1) * PAGE_SIZE + i + 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isPending && totalPages > 1 && cards.length > 0 && (
        <SearchPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {/* Fetch error */}
      {!isPending && fetchError && (
        <div className="panel px-4 py-12 text-center">
          <p className="text-sm text-destructive">{t(lang, "loadFailed")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t(lang, "retry")}
          </button>
        </div>
      )}

      {/* No results */}
      {!isPending && !fetchError && hasSearched && cards.length === 0 && query.trim() && (
        <div className="panel px-4 py-16 text-center">
          <Search className="mx-auto size-10 text-muted-foreground/20" />
          <p className="mt-4 text-lg font-medium">{t(lang, "noResults")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(lang, "tryOtherSearch")}
          </p>
        </div>
      )}

      {/* Initial state — no query */}
      {!hasSearched && !query.trim() && (
        <div className="panel px-4 py-20 text-center">
          <Search className="mx-auto size-12 text-muted-foreground/20" />
          <p className="mt-4 text-base font-medium text-muted-foreground">
            {t(lang, "typeToSearch")}
          </p>
        </div>
      )}
    </div>
  )
}

export default function SearchClient({
  sets,
  rarities,
}: {
  sets: SetOption[]
  rarities: string[]
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <SearchContent sets={sets} rarities={rarities} />
    </Suspense>
  )
}
