"use client"

import { useState } from "react"
import {
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { ViewToggle } from "@/components/ui/toolbar"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { getColorOptions } from "@/lib/constants/card-config"
import { useMarketCards } from "@/hooks/use-market-cards"

import { HeroSearchBar } from "./hero-search-bar"
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
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
        <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => m.handleTabChange(tab.id)}
              className={cn(
                "relative shrink-0 rounded-md px-3.5 py-2 text-xs font-semibold transition-all",
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
                "flex size-4.5 items-center justify-center rounded-full text-micro",
                m.filterOpen || m.activeFilterCount > 0
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary/10 text-primary"
              )}>
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

      {/* Row 2: Set dropdown + Search + Price mode */}
      <div className="border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2.5 px-4 py-2.5 sm:gap-3">
          {setOptions.length > 0 && (
            <Select
              items={[
                { value: "__all__", label: t(lang, "allSets") },
                ...setOptions.map((opt) => ({ value: opt.value, label: opt.label })),
              ]}
              value={selectedSets[0] ?? "__all__"}
              onValueChange={(value) =>
                m.handleFilterChange("set", value && value !== "__all__" ? [value] : [])
              }
            >
              <SelectTrigger
                size="sm"
                className="h-10 min-w-0 flex-1 sm:flex-none sm:min-w-[180px]"
              >
                <SelectValue placeholder={t(lang, "allSets")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">{t(lang, "allSets")}</SelectItem>
                {setOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative hidden flex-1 sm:block">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder={t(lang, "searchLong")}
              className="border-border/50 bg-card pl-9 pr-8 placeholder:text-muted-foreground/40 focus-visible:border-primary/50 focus-visible:ring-0"
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

          <Button
            type="button"
            variant={showSearch ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => setShowSearch((v) => !v)}
            className={cn("sm:hidden", !showSearch && "text-muted-foreground")}
            aria-label="Search"
          >
            <Search className="size-4" />
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-eyebrow text-muted-foreground">
              {t(lang, "price")}
            </span>
            <SegmentedControl
              size="sm"
              value={m.priceMode}
              onChange={(value) => { m.setPriceMode(value); m.setPage(1) }}
              options={[
                { value: "raw", label: "Raw" },
                { value: "psa10", label: "PSA 10", icon: Shield },
              ]}
              ariaLabel={t(lang, "price")}
            />
          </div>
        </div>

        {showSearch && (
          <div className="border-t border-border/40 px-4 py-2 sm:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                type="text"
                placeholder={t(lang, "searchLong")}
                className="border-border/50 bg-card pl-9 pr-8 placeholder:text-muted-foreground/40 focus-visible:border-primary/50 focus-visible:ring-0"
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
              <span className="text-meta">{t(lang, "priceLabel")}</span>
              <Input
                type="number"
                placeholder={t(lang, "min")}
                className="h-9 w-20 border-border bg-card px-2 tabular-nums placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
                value={m.minPrice}
                onChange={(e) => { m.setMinPrice(e.target.value); m.setPage(1) }}
                min={0}
              />
              <span className="text-meta">–</span>
              <Input
                type="number"
                placeholder={t(lang, "max")}
                className="h-9 w-20 border-border bg-card px-2 tabular-nums placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/20"
                value={m.maxPrice}
                onChange={(e) => { m.setMaxPrice(e.target.value); m.setPage(1) }}
                min={0}
              />
            </div>

            {m.activeFilterCount > 0 && (
              <button
                onClick={m.clearAllFilters}
                className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-meta transition-colors hover:bg-muted hover:text-foreground"
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
              <tr className="border-b border-border text-eyebrow text-muted-foreground">
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
