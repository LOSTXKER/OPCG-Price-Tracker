"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState, useTransition, Suspense } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react"

import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { WatchlistStar } from "@/components/shared/watchlist-star"
import { SortableHeader } from "@/components/shared/sortable-header"
import { Skeleton } from "@/components/ui/skeleton"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { changeToneClass, formatSignedPct } from "@/lib/utils/currency"
import { fetchCards } from "@/lib/api/fetch-cards"
import {
  type SortKey,
  type ColumnId,
  type CardRow as BaseCardRow,
  COLUMN_SORTS,
  parseSortColumn,
  PAGE_SIZE,
} from "@/components/home/market-types"

interface CardRow extends BaseCardRow {
  id: number
  latestPriceThb?: number | null
}

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

function SearchSortHeader({
  label,
  column,
  currentSort,
  onSort,
  className,
}: {
  label: string
  column: ColumnId
  currentSort: SortKey
  onSort: (s: SortKey) => void
  className?: string
}) {
  const { col, dir } = parseSortColumn(currentSort)
  const handleClick = (c: ColumnId) => {
    const sorts = COLUMN_SORTS[c]
    if (col !== c) onSort(sorts.desc)
    else onSort(dir === "desc" ? sorts.asc : sorts.desc)
  }

  return (
    <SortableHeader
      label={label}
      column={column}
      activeCol={col}
      dir={dir}
      onClick={handleClick}
      as="button"
      className={className}
    />
  )
}

function SearchContent() {
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
  const inputRef = useRef<HTMLInputElement>(null)
  const fetchAbortRef = useRef<AbortController | null>(null)
  const sortRef = useRef(sort)
  sortRef.current = sort

  const fetchResults = useCallback(
    (q: string, sortKey: SortKey, pg: number) => {
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
            { search: q.trim(), sort: sortKey, page: pg, limit: PAGE_SIZE },
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
    if (q.trim()) fetchResults(q, sortRef.current, 1)
  }, [searchParams, fetchResults])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const handleSortChange = (newSort: SortKey) => {
    setSort(newSort)
    setPage(1)
    fetchResults(query, newSort, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchResults(query, sort, newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const changeClass = changeToneClass
  const formatChange = formatSignedPct

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="panel flex items-center gap-3 px-4 py-3">
        <Search className="size-5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t(lang, "searchLong")}
          className="h-8 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/50"
        />
        {inputValue && (
          <button
            type="button"
            onClick={() => { setInputValue(""); inputRef.current?.focus() }}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {t(lang, "searchButton")}
        </button>
      </form>

      {/* Results header */}
      {hasSearched && query.trim() && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {t(lang, "resultsFor")} &ldquo;<span className="font-medium text-foreground">{query}</span>&rdquo;
            {total > 0 && <span className="ml-1.5">({total.toLocaleString()} {t(lang, "items")})</span>}
          </p>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value as SortKey)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div className="panel divide-y divide-border/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="size-14 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      {!isPending && cards.length > 0 && (
        <div className="panel overflow-hidden">
          {/* Table header */}
          <div className="hidden items-center gap-4 border-b border-border/40 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:flex">
            <div className="w-14 shrink-0" />
            <div className="min-w-0 flex-1">{t(lang, "card")}</div>
            <div className="w-20 shrink-0 text-right">
              <SearchSortHeader label={t(lang, "price")} column="price" currentSort={sort} onSort={handleSortChange} className="justify-end" />
            </div>
            <div className="w-16 shrink-0 text-right">
              <SearchSortHeader label="24h" column="change24h" currentSort={sort} onSort={handleSortChange} className="justify-end" />
            </div>
            <div className="w-16 shrink-0 text-right">
              <SearchSortHeader label="7d" column="change7d" currentSort={sort} onSort={handleSortChange} className="justify-end" />
            </div>
            <div className="w-8 shrink-0" />
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/30">
            {cards.map((card) => (
              <Link
                key={card.cardCode}
                href={`/cards/${card.cardCode}`}
                className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                {/* Image */}
                <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {card.imageUrl ? (
                    <Image
                      src={card.imageUrl}
                      alt=""
                      fill
                      className="object-contain"
                      sizes="56px"
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                    />
                  ) : (
                    <div className="size-full bg-muted" />
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{getCardName(lang, card)}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-mono text-[11px]">{card.cardCode}</span>
                    {card.set && <span>{card.set.code.toUpperCase()}</span>}
                    <RarityBadge rarity={card.rarity} size="sm" />
                  </div>
                  {/* Mobile price */}
                  <div className="mt-1.5 flex items-center gap-3 sm:hidden">
                    <span className="font-price text-sm font-semibold tabular-nums">
                      {card.latestPriceJpy != null ? <Price jpy={card.latestPriceJpy} thb={card.latestPriceThb} /> : "—"}
                    </span>
                    {card.priceChange24h != null && (
                      <span className={cn("font-price text-xs tabular-nums", changeClass(card.priceChange24h))}>
                        {formatChange(card.priceChange24h)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop columns */}
                <div className="hidden w-20 shrink-0 text-right font-price text-sm font-semibold tabular-nums sm:block">
                  {card.latestPriceJpy != null ? <Price jpy={card.latestPriceJpy} thb={card.latestPriceThb} /> : <span className="text-muted-foreground/40">—</span>}
                </div>
                <div className={cn("hidden w-16 shrink-0 text-right font-price text-xs tabular-nums sm:block", changeClass(card.priceChange24h))}>
                  {formatChange(card.priceChange24h)}
                </div>
                <div className={cn("hidden w-16 shrink-0 text-right font-price text-xs tabular-nums sm:block", changeClass(card.priceChange7d))}>
                  {formatChange(card.priceChange7d)}
                </div>

                {/* Watchlist — stopPropagation prevents navigation on the parent Link */}
                <div className="hidden w-8 shrink-0 sm:flex sm:justify-center" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
                  {card.id && <WatchlistStar cardId={card.id} size="sm" />}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t(lang, "pageOf")} {page} / {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fetch error */}
      {!isPending && fetchError && (
        <div className="panel px-4 py-8 text-center text-sm text-destructive">
          {t(lang, "loadFailed")}
        </div>
      )}

      {/* No results */}
      {!isPending && !fetchError && hasSearched && cards.length === 0 && query.trim() && (
        <div className="panel px-4 py-16 text-center">
          <p className="text-lg font-medium">{t(lang, "noResults")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(lang, "tryOtherSearch")}
          </p>
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && !query.trim() && (
        <div className="panel px-4 py-16 text-center">
          <Search className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t(lang, "typeToSearch")}
          </p>
        </div>
      )}
    </div>
  )
}

export default function SearchClient() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
