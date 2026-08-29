"use client"

import { TrendingUpDown } from "lucide-react"

import { Fragment, useMemo } from "react"

import { AdInventorySlot } from "@/components/ads/ad-inventory-slot"
import { type FilterDefinition } from "@/components/shared/filter-chips"
import { FilterModal } from "@/components/shared/filter-modal"
import { FilterFacetGroup } from "@/components/shared/filter-facet-group"
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { FilterButton } from "@/components/ui/toolbar"
import { ViewModeControl } from "@/components/ui/view-mode-control"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/utils/currency"
import { getCardTypeLabel, getColorOptions } from "@/lib/constants/card-config"
import { RARITY_HEX } from "@/lib/constants/rarities"
import { useMarketCards } from "@/hooks/use-market-cards"

import { MarketTable } from "@/components/market/market-table"
import { GradeControl } from "@/components/market/price-mode-control"
import { buildMarketColumns } from "@/components/market/market-columns"
import { CardItem, CardItemSkeleton } from "@/components/cards/card-item"
import { MobileSortCluster } from "./mobile-sort-cluster"
import {
  type Tab,
  type TabId,
  type CardRow,
  CHANGE_PERIODS,
  PAGE_SIZE,
} from "./market-types"
import { isRawGrade } from "@/lib/pricing/grade-tiers"

export type { CardRow }

function buildTabs(labels: { all: string; popular: string }): Tab[] {
  return [
    { id: "all", label: labels.all, defaultSort: "price_desc" },
    { id: "popular", label: labels.popular, defaultSort: "views_desc" },
  ]
}

