"use client"

import { useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { FilterModal } from "@/components/shared/filter-modal"
import { FilterToolbar } from "@/components/shared/filter-toolbar"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

import { CONDITIONS, RARITIES, SORT_OPTIONS } from "./types"

type SortKey = (typeof SORT_OPTIONS)[number]["value"]

/** Chip group inside the modal — multi-select facet. Condition & rarity are both
 *  multi-select in the UI; the container maps them onto the API (condition sends
 *  a value only when exactly one is picked, rarity comma-joins). */
function FacetChips({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={cn(
              "ease-chrome rounded-lg border px-2.5 py-1 text-xs font-medium",
              active
                ? "border-primary/40 bg-primary/5 text-primary"
                : "border-hair bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {opt}
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
  conditions,
  onConditionsChange,
  rarities,
  onRaritiesChange,
}: {
  search: string
  onSearchChange: (v: string) => void
  onSubmit: () => void
  sort: string
  onSortChange: (v: string) => void
  viewMode: "grid" | "list"
  onViewModeChange: (v: "grid" | "list") => void
  conditions: string[]
  onConditionsChange: (v: string[]) => void
  rarities: string[]
  onRaritiesChange: (v: string[]) => void
}) {
  const lang = useUIStore((s) => s.language)
  const [showFilters, setShowFilters] = useState(false)

  const activeCount = conditions.length + rarities.length

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
          options: SORT_OPTIONS.map((o) => ({ key: o.value as SortKey, label: o.label })),
          activeKey: sort as SortKey,
          onChange: (key) => onSortChange(key),
        }}
        filters={{
          count: activeCount,
          active: activeCount > 0,
          onToggle: () => setShowFilters(true),
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
          onConditionsChange([])
          onRaritiesChange([])
        }}
        resetDisabled={activeCount === 0}
      >
        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "mktFilterCondition")}</span>
          <FacetChips
            options={CONDITIONS}
            selected={conditions}
            onToggle={(v) => toggle(conditions, v, onConditionsChange)}
          />
        </div>
        <div>
          <span className="mb-1.5 block text-eyebrow">{t(lang, "mktFilterRarity")}</span>
          <FacetChips
            options={RARITIES}
            selected={rarities}
            onToggle={(v) => toggle(rarities, v, onRaritiesChange)}
          />
        </div>
      </FilterModal>
    </>
  )
}
