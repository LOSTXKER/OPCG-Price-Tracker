"use client"

import { Fragment, useMemo, useState } from "react"

import { MobileCardItem } from "@/components/home/mobile-card-item"
import type { CardRow, ChangePeriod } from "@/components/home/market-types"
import { CardItem } from "@/components/cards/card-item"
import { GradeControl } from "@/components/market/price-mode-control"
import { FilterModal } from "@/components/shared/filter-modal"
import { SetPicker, type SetPickerItem } from "@/components/shared/set-picker"
import { Pagination } from "@/components/ui/pagination"
import { FilterButton } from "@/components/ui/toolbar"
import { ViewModeControl } from "@/components/ui/view-mode-control"
import { t } from "@/lib/i18n"
import { isRawGrade, type GradeKey } from "@/lib/pricing/grade-tiers"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

import {
  ProtoSortCluster,
  type ProtoSortCol,
  type ProtoSortDir,
} from "./proto-sort-cluster"

const LIST_ROWS = 12

/**
 * The market block both variants share — the 3-row control stack collapsed to
 * 2: row 1 = browse + display decisions (set · filter · view), the sticky
 * column header = price lens (grade rail) + the merged sort/period cluster.
 * All interactivity is local state over the 24 preloaded rows (no /api/cards
 * fetch): grade/period/sort/view/facets work for real, while SetPicker and
 * Pagination are layout demos — the explainer on the page says so.
 */
