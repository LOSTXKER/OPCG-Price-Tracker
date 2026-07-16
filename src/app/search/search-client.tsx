"use client"

import { Suspense, useState } from "react"
import {
  Search,
  TrendingUpDown,
  X,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { getCardTypeOptions, getColorOptions } from "@/lib/constants/card-config"
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

type SetOption = {
  id: number
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

function SearchContent({ sets, game }: { sets: SetOption[]; game: string }) {
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
    filters,
    facets,
    inputRef,
    sortCol,
    sortDir,
    sparklines,
    modalFilterCount,
    activeFilterCount,
    handleSubmit,
    handleSortChange,
    handleColumnSort,
    handlePageChange,
    handleSetChange,
    handleMultiFilterToggle,
    handleVariantChange,
    handlePriceChange,
    resetModalFilters,
    refetch,
    clearFilters,
    clearInput,
  } = useSearch(game)

  const gameConfig = getGameConfig(game) ?? getGameConfig("opcg")
  const isAvailable = (available: string[], selected: string[], value: string) =>
    !facets || available.includes(value) || selected.includes(value)

  // Keep canonical game-config order/labels, then hide values with no match for
  // the active query. Facet-only values are appended so /all/search and future
  // game configs never lose valid options that OPCG's canonical list lacks.
  const canonicalRarities = gameConfig?.rarityFilterOptions ?? []
  const rarityCodes = new Set(canonicalRarities.map((option) => option.code))
  const rarityOptions = [
    ...canonicalRarities,
    ...(facets?.rarities ?? [])
      .filter((code) => !rarityCodes.has(code))
      .map((code) => ({ code, label: code })),
  ].filter((option) =>
    isAvailable(facets?.rarities ?? [], filters.rarities, option.code),
  )
  const canonicalTypes = getCardTypeOptions(lang)
  const typeValues = new Set(canonicalTypes.map((option) => option.value))
  const typeOptions = [
    ...canonicalTypes,
    ...(facets?.types ?? [])
      .filter((value) => !typeValues.has(value))
      .map((value) => ({ value, label: value })),
  ].filter((option) =>
    isAvailable(facets?.types ?? [], filters.types, option.value),
  )
  const canonicalColors = getColorOptions(lang)
  const colorValues = new Set(canonicalColors.map((option) => option.value))
  const colorOptions = [
    ...canonicalColors,
    ...(facets?.colors ?? [])
      .filter((value) => !colorValues.has(value))
      .map((value) => ({ value, label: value, dot: "bg-muted-foreground" })),
  ].filter((option) =>
    isAvailable(facets?.colors ?? [], filters.colors, option.value),
  )
  const variantOptions = [
    { code: "regular" as const, label: t(lang, "regular") },
    { code: "parallel" as const, label: t(lang, "parallel") },
  ].filter((option) =>
    !facets || facets.variants.includes(option.code) || filters.variant === option.code,
  )
  const availableSets = facets
    ? sets.filter((set) => facets.setIds.includes(set.id) || filters.set === set.code)
    : sets

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
        <Surface variant="panel" padding="none">
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

          <div className="flex flex-wrap items-center gap-2 rounded-b-lg border-t border-hair bg-popover px-4 py-2.5">
            {availableSets.length > 0 && (
              <div className="min-w-0 basis-full sm:basis-auto sm:w-[220px]">
                <SetPicker
                  sets={availableSets}
                  selectedCode={filters.set || null}
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
              appearance="outline"
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
                appearance="outline"
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

      {/* Query-aware secondary facets. Set + sort stay as their own controls above;
          rarity/type/color/version/price mirror the Home filter vocabulary. */}
      <FilterModal
        open={showFilters}
        onOpenChange={setShowFilters}
        onReset={resetModalFilters}
        resetDisabled={modalFilterCount === 0}
      >
        {rarityOptions.length > 0 && (
          <div>
            <span className="mb-1.5 block text-eyebrow">{t(lang, "rarity")}</span>
            <div className="flex flex-wrap gap-1.5">
              {rarityOptions.map((r) => {
                const active = filters.rarities.includes(r.code)
                return (
                  <button
                    key={r.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleMultiFilterToggle("rarities", r.code)}
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

        {typeOptions.length > 0 && (
          <div>
            <span className="mb-1.5 block text-eyebrow">{t(lang, "type")}</span>
            <div className="flex flex-wrap gap-1.5">
              {typeOptions.map((option) => {
                const active = filters.types.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleMultiFilterToggle("types", option.value)}
                    className={cn(
                      "ease-chrome min-h-11 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0",
                      active
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-hair bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {colorOptions.length > 0 && (
          <div>
            <span className="mb-1.5 block text-eyebrow">{t(lang, "color")}</span>
            <div className="flex flex-wrap gap-1.5">
              {colorOptions.map((option) => {
                const active = filters.colors.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleMultiFilterToggle("colors", option.value)}
                    className={cn(
                      "ease-chrome flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0",
                      active
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-hair bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className={cn("size-2.5 rounded-full", option.dot)} />
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {variantOptions.length > 0 && (
          <div>
            <span className="mb-1.5 block text-eyebrow">{t(lang, "variant")}</span>
            <div className="flex flex-wrap gap-1.5">
              {variantOptions.map((option) => {
                const active = filters.variant === option.code
                return (
                  <button
                    key={option.code}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleVariantChange(active ? "" : option.code)}
                    className={cn(
                      "ease-chrome min-h-11 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors md:min-h-0",
                      active
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-hair bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "priceLabel")}</span>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              value={filters.minPrice}
              onChange={(event) => handlePriceChange("minPrice", event.target.value)}
              placeholder={t(lang, "min")}
              aria-label={`${t(lang, "priceLabel")} ${t(lang, "min")}`}
              className="surface-1 h-11 w-24 border-hair px-2 tabular-nums placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20 md:h-10"
            />
            <span className="text-meta">–</span>
            <Input
              type="number"
              min={0}
              value={filters.maxPrice}
              onChange={(event) => handlePriceChange("maxPrice", event.target.value)}
              placeholder={t(lang, "max")}
              aria-label={`${t(lang, "priceLabel")} ${t(lang, "max")}`}
              className="surface-1 h-11 w-24 border-hair px-2 tabular-nums placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20 md:h-10"
            />
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
            mobileSortAppearance="outline"
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

export default function SearchClient({ sets, game }: { sets: SetOption[]; game: string }) {
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
      <SearchContent sets={sets} game={game} />
    </Suspense>
  )
}
