"use client"

import { Suspense, useState } from "react"
import {
  Filter,
  LayoutGrid,
  List,
  Search,
  TrendingUpDown,
  X,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Surface } from "@/components/ui/surface"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterModal } from "@/components/shared/filter-modal"
import { cn } from "@/lib/utils"
import { ToolbarSortDropdown } from "@/components/ui/toolbar"
import { SetPicker } from "@/components/shared/set-picker"
import { GridCard, GridCardSkeleton } from "@/components/home/grid-card"
import { MobileCardSkeleton } from "@/components/home/mobile-card-item"
import { MarketTable } from "@/components/market/market-table"
import { buildMarketColumns } from "@/components/market/market-columns"
import { CardGrid } from "@/components/cards/card-grid"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import {
  type SortKey,
  CHANGE_PERIODS,
  PAGE_SIZE,
} from "@/components/home/market-types"
import { SearchPagination } from "./search-pagination"
import { PhotoSearchButton } from "./photo-search-button"
import { useSearch } from "./use-search"

// /search renders the shared market table with no "Views" column (views are a
// home "popular" tab concept). Static — never changes — so build it once.
const SEARCH_COLUMNS = buildMarketColumns({ showViews: false })

type SetOption = {
  code: string
  name: string
  nameEn: string | null
  nameTh?: string | null
  type: string
  imageUrl?: string | null
  releaseDate?: string | null
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

function SearchContent({
  sets,
  rarities,
}: {
  sets: SetOption[]
  rarities: string[]
}) {
  const lang = useUIStore((s) => s.language)
  const SORT_OPTIONS = SORT_KEYS.map((o) => ({ key: o.value, label: t(lang, o.key) }))
  const [showFilters, setShowFilters] = useState(false)

  const {
    query,
    inputValue,
    setInputValue,
    sort,
    page,
    cards,
    total,
    totalPages,
    isPending,
    hasSearched,
    fetchError,
    viewMode,
    setViewMode,
    changePeriod,
    setChangePeriod,
    selectedSet,
    selectedRarity,
    inputRef,
    sortCol,
    sortDir,
    sparklines,
    activeFilterCount,
    handleSubmit,
    handleSortChange,
    handleColumnSort,
    handlePageChange,
    handleSetChange,
    handleRarityChange,
    refetch,
    clearFilters,
    clearInput,
  } = useSearch()

  // Rarity is the only modal facet. Selection is a comma-joined string in the
  // hook; toggle in/out of the array and re-join to preserve the multi query.
  const rarityValues = selectedRarity ? selectedRarity.split(",") : []
  const rarityCount = rarityValues.length
  const toggleRarity = (value: string) => {
    const next = rarityValues.includes(value)
      ? rarityValues.filter((r) => r !== value)
      : [...rarityValues, value]
    handleRarityChange(next.join(","))
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t(lang, "searchLong")}
            className="h-12 w-full rounded-l-xl border border-r-0 border-hair bg-card pl-12 pr-11 text-base outline-none ease-chrome transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
          {inputValue && (
            <button
              type="button"
              onClick={clearInput}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground ease-chrome transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Button
          type="submit"
          className="-ml-2 h-12 shrink-0 rounded-l-none rounded-r-xl px-6"
        >
          {t(lang, "searchButton")}
        </Button>
        <PhotoSearchButton className="h-12" />
      </form>

      {/* Results summary + controls */}
      {hasSearched && query.trim() && (
        <Surface variant="panel" padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {t(lang, "resultsFor")} &ldquo;<span className="font-medium text-foreground">{query}</span>&rdquo;
              {total > 0 && <span className="ml-1.5 tabular-nums">({total.toLocaleString()} {t(lang, "items")})</span>}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-primary hover:underline"
              >
                {t(lang, "clearAll")}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-hair bg-popover px-4 py-2.5">
            {sets.length > 0 && (
              <div className="min-w-0 basis-full sm:basis-auto sm:w-[220px]">
                <SetPicker
                  sets={sets}
                  selectedCode={selectedSet || null}
                  onSelect={(code) => handleSetChange(code ?? "")}
                  variant="inline"
                  nullable
                />
              </div>
            )}

            {rarities.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className={cn(
                  "ease-chrome relative flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
                  rarityCount > 0
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-hair bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Filter className="size-3.5" />
                {t(lang, "filter")}
                {rarityCount > 0 && (
                  <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-micro text-primary-foreground">
                    {rarityCount}
                  </span>
                )}
              </button>
            )}

            <div className="hidden sm:block">
              <ToolbarSortDropdown
                options={SORT_OPTIONS}
                activeKey={sort}
                activeDir={sortDir}
                onChange={(key) => handleSortChange(key as SortKey)}
                align="start"
              />
            </div>

            <div className="ml-auto flex items-center gap-1.5">
              {viewMode === "grid" && (
                <div className="hidden sm:block">
                  <SegmentedControl
                    options={CHANGE_PERIODS.map((p) => ({ value: p, label: p }))}
                    value={changePeriod}
                    onChange={setChangePeriod}
                    size="sm"
                    variant="pill"
                    leadingIcon={TrendingUpDown}
                    ariaLabel={t(lang, "change")}
                  />
                </div>
              )}

              <SegmentedControl
                options={[
                  { value: "table", label: "Table", icon: List, ariaLabel: "Table view" },
                  { value: "grid", label: "Grid", icon: LayoutGrid, ariaLabel: "Grid view" },
                ]}
                value={viewMode}
                onChange={setViewMode}
                size="sm"
                ariaLabel="View mode"
              />
            </div>
          </div>
        </Surface>
      )}

      {/* Rarity filter — opens in the canonical FilterModal. Set + sort stay as
          their own controls above; only the secondary facet lives here. */}
      {rarities.length > 0 && (
        <FilterModal
          open={showFilters}
          onOpenChange={setShowFilters}
          onReset={() => handleRarityChange("")}
          resetDisabled={rarityCount === 0}
        >
          <div>
            <span className="mb-1.5 block text-eyebrow">{t(lang, "rarity")}</span>
            <div className="flex flex-wrap gap-1.5">
              {rarities.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRarity(r)}
                  className={cn(
                    "ease-chrome rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    rarityValues.includes(r)
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-hair bg-background text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </FilterModal>
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
          <Surface variant="panel" padding="none" className="divide-y divide-hair">
            <div className="divide-y divide-hair sm:hidden">
              {Array.from({ length: 8 }).map((_, i) => (
                <MobileCardSkeleton key={i} />
              ))}
            </div>
            <div className="hidden divide-y divide-hair sm:block">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <Skeleton className="size-12 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40 rounded-sm" />
                    <Skeleton className="h-3 w-24 rounded-sm" />
                  </div>
                  <Skeleton className="h-4 w-20 rounded-sm" />
                  <Skeleton className="h-3.5 w-12 rounded-sm" />
                  <Skeleton className="hidden h-3.5 w-12 rounded-sm md:block" />
                </div>
              ))}
            </div>
          </Surface>
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

      {/* Results — Table view (shared market table) */}
      {!isPending && cards.length > 0 && viewMode === "table" && (
        <Surface variant="panel" padding="none" className="overflow-hidden">
          <MarketTable
            cards={cards}
            rankOffset={(page - 1) * PAGE_SIZE}
            columns={SEARCH_COLUMNS}
            priceMode="raw"
            sparklines={sparklines}
            sortCol={sortCol}
            sortDir={sortDir}
            onColumnSort={handleColumnSort}
            isPending={isPending}
            skeletonRows={PAGE_SIZE}
            emptyText={t(lang, "noData")}
          />
        </Surface>
      )}

      {/* Pagination */}
      {!isPending && totalPages > 1 && cards.length > 0 && (
        <SearchPagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      )}

      {/* Fetch error */}
      {!isPending && fetchError && (
        <EmptyState
          variant="error"
          title={t(lang, "loadFailed")}
          action={
            <Button type="button" onClick={() => refetch()}>
              {t(lang, "retry")}
            </Button>
          }
        />
      )}

      {/* No results */}
      {!isPending && !fetchError && hasSearched && cards.length === 0 && query.trim() && (
        <EmptyState
          variant="panel"
          icon={Search}
          title={t(lang, "noResults")}
          description={t(lang, "tryOtherSearch")}
        />
      )}

      {/* Initial state — no query */}
      {!hasSearched && !query.trim() && (
        <EmptyState
          variant="panel"
          icon={Search}
          title={t(lang, "typeToSearch")}
        />
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
          <Skeleton className="h-96 w-full rounded-xl shadow-[var(--panel-shadow)]" />
        </div>
      }
    >
      <SearchContent sets={sets} rarities={rarities} />
    </Suspense>
  )
}
