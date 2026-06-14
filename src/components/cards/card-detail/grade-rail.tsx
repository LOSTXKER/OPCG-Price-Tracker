"use client"

import { Shield } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { GRADE_TIERS, type GradeDatum, type GradeKey } from "./grades"
import { GradeValue } from "./grade-value"

/**
 * Horizontal grade chip rail (VISION §5.1). Each chip carries its own price so
 * the rail is a price comparison at a glance. Selecting a chip re-prices the
 * whole page; selected = honey outline (soft bg + honey ring). No-data grades
 * are ghosted (disabled), never hidden.
 *
 * Single-select group of aria-pressed buttons (not a fake ARIA tablist).
 * Resting border uses a Tailwind ring (not the unlayered `.hairline`) so the
 * focus-visible ring isn't clobbered.
 */
export function GradeRail({
  data,
  selected,
  onSelect,
  lang,
}: {
  data: Record<GradeKey, GradeDatum>
  selected: GradeKey
  onSelect: (key: GradeKey) => void
  lang: Language
}) {
  return (
    <div className="no-sb -mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5" role="group" aria-label={t(lang, "chooseGrade")}>
      {GRADE_TIERS.map((tier) => {
        const d = data[tier.key]
        const active = tier.key === selected
        const disabled = !d.hasData && !active
        const graded = tier.family !== "raw"
        return (
          <button
            key={tier.key}
            type="button"
            aria-pressed={active}
            aria-label={tier.label}
            disabled={disabled}
            onClick={() => onSelect(tier.key)}
            className={cn(
              "ease-chrome ring-inset flex min-w-[92px] shrink-0 flex-col items-start gap-0.5 rounded-xl px-3 py-2 text-left",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-[var(--p-honey-soft)] text-primary ring-1 ring-primary"
                : "surface-1 ring-1 ring-[var(--p-hair)]",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            <span
              className={cn(
                "flex items-center gap-1 text-micro",
                active ? "text-primary" : "text-foreground",
              )}
            >
              {graded && <Shield className="size-3" aria-hidden />}
              {tier.short}
            </span>
            <GradeValue
              datum={d}
              size="xs"
              className={cn("mt-0.5", active ? "text-primary" : "text-muted-foreground")}
            />
          </button>
        )
      })}
    </div>
  )
}