export function HomeMarketScopeControl({
  tabs,
  value,
  onChange,
  ariaLabel,
}: {
  tabs: Tab[]
  value: TabId
  onChange: (value: TabId) => void
  ariaLabel: string
}) {
  return (
    <SegmentedControl<TabId>
      options={tabs.map((tab) => ({ value: tab.id, label: tab.label }))}
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      size="sm"
      compactVisual={false}
      className="no-sb flex w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-hair bg-transparent p-0 px-3 sm:rounded-none sm:p-0 sm:px-4 [&>[role=radio]]:-mb-px [&>[role=radio]]:h-11 [&>[role=radio]]:min-w-0 [&>[role=radio]]:shrink-0 [&>[role=radio]]:rounded-none [&>[role=radio]]:border-b-2 [&>[role=radio]]:border-transparent [&>[role=radio]]:bg-transparent [&>[role=radio]]:px-2.5 [&>[role=radio]]:py-2.5 [&>[role=radio]]:text-xs [&>[role=radio]]:font-semibold [&>[role=radio][aria-checked=true]]:border-primary [&>[role=radio][aria-checked=true]]:bg-transparent"
    />
  )
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

  // ลำดับในกล่องตัวกรอง (เจ้าของงานเคาะ 2026-08-30): ความหายากบนสุด — เป็นสิ่งที่
  // คนเล่นการ์ดกรองก่อนเสมอ · ตามด้วยเวอร์ชันกับลายพิเศษ ซึ่งคู่กันเพราะทั้งคู่บอกว่า
  // "งานพิมพ์ไหนของการ์ดใบเดียวกัน" · ประเภท/สี/ราคาเป็นการกรองกว้าง จึงอยู่ล่างสุด
  const rarityDef = filterDefinitions.find((f) => f.key === "rarity")
  const otherDefs = filterDefinitions.filter((f) => f.key !== "set" && f.key !== "rarity")

  const allFilterDefs: FilterDefinition[] = [
    ...(rarityDef ? [{ ...rarityDef, label: t(lang, "rarity") }] : []),
    {
      key: "variant",
      label: t(lang, "variant"),
      options: [
        { value: "regular", label: t(lang, "regular") },
        { value: "parallel", label: t(lang, "parallel") },
      ],
    },
    {
      key: "artStyle",
      label: t(lang, "artStyle"),
      options: [
        { value: "manga", label: t(lang, "artStyleManga") },
        { value: "mangaRed", label: t(lang, "artStyleMangaRed") },
        { value: "wanted", label: t(lang, "artStyleWanted") },
      ],
    },
    ...otherDefs
      .map((f) => ({
        ...f,
        label: f.key === "type" ? t(lang, "type") : f.label,
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
  const rawGrade = isRawGrade(m.grade)
  const columns = useMemo(() => buildMarketColumns({ showViews: m.showViews }), [m.showViews])
  const showResultsAd = !m.isPending && !m.error && m.cards.length > 8

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
      {/* The word is spelled out at every width (เบส) — a lone slider glyph read
          as decoration, not as "ตัวกรอง". */}
      {showLabel && t(lang, "filter")}
    </FilterButton>
  )

  const renderViewControl = () => (
    <ViewModeControl
      modes={["table", "grid"]}
      value={m.viewMode}
      onChange={m.setViewMode}
    />
  )

  /**
   * The phone list's COLUMN HEADER — and, since 2026-08-29, the phone's price
   * lens too: the grade rail moved up here from its own toolbar row, so the
   * controls above the list went from three stacked rows to two (owner
   * selection from /proto/mobile-home). Left = which price, right = which
   * order, and the sort labels sit over the price column on the same 20px
   * gutter as the rows. It docks under the top chrome while you scroll, for
   * BOTH view modes.
   */
  const mobileListHeader = (m.isPending || m.cards.length > 0) && (
    <div className="ease-chrome sticky top-[var(--chrome-h)] z-sticky -mx-5 flex items-center gap-2 border-b border-hair bg-background/95 px-5 py-1.5 backdrop-blur-sm sm:hidden">
      <div className="min-w-0 flex-1">
        <GradeControl value={m.grade} onChange={m.handleGradeChange} />
      </div>
      <span aria-hidden className="h-4 w-px shrink-0 bg-hair" />
      {/* Column labels, not buttons-shouting: the row reads muted and the ONE
          active sort turns dark, so the eye lands on what's sorted. */}
      <MobileSortCluster
        period={m.changePeriod}
        onPeriodChange={m.handleChangePeriod}
        sortCol={m.sortCol}
        sortDir={m.sortDir}
        onSort={m.handleColumnSort}
        sortEnabled={rawGrade}
        className="shrink-0"
      />
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
        {/* Canonical single-choice scope rail. Its active border overlaps the
            baseline so the compact underline treatment remains unchanged.
            HIDDEN ON PHONES (เบส): "ยอดนิยม" only re-sorts to views_desc and the
            phone row never renders a views number, so the rail spent a full 44px
            band on a signal the user could not see. Price/change sorting is on
            the list header below; the rail returns from `sm` up, where the views
            column actually exists. */}
        <div className="hidden sm:block">
          <HomeMarketScopeControl
            tabs={tabs}
            value={m.activeTab}
            onChange={m.handleTabChange}
            ariaLabel={t(lang, "filter")}
          />
        </div>

        {/* Mobile browse controls — ONE row (owner selection 2026-08-29): the
            set is the primary axis and takes the width, with the two display
            actions beside it. The price lens moved down into the sticky column
            header, which is where the numbers it re-prices actually are.
            No horizontal padding: the page container owns the single 20px
            gutter that the rows, the strip and the sort labels all line up on. */}
        <div className="py-3 sm:hidden">
          <div className="flex items-center gap-2">
            {sets.length > 0 && (
              <div className="min-w-0 flex-1">
                <SetPicker
                  sets={sets}
                  selectedCode={selectedSets[0] ?? null}
                  onSelect={(code) => m.handleFilterChange("set", code ? [code] : [])}
                  variant="inline"
                  nullable
                  prominent
                  /* No h-10 here: it fought SetPicker's own `h-11 sm:h-9` with
                     equal specificity, so the row height depended on stylesheet
                     order and landed at 40px — under the 44px floor. */
                  triggerClassName="tap-safe rounded-lg border-primary/25 bg-primary/5 hover:border-primary/35 hover:bg-primary/10 aria-expanded:rounded-b-none aria-expanded:border-primary/35 aria-expanded:bg-primary/10"
                />
              </div>
            )}

            <div className="shrink-0">{renderFilterTrigger(true)}</div>
            <div className="shrink-0">{renderViewControl()}</div>
          </div>
        </div>

        {/* Desktop/tablet keeps the established single-row toolbar. */}
        <div className="hidden items-center gap-2 px-4 py-2 sm:flex">
          {sets.length > 0 && (
            <div className="w-[15rem] flex-none lg:w-[19rem]">
              <SetPicker
                sets={sets}
                selectedCode={selectedSets[0] ?? null}
                onSelect={(code) => m.handleFilterChange("set", code ? [code] : [])}
                variant="inline"
                nullable
              />
            </div>
          )}

          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5">
            <GradeControl value={m.grade} onChange={m.handleGradeChange} />

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
              <FilterFacetGroup
                key={def.key}
                label={def.label}
                options={def.options.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                  dot: opt.dot,
                  // ความหายากที่เลือกไว้ใช้สีประจำระดับนั้น เหมือนป้ายในตาราง
                  activeColor:
                    def.key === "rarity" ? (RARITY_HEX[opt.value] ?? "#6B7280") : undefined,
                }))}
                values={values}
                onToggle={(value, nextActive) =>
                  m.handleFilterChange(
                    def.key,
                    nextActive ? [...values, value] : values.filter((v) => v !== value),
                  )
                }
              />
            )
          })}
        </div>

        {rawGrade && (
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
        )}
      </FilterModal>

      {mobileListHeader}

      {/* Content: Table or Grid */}
      {m.viewMode === "table" ? (
        <MarketTable
          surface="canvas"
          showMobileSort={false}
          mobileFlush
          cards={m.cards}
          rankOffset={(m.page - 1) * PAGE_SIZE}
          columns={columns}
          grade={m.grade}
          changePeriod={m.changePeriod}
          sparklines={m.sparklines}
          sortCol={m.sortCol}
          sortDir={m.sortDir}
          onColumnSort={m.handleColumnSort}
          isPending={m.isPending}
          skeletonRows={PAGE_SIZE}
          emptyText={t(lang, "noData")}
          insetAfter={showResultsAd ? 8 : undefined}
          mobileInset={
            <AdInventorySlot
              zone="home-results-after-8"
              contentAvailable={showResultsAd}
              className="my-5"
            />
          }
          tableInset={
            <AdInventorySlot
              zone="home-results-after-8"
              contentAvailable={showResultsAd}
              presentation="TABLE_ROW"
              tableColumnCount={columns.length}
            />
          }
        />
      ) : (
        <div className={cn("p-4", m.isPending && "opacity-50 motion-base")}>
          {/* Graded tiles have no real % series, so the period pill hides.
              Phones get the period from the sticky list header above — this copy
              is desktop-only now (it used to render twice on a phone). */}
          {rawGrade && (
            <div className="mb-3 hidden justify-end sm:flex">
              <SegmentedControl
                size="sm"
                variant="pill"
                leadingIcon={TrendingUpDown}
                options={CHANGE_PERIODS.map((p) => ({ value: p, label: p }))}
                value={m.changePeriod}
                onChange={m.handleChangePeriod}
                ariaLabel={t(lang, "pricePeriod")}
              />
            </div>
          )}
          {m.isPending && m.cards.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => <CardItemSkeleton key={i} />)}
            </div>
          ) : m.cards.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t(lang, "noData")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {m.cards.map((card, index) => (
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
                    changePeriod={m.changePeriod}
                    grade={m.grade}
                    linkSet
                  />
                  {index === 7 && (
                    <AdInventorySlot
                      zone="home-results-after-8"
                      contentAvailable={showResultsAd}
                      className="col-span-full my-2 sm:my-4"
                    />
                  )}
                </Fragment>
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
        className="border-t border-hair py-3 sm:px-4"
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
