"use client"

import { useEffect, useRef } from "react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { GRADE_TIERS, type GradeDatum, type GradeFamily, type GradeKey } from "./grades"
import { GradeValue } from "./grade-value"
import { GradeLogo } from "./grade-logo"

/**
 * Horizontal grade chip rail (VISION §5.1). Each chip carries its own price so
 * the rail is a price comparison at a glance. Selecting a chip re-prices the
 * whole page; selected = neutral standout (honey stays reserved for transact). No-data grades
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
  families,
  lang,
}: {
  data: Record<GradeKey, GradeDatum>
  selected: GradeKey
  onSelect: (key: GradeKey) => void
  families?: GradeFamily[]
  lang: Language
}) {
  const activeRef = useRef<HTMLButtonElement | null>(null)
  const tiers = families ? GRADE_TIERS.filter((tier) => families.includes(tier.family)) : GRADE_TIERS

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [selected])

  return (
    <div className="scroll-fade-x no-sb -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-0.5" role="group" aria-label={t(lang, "chooseGrade")}>
      {tiers.map((tier) => {
        const d = data[tier.key]
        const active = tier.key === selected
        const disabled = !d.hasData && !active
        const graded = tier.family !== "raw"
        const num = graded ? tier.short.replace(/^(PSA|BGS|CGC)\s*/i, "") : tier.short
        return (
          <button
            key={tier.key}
            ref={active ? activeRef : undefined}
            type="button"
            aria-pressed={active}
            aria-label={tier.label}
            disabled={disabled}
            onClick={() => onSelect(tier.key)}
            className={cn(
              "ease-chrome ring-inset flex min-h-10 min-w-[84px] snap-start flex-col items-start gap-0.5 rounded-xl px-2.5 py-1.5 text-left sm:min-h-11 sm:min-w-[92px] sm:px-3 sm:py-2",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-foreground/15 text-foreground ring-1 ring-foreground/35"
                : "surface-1 ring-1 ring-[var(--p-hair)] text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-40",
            )}
          >
            <span className={cn("flex items-center gap-1 text-micro font-semibold", active ? "text-foreground" : "text-foreground")}>
              {graded && <GradeLogo family={tier.family} />}
              {num}
            </span>
            <GradeValue
              datum={d}
              size="xs"
              className={cn("mt-0.5", active ? "text-foreground" : "text-muted-foreground")}
            />
          </button>
        )
      })}
    </div>
  )
}
