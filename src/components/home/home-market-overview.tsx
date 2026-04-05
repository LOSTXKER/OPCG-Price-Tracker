"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Clock,
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
import { RarityBadge } from "@/components/shared/rarity-badge"
import { Price } from "@/components/shared/price-inline"
import { getCardName, t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { BLUR_DATA_URL } from "@/lib/constants/ui"
import { getColorOptions } from "@/lib/constants/card-config"
import { fetchCards } from "@/lib/api/fetch-cards"
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

const RECENT_KEY = "meecard-recent-searches"
const MAX_RECENT = 6

function readRecent(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX_RECENT) : []
  } catch { return [] }
}

function writeRecent(items: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT))) } catch { /* */ }
}

type SuggestionCard = {
  cardCode: string
  nameJp: string
  nameEn?: string | null
  nameTh?: string | null
  rarity: string
  imageUrl?: string | null
  latestPriceJpy?: number | null
  set?: { code: string; name?: string; nameEn?: string | null }
}

function HeroSearchBar() {
  const router = useRouter()
  const lang = useUIStore((s) => s.language)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SuggestionCard[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => { setRecent(readRecent()) }, [])

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) { setResults([]); return }
    const controller = new AbortController()
    setLoading(true)
    fetchCards({ search: trimmed, limit: 6 }, { signal: controller.signal })
      .then((data) => { setResults(data.cards ?? []); setActiveIdx(-1) })
      .catch((err: unknown) => { if (err instanceof Error && err.name !== "AbortError") console.error(err) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  const pushRecent = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((x) => x.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_RECENT)
      writeRecent(next)
      return next
    })
  }, [])

  const commitSearch = useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    pushRecent(trimmed)
    setOpen(false)
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }, [pushRecent, router])

  const goToCard = useCallback((code: string) => {
    setOpen(false)
    router.push(`/cards/${code}`)
  }, [router])

  const filteredRecent = query.trim()
    ? recent.filter((r) => r.toLowerCase().includes(query.trim().toLowerCase()))
    : recent

  const allItems: { type: "result" | "recent"; key: string }[] = []
  for (const r of results) allItems.push({ type: "result", key: r.cardCode })
  if (results.length === 0) for (const r of filteredRecent) allItems.push({ type: "recent", key: r })

  const hasDropdown = open && (allItems.length > 0 || loading || (query.trim().length >= 2 && results.length === 0))

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)) }
    else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < allItems.length) {
        e.preventDefault()
        const item = allItems[activeIdx]
        if (item.type === "result") goToCard(item.key)
        else commitSearch(item.key)
      } else {
        e.preventDefault()
        commitSearch(query)
      }
    } else if (e.key === "Escape") { setOpen(false) }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    commitSearch(query)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <form onSubmit={handleSubmit} className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t(lang, "searchLong")}
            className={cn(
              "h-11 w-full border border-r-0 border-border/60 bg-card pl-12 pr-11 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20",
              hasDropdown ? "rounded-tl-xl" : "rounded-l-xl"
            )}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(-1); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className={cn(
            "h-11 shrink-0 bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90",
            hasDropdown ? "rounded-tr-xl" : "rounded-r-xl"
          )}
        >
          {t(lang, "searchButton")}
        </button>
      </form>

      {/* Suggestions dropdown */}
      {hasDropdown && (
        <div className="absolute inset-x-0 top-full z-50 overflow-hidden rounded-b-xl border border-t-0 border-border/60 bg-card shadow-lg">
          <div className="max-h-[50vh] overflow-y-auto">
            {/* Loading skeleton */}
            {loading && results.length === 0 && (
              <div className="space-y-1 p-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2">
                    <div className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Card results */}
            {results.length > 0 && (
              <div className="p-2">
                {results.map((card, i) => (
                  <button
                    key={card.cardCode}
                    type="button"
                    onClick={() => goToCard(card.cardCode)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
                      {card.imageUrl ? (
                        <Image src={card.imageUrl} alt="" fill className="object-contain" sizes="36px" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                      ) : (
                        <div className="size-full bg-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{getCardName(lang, card)}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {card.set?.code && <span className="font-mono">{card.set.code.toUpperCase()}</span>}
                        <RarityBadge rarity={card.rarity} size="sm" />
                      </div>
                    </div>
                    {card.latestPriceJpy != null && (
                      <span className="shrink-0 font-price text-sm font-semibold">
                        <Price jpy={Math.round(card.latestPriceJpy)} />
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => commitSearch(query)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                >
                  <Search className="size-3" />
                  {t(lang, "viewAllResults")} &ldquo;{query.trim()}&rdquo;
                </button>
              </div>
            )}

            {/* Recent searches */}
            {results.length === 0 && !loading && filteredRecent.length > 0 && (
              <div className="p-2">
                <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  {t(lang, "recentSearches")}
                </p>
                {filteredRecent.map((item, i) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => commitSearch(item)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      activeIdx === i ? "bg-accent" : "hover:bg-accent/60"
                    )}
                  >
                    <Clock className="size-3.5 text-muted-foreground" />
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {!loading && query.trim().length >= 2 && results.length === 0 && filteredRecent.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                {t(lang, "noResultsFor")} &ldquo;{query.trim()}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function buildTabs(labels: { all: string; popular: string }): Tab[] {
  return [
    { id: "all", label: labels.all, defaultSort: "price_desc" },
    { id: "popular", label: labels.popular, defaultSort: "views_desc" },
  ]
}

export function HomeMarketOverview({
  initialCards,
  initialTotal,
  initialTotalPages,
  filterDefinitions,
  initialSearch,
  children,
}: {
  initialCards: CardRow[]
  initialTotal: number
  initialTotalPages: number
  filterDefinitions: FilterDefinition[]
  initialSearch?: string
  children?: React.ReactNode
}) {
  const lang = useUIStore((s) => s.language)

  const setDef = filterDefinitions.find((f) => f.key === "set")
  const setOptions = setDef?.options ?? []

  const allFilterDefs: FilterDefinition[] = [
    ...filterDefinitions
      .filter((f) => f.key !== "set")
      .map((f) => ({
        ...f,
        label: f.key === "rarity" ? t(lang, "rarity")
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

  const tabs = buildTabs({
    all: t(lang, "allTab"),
    popular: t(lang, "popular"),
  })

  const m = useMarketCards({
    initialCards,
    initialTotal,
    initialTotalPages,
    tabs,
    initialSearch,
  })

  const selectedSets = m.filters.set ?? []
  const [showSearch, setShowSearch] = useState(false)

  return (
    <div className="space-y-6">
      {/* Hero search */}
      <HeroSearchBar />

      {children}

      {/* Main table panel */}
    <div className="panel overflow-hidden">
      {/* Row 1: Tabs + Filter + View toggle */}
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
            <div className="hidden items-center gap-0.5 rounded-full border border-border/50 p-0.5 sm:flex">
              <TrendingUpDown className="mx-1.5 size-3.5 text-muted-foreground/50" />
              {CHANGE_PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => m.setChangePeriod(p)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-all",
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

      {/* Row 2: Set dropdown + Search + Price mode */}
      <div className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2.5 px-4 py-2.5 sm:gap-3">
          {setOptions.length > 0 && (
            <select
              value={selectedSets[0] ?? ""}
              onChange={(e) =>
                m.handleFilterChange("set", e.target.value ? [e.target.value] : [])
              }
              className="h-9 min-w-0 flex-1 truncate rounded-lg border border-border/50 bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-border focus:border-primary/50 focus:outline-none sm:flex-none sm:min-w-[180px] sm:text-sm"
            >
              <option value="">{t(lang, "allSets")}</option>
              {setOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          <div className="relative hidden flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              placeholder={t(lang, "searchLong")}
              className="h-9 w-full rounded-lg border border-border/50 bg-card pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50"
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            className={cn(
              "rounded-lg p-2 transition-colors sm:hidden",
              showSearch
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
            aria-label="Search"
          >
            <Search className="size-4" />
          </button>

          <div className="ml-auto flex items-center gap-1">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t(lang, "price")}
            </span>
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
                  ? "border-amber-600 bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Shield className="size-3 text-amber-500" />
              PSA 10
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="border-t border-border/40 px-4 py-2 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder={t(lang, "searchLong")}
                className="h-9 w-full rounded-lg border border-border/50 bg-card pl-9 pr-8 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50"
                value={m.search}
                autoFocus
                onChange={(e) => {
                  m.setSearch(e.target.value)
                  if (e.target.value === "") m.setPage(1)
                }}
              />
              {m.search && (
                <button
                  type="button"
                  onClick={() => { m.setSearch(""); m.setPage(1) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
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
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-8" />
              <col className="w-10" />
              <col />
              <col className="hidden w-[72px] md:table-column" />
              <col className="hidden w-[88px] sm:table-column" />
              <col className="w-[100px]" />
              <col className="w-[88px]" />
              {m.showViews ? (
                <col className="hidden w-[80px] md:table-column" />
              ) : (
                <>
                  <col className="hidden w-[84px] md:table-column" />
                  <col className="hidden w-[84px] lg:table-column" />
                </>
              )}
              <col className="hidden w-[100px] xl:table-column" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5 pl-3 pr-0 font-medium"></th>
                <th className="py-2.5 pr-1 pl-1 font-medium">#</th>
                <th className="py-2.5 pr-3 pl-2 font-medium">{t(lang, "card")}</th>
                <th className="hidden py-2.5 pr-3 font-medium md:table-cell">{t(lang, "set")}</th>
                <SortableHeader label={t(lang, "rarity")} column="rarity" activeCol={m.sortCol} dir={m.sortDir} onClick={m.handleColumnSort} className="hidden sm:table-cell" />
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
