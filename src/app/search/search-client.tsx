"use client"

import { Suspense, useState } from "react"
import {
  Search,
  TrendingUpDown,
  X,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { Surface } from "@/components/ui/surface"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ViewModeControl } from "@/components/ui/view-mode-control"
import { EmptyState } from "@/components/shared/empty-state"
import { FilterModal } from "@/components/shared/filter-modal"
import { cn } from "@/lib/utils"
import { FilterButton, ToolbarSortDropdown } from "@/components/ui/toolbar"
import { SetPicker } from "@/components/shared/set-picker"
import { CardItem, CardItemSkeleton } from "@/components/cards/card-item"
import { MobileCardSkeleton } from "@/components/home/mobile-card-item"
import { MarketTable } from "@/components/market/market-table"
import { buildMarketColumns } from "@/components/market/market-columns"
import { CardGrid } from "@/components/cards/card-grid"
import { t } from "@/lib/i18n"
import { getGameConfig } from "@/lib/game-config"
import { RARITY_HEX } from "@/lib/constants/rarities"
import { useUIStore } from "@/stores/ui-store"
import {
  type SortKey,
  CHANGE_PERIODS,
  PAGE_SIZE,
} from "@/components/home/market-types"
import { PhotoSearchButton } from "./photo-search-button"
import { useSearch } from "./use-search"

// /search renders the shared market table with no "Views" column (views are a
// home "popular" tab concept). Static — never changes — so build it once.
const SEARCH_COLUMNS = buildMarketColumns({ showViews: false })

// Rarity facet = BASE options only (SEC/SR/R/UC/C/L/SP/TR/DON — no P- variants).
// The server expands a base rarity to its P- family (rarity=SEC → SEC + P-SEC),
// so we drive the chips off the game config's canonical base list instead of the
// distinct DB rarities (which include "P-SEC" etc.). No client ",P-" expansion.
const RARITY_OPTIONS = getGameConfig("opcg")?.rarityFilterOptions ?? []

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

function SearchContent({ sets }: { sets: SetOption[] }) {
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
    selectedVariant,
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
    handleVariantChange,
    refetch,
    clearFilters,
    clearInput,
  } = useSearch()

  // Version facet — ปกติ / พาราเลล → the `variant` param (regular|parallel).
  // Single-select: tapping the active chip clears it (both).
  const VARIANT_OPTIONS = [
    { code: "regular", label: t(lang, "regular") },
    { code: "parallel", label: t(lang, "parallel") },
  ]

  // Rarity + version are the modal facets. Rarity is a comma-joined multi-select
  // in the hook; toggle in/out of the array and re-join to preserve the query.
  const rarityValues = selectedRarity ? selectedRarity.split(",") : []
  const rarityCount = rarityValues.length
  const toggleRarity = (value: string) => {
    const next = rarityValues.includes(value)
      ? rarityValues.filter((r) => r !== value)
      : [...rarityValues, value]
    handleRarityChange(next.join(","))
  }
  // How many modal facets are set (drives the "ตัวกรอง" button badge + reset).
  const modalFilterCount = rarityCount + (selectedVariant ? 1 : 0)

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
            aria-label={t(lang, "searchLong")}
            className="h-12 w-full rounded-l-xl border border-r-0 border-hair bg-card pl-12 pr-11 text-base outline-none ease-chrome transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
          {inputValue && (
            <button
              type="button"
              aria-label={t(lang, "clearAll")}
              onClick={clearInput}
              className="tap-safe absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground ease-chrome transition-colors hover:bg-muted hover:text-foreground"
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
                className="min-h-11 px-2 text-xs text-primary hover:underline md:min-h-0"
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
                  triggerClassName="tap-safe h-10 sm:h-9"
                />
              </div>
            )}

            <FilterButton
              count={modalFilterCount}
              active={showFilters || modalFilterCount > 0}
              onClick={() => setShowFilters(true)}
              aria-label={t(lang, "filter")}
              aria-haspopup="dialog"
              aria-expanded={showFilters}
              className="shrink-0"
            >
              {t(lang, "filter")}
            </FilterButton>

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

              <ViewModeControl
                modes={["table", "grid"]}
                value={viewMode}
                onChange={setViewMode}
                showLabels
              />
            </div>
          </div>
        </Surface>
      )}

      {/* Rarity + version filters — open in the canonical FilterModal. Set + sort
          stay as their own controls above; the secondary facets live here. Rarity
          chips are BASE only (config list); the server expands SEC → SEC + P-SEC.
          The version facet (ปกติ/พาราเลล) narrows regular/parallel. */}
      <FilterModal
        open={showFilters}
        onOpenChange={setShowFilters}
        onReset={() => {
          handleRarityChange("")
          handleVariantChange("")
        }}
        resetDisabled={modalFilterCount === 0}
      >
        {RARITY_OPTIONS.length > 0 && (
          <div>
            <span className="mb-1.5 block text-eyebrow">{t(lang, "rarity")}</span>
            <div className="flex flex-wrap gap-1.5">
              {RARITY_OPTIONS.map((r) => {
                const active = rarityValues.includes(r.code)
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => toggleRarity(r.code)}
                    className={cn(
                      "ease-chrome min-h-11 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors md:min-h-0",
                      active
                        ? "text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                    style={active ? { backgroundColor: RARITY_HEX[r.code] ?? "#6B7280" } : undefined}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "variant")}</span>
          <div className="flex flex-wrap gap-1.5">
            {VARIANT_OPTIONS.map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() =>
                  handleVariantChange(selectedVariant === v.code ? "" : v.code)
                }
                className={cn(
                  "ease-chrome min-h-11 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0",
                  selectedVariant === v.code
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-hair bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </FilterModal>

      {/* Loading */}
      {isPending && (
        viewMode === "grid" ? (
          <CardGrid>
            {Array.from({ length: 10 }).map((_, i) => (
              <CardItemSkeleton key={i} />
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
            <CardItem
              key={card.cardCode}
              cardCode={card.cardCode}
              cardId={card.id}
              nameJp={card.nameJp}
              nameEn={card.nameEn}
              nameTh={card.nameTh}
              rarity={card.rarity}
              imageUrl={card.imageUrl}
              setCode={card.set?.code ?? card.setCode}
              priceJpy={card.latestPriceJpy}
              priceChange24h={card.priceChange24h}
              priceChange7d={card.priceChange7d}
              priceChange30d={card.priceChange30d}
              psa10PriceUsd={card.psa10PriceUsd}
              changePeriod={changePeriod}
              priceMode="raw"
              linkSet
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
        <Surface variant="panel">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="px-4 py-3"
            summary={
              <p className="text-meta tabular-nums">
                {t(lang, "pageOf")} {page} / {totalPages}
              </p>
            }
          />
        </Surface>
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

export default function SearchClient({ sets }: { sets: SetOption[] }) {
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
      <SearchContent sets={sets} />
    </Suspense>
  )
}
