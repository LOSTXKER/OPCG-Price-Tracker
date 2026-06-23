"use client"

import {
  LayoutGrid,
  List,
  SlidersHorizontal,
  TrendingUpDown,
  X,
} from "lucide-react"

import { useMemo } from "react"

import { FilterChips, type FilterDefinition } from "@/components/shared/filter-chips"
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker"
import { AdSlot } from "@/components/ads/ad-slot"
import { Input } from "@/components/ui/input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ViewToggle } from "@/components/ui/toolbar"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { getColorOptions } from "@/lib/constants/card-config"
import { useMarketCards } from "@/hooks/use-market-cards"

import { MarketTable } from "@/components/market/market-table"
import { PriceModeControl } from "@/components/market/price-mode-control"
import { buildMarketColumns } from "@/components/market/market-columns"
import { GridCard, GridCardSkeleton } from "./grid-card"
import { Pagination } from "./pagination"
import {
  type Tab,
  type CardRow,
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

  return (
    <div className="space-y-4">
      {children}

      {/* Main table — flat, no panel box (minimal; floats on the page like the
          highlights band above). The only structural line is the header underline. */}
    <div>
      {/* Toolbar — single row on sm+, two rows on mobile */}
      <div>
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:flex-nowrap sm:gap-2.5 sm:px-4">
          {/* Tabs (underline-style) — neutral foreground underline, not gold, so
              the page keeps a single honey accent like card-detail. */}
          <div className="flex shrink-0 items-center gap-1 -mb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => m.handleTabChange(tab.id)}
                className={cn(
                  "ease-chrome relative shrink-0 border-b-2 px-2.5 py-2 text-xs font-semibold",
                  m.activeTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Set picker — the primary browse axis, given the prominent center slot
              (replaces the old in-table search; the hero search above covers lookup). */}
          {sets.length > 0 && (
            <div className="hidden min-w-0 flex-1 sm:block sm:max-w-xs">
              <SetPicker
                sets={sets}
                selectedCode={selectedSets[0] ?? null}
                onSelect={(code) => m.handleFilterChange("set", code ? [code] : [])}
                variant="inline"
                nullable
                prominent
              />
            </div>
          )}

          {/* Right cluster — own full-width row on mobile (declutter), inline on sm+ */}
          <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto">
            <PriceModeControl
              value={m.priceMode}
              onChange={(mode) => { m.setPriceMode(mode); m.setPage(1) }}
            />

            <button
              type="button"
              onClick={() => m.setFilterOpen((o) => !o)}
              className={cn(
                "ease-chrome flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                m.filterOpen || m.activeFilterCount > 0
                  ? "bg-foreground/[0.06] text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="hidden md:inline">{t(lang, "filter")}</span>
              {m.activeFilterCount > 0 && (
                <span className="flex size-4.5 items-center justify-center rounded-full bg-foreground/10 text-micro text-foreground">
                  {m.activeFilterCount}
                </span>
              )}
            </button>

            <ViewToggle
              modes={[
                { value: "table", icon: List, ariaLabel: "Table view" },
                { value: "grid", icon: LayoutGrid, ariaLabel: "Grid view" },
              ]}
              value={m.viewMode}
              onChange={m.setViewMode}
            />
          </div>
        </div>

        {/* Mobile-only set picker row */}
        {sets.length > 0 && (
          <div className="border-t border-[var(--p-hair)] px-3 py-2 sm:hidden">
            <SetPicker
              sets={sets}
              selectedCode={selectedSets[0] ?? null}
              onSelect={(code) => m.handleFilterChange("set", code ? [code] : [])}
              variant="inline"
              nullable
              prominent
            />
          </div>
        )}
      </div>

      {/* Advanced filters — bottom sheet (replaces the old inline horizontal-
          scroll bar, which ate mobile width). Same control on every breakpoint
          so behaviour is predictable; chips wrap instead of side-scrolling. */}
      <Sheet open={m.filterOpen} onOpenChange={m.setFilterOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto p-4">
          <SheetTitle className="text-h4">{t(lang, "filter")}</SheetTitle>

          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <FilterChips
                filters={allFilterDefs}
                selected={m.filters}
                onChange={m.handleFilterChange}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-meta shrink-0">{t(lang, "priceLabel")}</span>
              <Input
                type="number"
                placeholder={t(lang, "min")}
                className="surface-1 h-10 w-24 border-[var(--p-hair)] px-2 tabular-nums placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
                value={m.minPrice}
                onChange={(e) => { m.setMinPrice(e.target.value); m.setPage(1) }}
                min={0}
              />
              <span className="text-meta">–</span>
              <Input
                type="number"
                placeholder={t(lang, "max")}
                className="surface-1 h-10 w-24 border-[var(--p-hair)] px-2 tabular-nums placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
                value={m.maxPrice}
                onChange={(e) => { m.setMaxPrice(e.target.value); m.setPage(1) }}
                min={0}
              />
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[var(--p-hair)] pt-3">
              {m.activeFilterCount > 0 ? (
                <button
                  onClick={m.clearAllFilters}
                  className="ease-chrome flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                  {t(lang, "clearAll")}
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={() => m.setFilterOpen(false)}
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {t(lang, "applyFilters")}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Content: Table or Grid */}
      {m.viewMode === "table" ? (
        <MarketTable
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
        <div className={cn("p-4", m.isPending && "opacity-50 transition-opacity")}>
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
