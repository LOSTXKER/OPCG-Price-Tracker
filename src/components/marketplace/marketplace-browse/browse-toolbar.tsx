"use client"

import { useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { FilterModal } from "@/components/shared/filter-modal"
import { FilterToolbar } from "@/components/shared/filter-toolbar"
import { getGameConfig } from "@/lib/game-config"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

import { CONDITIONS, SORT_OPTIONS, VARIANTS } from "./types"

// Rarity options = BASE only (SEC/SR/R/UC/C/L/SP/TR/DON). No P- variants — the
// version facet below handles regular/parallel instead.
const RARITY_OPTIONS = getGameConfig("opcg")?.rarityFilterOptions ?? []

type SortKey = (typeof SORT_OPTIONS)[number]["value"]

/** Chip group inside the modal. Single-value facets use radio semantics while
 * multi-value facets expose each chip as a pressed toggle. */
function FacetChips({
  options,
  selected,
  onToggle,
  selectionMode = "multiple",
  labelledBy,
  describedBy,
}: {
  options: readonly { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
  selectionMode?: "single" | "multiple"
  labelledBy: string
  describedBy?: string
}) {
  const isSingle = selectionMode === "single"

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role={isSingle ? "radiogroup" : "group"}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {options.map((opt) => {
        const active = selected.includes(opt.value)
        const chipClass = cn(
          "ease-chrome flex min-h-11 items-center rounded-lg border px-3 py-1 text-micro",
          active
            ? "border-primary/40 bg-primary/5 text-primary"
            : "border-hair bg-background text-muted-foreground hover:text-foreground",
        )

        if (isSingle) {
          return (
            <label
              key={opt.value || "all"}
              className={cn(
                chipClass,
                "cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
              )}
            >
              <input
                type="radio"
                name={labelledBy}
                value={opt.value}
                checked={active}
                onChange={() => onToggle(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          )
        }

        return (
          <button
            key={opt.value || "all"}
            type="button"
            onClick={() => onToggle(opt.value)}
            aria-pressed={active}
            className={chipClass}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function BrowseToolbar({
  search,
  onSearchChange,
  onSubmit,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  condition,
  onConditionChange,
  rarities,
  onRaritiesChange,
  variants,
  onVariantsChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  onSubmit: () => void
  sort: string
  onSortChange: (v: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (v: "grid" | "list") => void
  condition: string | null
  onConditionChange: (v: string | null) => void
  rarities: string[]
  onRaritiesChange: (v: string[]) => void
  variants: string[]
  onVariantsChange: (v: string[]) => void
}) {
  const lang = useUIStore((s) => s.language)
  const [showFilters, setShowFilters] = useState(false)
  const [draftCondition, setDraftCondition] = useState<string | null>(condition)
  const [draftRarities, setDraftRarities] = useState<string[]>(rarities)
  const [draftVariants, setDraftVariants] = useState<string[]>(variants)

  // Rarity codes need no translation; version labels come from i18n.
  const rarityOptions = RARITY_OPTIONS.map((r) => ({ value: r.code, label: r.label }))
  const conditionOptions = [
    { value: "", label: t(lang, "mktFilterAll") },
    ...CONDITIONS.map((c) => ({ value: c, label: c })),
  ]
  const variantOptions = VARIANTS.map((v) => ({ value: v, label: t(lang, v) }))

  const activeCount = (condition ? 1 : 0) + rarities.length + variants.length
  const draftCount =
    (draftCondition ? 1 : 0) + draftRarities.length + draftVariants.length

  const toggle = (
    current: string[],
    value: string,
    apply: (v: string[]) => void,
  ) => {
    apply(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    )
  }

  return (
    <>
      <FilterToolbar<SortKey, "grid" | "list">
        search={search}
        onSearchChange={onSearchChange}
        onSubmit={onSubmit}
        searchPlaceholder={t(lang, "mktToolbarSearchPlaceholder")}
        sort={{
          options: SORT_OPTIONS.map((o) => ({
            key: o.value as SortKey,
            label: `${t(lang, o.labelKey)}${"currency" in o ? ` (${o.currency})` : ""}`,
          })),
          activeKey: sort as SortKey,
          onChange: (key) => onSortChange(key),
        }}
        filters={{
          count: activeCount,
          active: showFilters || activeCount > 0,
          open: showFilters,
          onToggle: () => {
            setDraftCondition(condition)
            setDraftRarities(rarities)
            setDraftVariants(variants)
            setShowFilters(true)
          },
          label: t(lang, "filter"),
        }}
        view={{
          value: viewMode,
          onChange: onViewModeChange,
        }}
        cta={
          <Link
            href="/marketplace/create"
            className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
          >
            {t(lang, "listCard")}
          </Link>
        }
      />

      <FilterModal
        open={showFilters}
        onOpenChange={setShowFilters}
        onReset={() => {
          setDraftCondition(null)
          setDraftRarities([])
          setDraftVariants([])
        }}
        resetDisabled={draftCount === 0}
        onApply={() => {
          onConditionChange(draftCondition)
          onRaritiesChange(draftRarities)
          onVariantsChange(draftVariants)
        }}
      >
        <div>
          <span id="marketplace-condition-filter" className="block text-eyebrow">
            {t(lang, "mktFilterCondition")}
          </span>
          <span id="marketplace-condition-filter-hint" className="mb-2 block text-meta">
            {t(lang, "mktFilterConditionHint")}
          </span>
          <FacetChips
            options={conditionOptions}
            selected={[draftCondition ?? ""]}
            onToggle={(v) => setDraftCondition(v || null)}
            selectionMode="single"
            labelledBy="marketplace-condition-filter"
            describedBy="marketplace-condition-filter-hint"
          />
        </div>
        <div>
          <span id="marketplace-rarity-filter" className="mb-1.5 block text-eyebrow">
            {t(lang, "mktFilterRarity")}
          </span>
          <FacetChips
            options={rarityOptions}
            selected={draftRarities}
            onToggle={(v) => toggle(draftRarities, v, setDraftRarities)}
            labelledBy="marketplace-rarity-filter"
          />
        </div>
        <div>
          <span id="marketplace-variant-filter" className="mb-1.5 block text-eyebrow">
            {t(lang, "variant")}
          </span>
          <FacetChips
            options={variantOptions}
            selected={draftVariants}
            onToggle={(v) => toggle(draftVariants, v, setDraftVariants)}
            labelledBy="marketplace-variant-filter"
          />
        </div>
      </FilterModal>
    </>
  )
}
