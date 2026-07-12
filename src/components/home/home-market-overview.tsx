"use client"

import { TrendingUpDown } from "lucide-react"

import { useMemo } from "react"

import { type FilterDefinition } from "@/components/shared/filter-chips"
import { FilterModal } from "@/components/shared/filter-modal"
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker"
import { AdSlot } from "@/components/ads/ad-slot"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { FilterButton, ToolbarSortDropdown } from "@/components/ui/toolbar"
import { ViewModeControl } from "@/components/ui/view-mode-control"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import { getCardTypeLabel, getColorOptions } from "@/lib/constants/card-config"
import { useMarketCards } from "@/hooks/use-market-cards"

import { getMarketColumnLabel, MarketTable } from "@/components/market/market-table"
import { PriceModeControl } from "@/components/market/price-mode-control"
import { buildMarketColumns } from "@/components/market/market-columns"
import { CardItem, CardItemSkeleton } from "@/components/cards/card-item"
import {
  type Tab,
  type CardRow,
  type ColumnId,
  CHANGE_PERIODS,
  PAGE_SIZE,
} from "./market-types"

export type { CardRow }

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
  sets,
  initialSearch,
  children,
}: {
  initialCards: CardRow[]
  initialTotal: number
  initialTotalPages: number
  filterDefinitions: FilterDefinition[]
  sets: SetPickerItem[]
  initialSearch?: string
  children?: React.ReactNode
}) {
  const lang = useUIStore((s) => s.language)

  const allFilterDefs: FilterDefinition[] = [
    ...filterDefinitions
      .filter((f) => f.key !== "set")
      .map((f) => ({
        ...f,
        label: f.key === "rarity" ? t(lang, "rarity")
          : f.key === "type" ? t(lang, "type")
          : f.label,
        // Type option labels arrive baked English from page.tsx (ISR, no request
        // language) — relabel to the user's language. Rarity codes (SEC) stay as-is.
        options: f.key === "type"
          ? f.options.map((o) => ({ ...o, label: getCardTypeLabel(o.value, lang) }))
          : f.options,
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
  const columns = useMemo(() => buildMarketColumns({ showViews: m.showViews }), [m.showViews])
  const mobileSortOptions = columns.flatMap((column) =>
    column.sort
      ? [{ key: column.sort, label: getMarketColumnLabel(column, lang) }]
      : []
  )
  const showMobileSort = m.viewMode === "table"
    && mobileSortOptions.length > 0
    && (m.isPending || m.cards.length > 0)

  // Reset clears only the modal's own facets (rarity/type/color/variant) + price
  // range — NOT the set (its own control up top) and NOT search (outside the modal).
  const resetModalFilters = () => {
    for (const def of allFilterDefs) {
      if ((m.filters[def.key]?.length ?? 0) > 0) m.handleFilterChange(def.key, [])
    }
    m.setMinPrice("")
    m.setMaxPrice("")
    m.setPage(1)
  }

  const renderFilterTrigger = (showLabel: boolean) => (
    <FilterButton
      aria-label={t(lang, "filter")}
      aria-haspopup="dialog"
      aria-expanded={m.filterOpen}
      onClick={() => m.setFilterOpen(true)}
      active={m.filterOpen || m.activeFilterCount > 0}
      count={m.activeFilterCount}
      iconOnly={!showLabel}
      className="shrink-0"
    >
      {showLabel && <span className="hidden md:inline">{t(lang, "filter")}</span>}
    </FilterButton>
  )

  const renderViewControl = () => (
    <ViewModeControl
      modes={["table", "grid"]}
      value={m.viewMode}
      onChange={m.setViewMode}
    />
  )

  return (
    <div className="space-y-4">
      {children}

      {/* Main table — flat, no panel box (minimal; floats on the page like the
          highlights band above). The only structural line is the header underline. */}
    <div>
      {/* Toolbar — 2 rows: scope (tabs) on top, browse + display controls below */}
      <div>
        {/* Row 1: tab bar — sits on a hairline baseline. Active tab's border-b-2
            uses -mb-px to overlap (cover) the hairline so it reads as one edge. */}
        <div className="flex items-center gap-1 border-b border-hair px-3 sm:px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => m.handleTabChange(tab.id)}
              className={cn(
                "ease-chrome relative -mb-px min-h-11 shrink-0 border-b-2 px-2.5 py-2.5 text-xs font-semibold",
                m.activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile browse controls: the set is the primary axis and owns the
            first row. Display actions stay together, while sorting gets enough
            width to keep its label readable at the narrowest supported size. */}
        <div className="space-y-2 px-3 py-3 sm:hidden">
          {sets.length > 0 && (
            <SetPicker
              sets={sets}
              selectedCode={selectedSets[0] ?? null}
              onSelect={(code) => m.handleFilterChange("set", code ? [code] : [])}
              variant="inline"
              nullable
              prominent
              triggerClassName="tap-safe h-10 rounded-lg border-primary/25 bg-primary/5 hover:border-primary/35 hover:bg-primary/10 aria-expanded:rounded-b-none aria-expanded:border-primary/35 aria-expanded:bg-primary/10"
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <PriceModeControl
              value={m.priceMode}
              onChange={(mode) => { m.setPriceMode(mode); m.setPage(1) }}
            />

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {renderFilterTrigger(false)}
              {renderViewControl()}
            </div>
          </div>

          {showMobileSort && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-meta shrink-0">{t(lang, "sortBy")}</span>
              <ToolbarSortDropdown
                options={mobileSortOptions}
                activeKey={(m.sortCol ?? "") as ColumnId}
                activeDir={m.sortDir}
                onChange={(key) => m.handleColumnSort(key)}
                fallbackLabel={t(lang, "sortBy")}
                align="end"
                stableMobileWidth
                className="ml-auto w-48 min-w-0 flex-none"
              />
            </div>
          )}
        </div>

        {/* Desktop/tablet keeps the established single-row toolbar. */}
        <div className="hidden items-center gap-2 px-4 py-2 sm:flex">
          {sets.length > 0 && (
            <div className="w-[19rem] flex-none">
              <SetPicker
                sets={sets}
                selectedCode={selectedSets[0] ?? null}
                onSelect={(code) => m.handleFilterChange("set", code ? [code] : [])}
                variant="inline"
                nullable
              />
            </div>
          )}

          <div className="ml-auto flex shrink-0 items-center justify-end gap-1.5">
            <PriceModeControl
              value={m.priceMode}
              onChange={(mode) => { m.setPriceMode(mode); m.setPage(1) }}
            />

            <div className="h-5 w-px bg-border/40" />

            {/* Opens the canonical FilterModal (centered on desktop, full-screen
                on mobile). Badge counts only the modal's facets + price range —
                set has its own control up top. */}
            {renderFilterTrigger(true)}
            {renderViewControl()}
          </div>
        </div>
      </div>

      {/* Advanced facet filters — the one canonical FilterModal (centered card on
          desktop, full-screen on mobile, dark-blur backdrop). Only secondary
          facets (rarity/type/color/variant) + price range live here; set / price-lens
          / view / search stay as their own controls outside. */}
      <FilterModal
        open={m.filterOpen}
        onOpenChange={m.setFilterOpen}
        onReset={resetModalFilters}
        resetDisabled={m.activeFilterCount === 0}
      >
        <div className="space-y-3.5">
          {allFilterDefs.map((def) => {
            const values = m.filters[def.key] ?? []
            return (
              <div key={def.key}>
                <span className="mb-1.5 block text-eyebrow">{def.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {def.options.map((opt) => {
                    const active = values.includes(opt.value)
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          m.handleFilterChange(
                            def.key,
                            active
                              ? values.filter((v) => v !== opt.value)
                              : [...values, opt.value]
                          )
                        }
                        className={cn(
                          "ease-chrome flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium md:min-h-0",
                          active
                            ? "border-primary/40 bg-primary/5 text-primary"
                            : "border-hair bg-background text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {opt.dot && (
                          <span className={cn("size-2.5 rounded-full", opt.dot)} />
                        )}
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "priceLabel")}</span>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              placeholder={t(lang, "min")}
              className="surface-1 h-11 w-24 border-hair px-2 tabular-nums placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20 md:h-10"
              value={m.minPrice}
              onChange={(e) => { m.setMinPrice(e.target.value); m.setPage(1) }}
              min={0}
            />
            <span className="text-meta">–</span>
            <Input
              type="number"
              placeholder={t(lang, "max")}
              className="surface-1 h-11 w-24 border-hair px-2 tabular-nums placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20 md:h-10"
              value={m.maxPrice}
              onChange={(e) => { m.setMaxPrice(e.target.value); m.setPage(1) }}
              min={0}
            />
          </div>
        </div>
      </FilterModal>

      {/* Content: Table or Grid */}
      {m.viewMode === "table" ? (
        <MarketTable
          surface="canvas"
          showMobileSort={false}
          cards={m.cards}
          rankOffset={(m.page - 1) * PAGE_SIZE}
          columns={columns}
          priceMode={m.priceMode}
          sparklines={m.sparklines}
          sortCol={m.sortCol}
          sortDir={m.sortDir}
          onColumnSort={m.handleColumnSort}
          isPending={m.isPending}
          skeletonRows={PAGE_SIZE}
          emptyText={t(lang, "noData")}
          inFeedAd={(i) =>
            i === 9 && m.cards.length > 12 ? (
              <AdSlot placement="browse-in-feed" className="aspect-[6/1]" />
            ) : null
          }
        />
      ) : (
        <div className={cn("p-4", m.isPending && "opacity-50 motion-base")}>
          <div className="mb-3 flex justify-end">
            <SegmentedControl
              size="sm"
              variant="pill"
              leadingIcon={TrendingUpDown}
              options={CHANGE_PERIODS.map((p) => ({ value: p, label: p }))}
              value={m.changePeriod}
              onChange={m.setChangePeriod}
              ariaLabel={t(lang, "change")}
            />
          </div>
          {m.isPending && m.cards.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <CardItemSkeleton key={i} />)}
            </div>
          ) : m.cards.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t(lang, "noData")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {m.cards.map((card) => (
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
                  changePeriod={m.changePeriod}
                  priceMode={m.priceMode}
                  linkSet
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Pagination
        page={m.page}
        totalPages={m.totalPages}
        isPending={m.isPending}
        onPageChange={m.setPage}
        className="border-t border-hair px-4 py-3"
        summary={
          <p className="hidden text-meta sm:block">
            {t(lang, "showingOf")} {formatCount((m.page - 1) * PAGE_SIZE + 1)}-
            {formatCount(Math.min(m.page * PAGE_SIZE, m.total))} {t(lang, "from")}{" "}
            {formatCount(m.total)} {t(lang, "card")}
          </p>
        }
      />
    </div>
    </div>
  )
}