export function ProtoMarketSection({
  cards,
  totalPages,
  sets,
}: {
  cards: CardRow[]
  totalPages: number
  sets: SetPickerItem[]
}) {
  const lang = useUIStore((s) => s.language)

  const [grade, setGrade] = useState<GradeKey>("raw")
  const [period, setPeriod] = useState<ChangePeriod>("7d")
  const [sortCol, setSortCol] = useState<ProtoSortCol>("price")
  const [sortDir, setSortDir] = useState<ProtoSortDir>("desc")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [selectedSet, setSelectedSet] = useState<string | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [rarities, setRarities] = useState<string[]>([])
  const [variants, setVariants] = useState<string[]>([])

  const rawGrade = isRawGrade(grade)
  const activeFilterCount = rarities.length + variants.length

  const rarityOptions = useMemo(
    () => [...new Set(cards.map((c) => c.rarity))].sort(),
    [cards],
  )

  const handleSort = (col: ProtoSortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortCol(col)
      setSortDir("desc")
    }
  }

  const rows = useMemo(() => {
    let out = cards
    if (rarities.length > 0) out = out.filter((c) => rarities.includes(c.rarity))
    if (variants.length === 1) {
      out = out.filter((c) =>
        variants[0] === "parallel" ? c.isParallel : !c.isParallel,
      )
    }

    const changeOf = (c: CardRow) =>
      period === "7d"
        ? c.priceChange7d
        : period === "30d"
          ? c.priceChange30d
          : c.priceChange24h
    // Graded lenses re-anchor on the PSA 10 price and disable change-sort, so
    // ordering degrades to "grade price, high → low" — same as the live site.
    const valueOf = (c: CardRow) =>
      !rawGrade
        ? (c.psa10PriceUsd ?? null)
        : sortCol === "price"
          ? (c.latestPriceJpy ?? null)
          : changeOf(c)
    const desc = !rawGrade || sortDir === "desc"

    return [...out]
      .sort((a, b) => {
        const av = valueOf(a)
        const bv = valueOf(b)
        if (av == null && bv == null) return 0
        if (av == null) return 1
        if (bv == null) return -1
        return desc ? bv - av : av - bv
      })
      .slice(0, LIST_ROWS)
  }, [cards, rarities, variants, sortCol, sortDir, period, rawGrade])

  const toggle = (
    list: string[],
    set: (next: string[]) => void,
    value: string,
  ) => {
    set(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    )
  }

  const facetChip = (active: boolean) =>
    cn(
      "ease-chrome flex min-h-11 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium md:min-h-0",
      active
        ? "border-primary/40 bg-primary/5 text-primary"
        : "border-hair bg-background text-muted-foreground hover:text-foreground",
    )

  return (
    <section className="mt-6">
      {/* Row 1 — browse + display: which set, which facets, which layout. */}
      <div className="flex items-center gap-2">
        {sets.length > 0 && (
          <div className="min-w-0 flex-1">
            <SetPicker
              sets={sets}
              selectedCode={selectedSet}
              onSelect={setSelectedSet}
              variant="inline"
              nullable
              prominent
              triggerClassName="tap-safe rounded-lg border-primary/25 bg-primary/5 hover:border-primary/35 hover:bg-primary/10 aria-expanded:rounded-b-none aria-expanded:border-primary/35 aria-expanded:bg-primary/10"
            />
          </div>
        )}
        <FilterButton
          aria-label={t(lang, "filter")}
          aria-haspopup="dialog"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen(true)}
          active={filterOpen || activeFilterCount > 0}
          count={activeFilterCount}
          iconOnly={false}
          className="shrink-0"
        >
          {t(lang, "filter")}
        </FilterButton>
        <ViewModeControl
          modes={["table", "grid"]}
          value={viewMode}
          onChange={setViewMode}
        />
      </div>

      {/* Sticky column header — price lens + merged sort/period cluster. The
          -mx-5/px-5 pair keeps its content on the page's one 20px gutter, so
          the sort labels really do end over the price column. */}
      <div className="ease-chrome sticky top-[var(--chrome-h)] z-sticky -mx-5 mt-2.5 flex items-center justify-between gap-2 border-b border-hair bg-background/95 px-5 py-1.5 backdrop-blur-sm">
        <div className="min-w-0 flex-1">
          <GradeControl value={grade} onChange={setGrade} />
        </div>
        <span aria-hidden className="h-4 w-px shrink-0 bg-hair" />
        <ProtoSortCluster
          period={period}
          onPeriodChange={setPeriod}
          sortCol={sortCol}
          sortDir={sortDir}
          onSort={handleSort}
          sortEnabled={rawGrade}
          className="shrink-0"
        />
      </div>

      {viewMode === "table" ? (
        // -mx-4 cancels MobileCardItem's internal px-4, landing row content on
        // the 20px gutter while the active-state wash runs nearly full-bleed.
        <div className="-mx-4 divide-y divide-hair">
          {rows.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              {t(lang, "noData")}
            </p>
          ) : (
            rows.map((card, i) => (
              <Fragment key={card.cardCode}>
                <MobileCardItem
                  card={card}
                  rank={i + 1}
                  grade={grade}
                  changePeriod={period}
                />
                {i === 7 && rows.length > 8 && <AdPlaceholder />}
              </Fragment>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 pt-4">
          {rows.map((card, i) => (
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
                changePeriod={period}
                grade={grade}
                linkSet
              />
              {i === 7 && rows.length > 8 && (
                <div className="col-span-full">
                  <AdPlaceholder inset={false} />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}

      <Pagination
        page={1}
        totalPages={totalPages}
        onPageChange={() => {}}
        className="border-t border-hair py-3"
      />
      <p className="text-center text-meta">
        หน้าเทียบแสดง {LIST_ROWS} อันดับแรกจากข้อมูลจริง —
        ปุ่มแบ่งหน้าเป็นตัวอย่างเลย์เอาต์
      </p>

      <FilterModal
        open={filterOpen}
        onOpenChange={setFilterOpen}
        onReset={() => {
          setRarities([])
          setVariants([])
        }}
        resetDisabled={activeFilterCount === 0}
      >
        <div className="space-y-3.5">
          <div>
            <span className="mb-1.5 block text-eyebrow">
              {t(lang, "rarity")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rarityOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggle(rarities, setRarities, r)}
                  className={facetChip(rarities.includes(r))}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-eyebrow">
              {t(lang, "variant")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(["regular", "parallel"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => toggle(variants, setVariants, v)}
                  className={facetChip(variants.includes(v))}
                >
                  {t(lang, v)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-meta">
            ในหน้าเทียบ ตัวกรองทำงานกับ 24 ใบตัวอย่างเท่านั้น
          </p>
        </div>
      </FilterModal>
    </section>
  )
}

/** Honest stand-in for the home-results-after-8 ad slot — keeps the list's
 *  rhythm without wiring the ads provider into a proto. */
function AdPlaceholder({ inset = true }: { inset?: boolean }) {
  return (
    <div
      className={cn(
        "my-3 flex h-14 items-center justify-center rounded-lg border border-dashed border-hair text-meta",
        inset && "mx-4",
      )}
    >
      ตำแหน่งโฆษณา
    </div>
  )
}
