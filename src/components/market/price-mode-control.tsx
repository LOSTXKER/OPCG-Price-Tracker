"use client"

import { useEffect, useRef } from "react"

import { SegmentedControl } from "@/components/ui/segmented-control"
import { t } from "@/lib/i18n"
import {
  GLOBAL_GRADE_TIERS,
  type GradeKey,
  type GradeTier,
} from "@/lib/pricing/grade-tiers"
import { cn } from "@/lib/utils"
import { useUIStore } from "@/stores/ui-store"

type LegacyPriceMode = "raw" | "psa10"

const LEGACY_GRADE_TIERS = GLOBAL_GRADE_TIERS.filter(
  (tier) => tier.key === "raw" || tier.key === "psa_10",
)

/**
 * Canonical site-wide grade selector. Every grade remains visible in one
 * horizontally scrollable button rail while the shared SegmentedControl
 * preserves radiogroup keyboard behavior.
 */
function GradeRail({
  tiers,
  value,
  onChange,
  className,
}: {
  tiers: readonly GradeTier[]
  value: GradeKey
  onChange: (grade: GradeKey) => void
  className?: string
}) {
  const lang = useUIStore((s) => s.language)
  const railRef = useRef<HTMLDivElement>(null)
  const options = tiers.map((tier) => ({
    value: tier.key,
    label: tier.label,
    ariaLabel: tier.label,
  }))

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    let frame = 0
    const centerActive = (behavior: ScrollBehavior) => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const active = rail.querySelector<HTMLButtonElement>(
          '[role="radio"][aria-checked="true"]',
        )
        if (!active || rail.scrollWidth <= rail.clientWidth) return

        const centered =
          active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2
        const maxScroll = rail.scrollWidth - rail.clientWidth
        rail.scrollTo({
          left: Math.min(maxScroll, Math.max(0, centered)),
          behavior,
        })
      })
    }

    centerActive(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    )

    // The same rail is full-width on mobile but may sit in a narrow desktop
    // sidebar. Keep the chosen grade visible when that container changes size.
    const resizeObserver = new ResizeObserver(() => centerActive("auto"))
    resizeObserver.observe(rail)

    return () => {
      resizeObserver.disconnect()
      window.cancelAnimationFrame(frame)
    }
  }, [value])

  return (
    <div
      ref={railRef}
      data-grade-control
      className={cn(
        "no-sb w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain pb-px sm:w-56 lg:w-auto",
        className,
      )}
    >
      <SegmentedControl<GradeKey>
        size="sm"
        compactVisual
        className="w-max shrink-0 md:max-lg:h-11! md:max-lg:bg-transparent! md:max-lg:p-0! md:max-lg:before:block! md:max-lg:[&_[role=radio]]:h-11! md:max-lg:[&_[role=radio]]:min-w-11! md:max-lg:[&_[role=radio]]:before:block! md:max-lg:[&_[role=radio][aria-checked=true]]:bg-transparent!"
        ariaLabel={t(lang, "chooseGrade")}
        options={options}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

export function GradeControl({
  value,
  onChange,
  className,
}: {
  value: GradeKey
  onChange: (grade: GradeKey) => void
  className?: string
}) {
  return (
    <GradeRail
      tiers={GLOBAL_GRADE_TIERS}
      value={value}
      onChange={onChange}
      className={className}
    />
  )
}

/**
 * @deprecated Migrate callers to `GradeControl` + `GradeKey`. This adapter only
 * exists so in-flight Raw/PSA 10 consumers remain source-compatible.
 */
export function PriceModeControl({
  value,
  onChange,
}: {
  value: LegacyPriceMode
  onChange: (mode: LegacyPriceMode) => void
}) {
  return (
    <GradeRail
      tiers={LEGACY_GRADE_TIERS}
      value={value === "raw" ? "raw" : "psa_10"}
      onChange={(grade) => onChange(grade === "raw" ? "raw" : "psa10")}
    />
  )
}
