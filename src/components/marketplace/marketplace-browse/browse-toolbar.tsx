"use client"

import { useState } from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { FilterModal } from "@/components/shared/filter-modal"
import { FilterFacetGroup } from "@/components/shared/filter-facet-group"
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
        <FilterFacetGroup
          label={t(lang, "mktFilterCondition")}
          hint={t(lang, "mktFilterConditionHint")}
          options={conditionOptions}
          values={[draftCondition ?? ""]}
          onToggle={(v) => setDraftCondition(v || null)}
          selectionMode="single"
        />
        <FilterFacetGroup
          label={t(lang, "mktFilterRarity")}
          options={rarityOptions}
          values={draftRarities}
          onToggle={(v) => toggle(draftRarities, v, setDraftRarities)}
        />
        <FilterFacetGroup
          label={t(lang, "variant")}
          options={variantOptions}
          values={draftVariants}
          onToggle={(v) => toggle(draftVariants, v, setDraftVariants)}
        />
      </FilterModal>
    </>
  )
}
