"use client"

import { Fragment, Suspense, useState } from "react"
import {
  Search,
  TrendingUpDown,
  X,
} from "lucide-react"

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
import { CardItem } from "@/components/cards/card-item"
import { MarketTable } from "@/components/market/market-table"
import { GradeControl } from "@/components/market/price-mode-control"
import { CardGrid } from "@/components/cards/card-grid"
import { AdPageContentReady } from "@/components/ads/ad-audience-provider"
import { AdInventorySlot } from "@/components/ads/ad-inventory-slot"
import { t } from "@/lib/i18n"
import { getGameConfig } from "@/lib/game-config"
import { getCardTypeOptions, getColorOptions } from "@/lib/constants/card-config"
import { RARITY_HEX } from "@/lib/constants/rarities"
import { useUIStore } from "@/stores/ui-store"
import {
  type SortKey,
  CHANGE_PERIODS,
  PAGE_SIZE,
  periodForColumn,
} from "@/components/home/market-types"
import { PhotoSearchButton } from "./photo-search-button"
import {
  SearchPageSkeleton,
  SearchResultsSkeleton,
} from "./search-loading-skeleton"
import { SEARCH_COLUMNS } from "./search-market-config"
import { useSearch } from "./use-search"
import { isRawGrade } from "@/lib/pricing/grade-tiers"

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
    grade,
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
    handleGradeChange,
    resetModalFilters,
    refetch,
    clearFilters,
    clearInput,
  } = useSearch(game)
  const rawGrade = isRawGrade(grade)
  const showInFeedAd =
    !isPending &&
    !fetchError &&
    hasSearched &&
    Boolean(query.trim()) &&
    cards.length > 8
  const showBottomAnchor =
    !isPending &&
    !fetchError &&
    hasSearched &&
    Boolean(query.trim()) &&
    cards.length > 0
  const SORT_OPTIONS = SORT_KEYS
    .filter(
      (option) =>
        rawGrade ||
        (!option.value.startsWith("price_") &&
          !option.value.startsWith("change_")),
    )
    .map((option) => ({
      key: option.value,
      label: t(lang, option.key),
    }))

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
      {showBottomAnchor && <AdPageContentReady />}

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

            <GradeControl value={grade} onChange={handleGradeChange} />

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

            {viewMode === "grid" && (
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
            )}

            <div className="ml-auto flex items-center gap-1.5">
              {viewMode === "grid" && rawGrade && (
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

        {rawGrade && (
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
        )}
      </FilterModal>

      {/* Loading */}
      {isPending && <SearchResultsSkeleton view={viewMode} />}

      {/* Results — Grid view */}
      {!isPending && cards.length > 0 && viewMode === "grid" && (
        <CardGrid>
          {cards.map((card, index) => (
            <Fragment key={card.cardCode}>
              <CardItem
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
                grade={grade}
                linkSet
              />
              {index === 7 && (
                <AdInventorySlot
                  zone="search-results-after-8"
                  contentAvailable={showInFeedAd}
                  className="col-span-full my-2 sm:my-4"
                />
              )}
            </Fragment>
          ))}
        </CardGrid>
      )}

      {/* Results — Table view (shared market table) */}
      {!isPending && cards.length > 0 && viewMode === "table" && (
        <MarketTable
          surface="canvas"
          cards={cards}
          rankOffset={(page - 1) * PAGE_SIZE}
          columns={SEARCH_COLUMNS}
          grade={grade}
          changePeriod={
            // Phone rows carry no period pill — the sort dropdown IS the period
            // control here, so the % chip follows the sorted change column.
            (sortCol ? periodForColumn(sortCol) : null) ?? changePeriod
          }
          mobileSortAppearance="outline"
          sparklines={sparklines}
          sortCol={sortCol}
          sortDir={sortDir}
          onColumnSort={handleColumnSort}
          isPending={isPending}
          skeletonRows={PAGE_SIZE}
          emptyText={t(lang, "noData")}
          insetAfter={showInFeedAd ? 8 : undefined}
          mobileInset={
            <AdInventorySlot
              zone="search-results-after-8"
              contentAvailable={showInFeedAd}
              className="my-5"
            />
          }
          tableInset={
            <AdInventorySlot
              zone="search-results-after-8"
              contentAvailable={showInFeedAd}
              presentation="TABLE_ROW"
              tableColumnCount={SEARCH_COLUMNS.length}
            />
          }
        />
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
      fallback={<SearchPageSkeleton />}
    >
      <SearchContent sets={sets} game={game} />
    </Suspense>
  )
}
