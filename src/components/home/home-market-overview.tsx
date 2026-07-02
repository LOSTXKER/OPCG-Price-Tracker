"use client"

import {
  LayoutGrid,
  List,
  SlidersHorizontal,
  TrendingUpDown,
  X,
} from "lucide-react"

import { useEffect, useMemo, useRef, useState } from "react"

import { FilterChips, type FilterDefinition } from "@/components/shared/filter-chips"
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker"
import { AdSlot } from "@/components/ads/ad-slot"
import { Input } from "@/components/ui/input"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
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

  // Filter surface is breakpoint-aware: a bottom sheet on mobile (thumb-reachable),
  // an anchored popover on desktop (md+). `filterOpen` drives both; only the one
  // matching the current breakpoint renders, so they never open together.
  const [isDesktop, setIsDesktop] = useState(false)
  const filterAnchorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // Desktop popover: close on outside click / Escape.
  useEffect(() => {
    if (!isDesktop || !m.filterOpen) return
    function onPointerDown(e: MouseEvent) {
      if (filterAnchorRef.current && !filterAnchorRef.current.contains(e.target as Node)) {
        m.setFilterOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") m.setFilterOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isDesktop, m])

  const filterBody = (
    <div className="space-y-4">
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
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground motion-base hover:opacity-90"
        >
          {t(lang, "applyFilters")}
        </button>
      </div>
    </div>
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
        <div className="flex items-center gap-1 border-b border-[var(--p-hair)] px-3 sm:px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => m.handleTabChange(tab.id)}
              className={cn(
                "ease-chrome relative -mb-px shrink-0 border-b-2 px-2.5 py-2.5 text-xs font-semibold",
                m.activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 2: set picker (left) + display controls (right) — one line on
            every breakpoint (set picker flexes, controls keep natural width) */}
        <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
          {/* Set picker — flexes to fill on mobile, fixed 200px on sm+ */}
          {sets.length > 0 && (
            <div className="min-w-0 flex-1 sm:flex-none sm:w-[200px]">
              <SetPicker
                sets={sets}
                selectedCode={selectedSets[0] ?? null}
                onSelect={(code) => m.handleFilterChange("set", code ? [code] : [])}
                variant="inline"
                nullable
              />
            </div>
          )}

          {/* Display controls: price lens · divider · filter · view */}
          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:ml-auto">
            <PriceModeControl
              value={m.priceMode}
              onChange={(mode) => { m.setPriceMode(mode); m.setPage(1) }}
            />

            <div className="hidden h-5 w-px bg-border/40 sm:block" />

            <div ref={filterAnchorRef} className="relative">
              <button
                type="button"
                onClick={() => m.setFilterOpen((o) => !o)}
                className={cn(
                  "ease-chrome flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  m.filterOpen || m.activeFilterCount > 0
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden md:inline">{t(lang, "filter")}</span>
                {m.activeFilterCount > 0 && (
                  <span className="flex size-4.5 items-center justify-center rounded-full bg-primary/15 text-micro text-primary">
                    {m.activeFilterCount}
                  </span>
                )}
              </button>

              {/* Desktop (md+): anchored popover under the button */}
              {isDesktop && m.filterOpen && (
                <div
                  role="dialog"
                  aria-label={t(lang, "filter")}
                  className="ease-chrome absolute right-0 top-full z-40 mt-2 w-[min(520px,calc(100vw-2rem))] origin-top-right rounded-xl border border-[var(--p-hair)] bg-popover p-4 shadow-xl"
                >
                  <p className="text-h4 mb-3">{t(lang, "filter")}</p>
                  {filterBody}
                </div>
              )}
            </div>

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
      </div>

      {/* Advanced filters — centered dialog on mobile (owner vetoed bottom
          sheets app-wide). On md+ the same controls render in the anchored
          popover above, so the dialog is gated to `!isDesktop`. */}
      <Dialog open={m.filterOpen && !isDesktop} onOpenChange={m.setFilterOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto p-4">
          <DialogTitle className="text-h4">{t(lang, "filter")}</DialogTitle>
          <div className="mt-2">{filterBody}</div>
        </DialogContent>
      </Dialog>

      {/* Content: Table or Grid */}
      {m.viewMode === "table" ? (
        <MarketTable
          surface="canvas"
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
