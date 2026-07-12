"use client"

import { SegmentedControl } from "@/components/ui/segmented-control"
import { t } from "@/lib/i18n"
import { useUIStore } from "@/stores/ui-store"
import type { PriceMode } from "@/components/home/market-types"

import { MARKET_GRADE_TIERS } from "./market-columns"

/**
 * Grade/price-mode selector for the market table — tier-driven so future grades
 * slot in without touching the toolbar. Only renders tiers backed by real
 * scraped data (`real: true` → Raw + PSA 10); modeled grades stay hidden until a
 * real series exists (see MARKET_GRADE_TIERS). Side effects (page reset) are the
 * caller's job; this stays a pure control.
 */
export function PriceModeControl({
  value,
  onChange,
}: {
  value: PriceMode
  onChange: (mode: PriceMode) => void
}) {
  const lang = useUIStore((s) => s.language)
  const tiers = MARKET_GRADE_TIERS.filter((tier) => tier.real)

  return (
    <SegmentedControl<PriceMode>
      size="sm"
      compactVisual
      className="shrink-0 gap-0 sm:gap-0.5"
      value={value}
      onChange={onChange}
      ariaLabel={t(lang, "price")}
      options={tiers.map((tier) => ({
        value: tier.mode,
        label: tier.label,
        icon: tier.icon,
      }))}
    />
  )
}
