"use client"

import { formatDisplayValue, jpyToDisplayValue, type Currency } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

/** Compact segmented control — chart range + condition filter. Stays compact on
 *  desktop (24px) so a secondary filter never competes with the section heading or
 *  the table data below it, but grows to a 40px touch target on mobile (<md) where a
 *  24px pill is too small to tap reliably. rounded-full pills sit concentric in a
 *  rounded-full track; short chip labels (7D / Raw / PSA), not reading copy. */
export const SEGMENT_TRACK =
  "inline-flex max-w-full flex-wrap items-center gap-0.5 rounded-full bg-foreground/5 p-0.5 ring-1 ring-[var(--p-hair)]"
export const SEGMENT_BTN =
  "ease-chrome inline-flex h-10 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-medium leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:h-6"
export const SEGMENT_ACTIVE = "bg-foreground/10 text-foreground"
export const SEGMENT_IDLE = "text-muted-foreground hover:bg-muted hover:text-foreground"

const GRADE_FILTER_LABEL: Record<string, string> = { psa: "PSA", bgs: "BGS", cgc: "CGC", ars: "ARS" }

/** Localized short label for a grading-family filter value ("raw" → "Raw" i18n). */
export function gradeFilterLabel(lang: Language, g: string): string {
  if (g === "raw") return t(lang, "gradeRaw")
  return GRADE_FILTER_LABEL[g] ?? g.toUpperCase()
}

/** "ตัวอย่าง" pill — flags a feed whose rows are deterministic sample data (not real
 *  scraped / marketplace records). Honesty doctrine: fabricated data is always labelled. */
export function SampleBadge({ lang }: { lang: Language }) {
  return (
    <span className="text-micro rounded-full bg-foreground/[0.06] px-2 py-0.5 font-semibold uppercase text-muted-foreground ring-1 ring-[var(--p-hair)]">
      {t(lang, "sampleLabel")}
    </span>
  )
}

/** Condition facet — segmented pill (mirrors the chart range control). */
export function ConditionFilter({
  grades,
  active,
  onSelect,
  label,
  render,
}: {
  grades: string[]
  active: string
  onSelect: (v: string) => void
  label: string
  render: (v: string) => string
}) {
  const options = ["all", ...grades]
  return (
    <div>
      <p className="text-eyebrow mb-1.5">{label}</p>
      <div role="group" aria-label={label} className={SEGMENT_TRACK}>
        {options.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={active === g}
            onClick={() => onSelect(g)}
            className={cn(SEGMENT_BTN, active === g ? SEGMENT_ACTIVE : SEGMENT_IDLE)}
          >
            {render(g)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** YYYY/MM/DD in UTC — UTC so server + client agree (no hydration drift) and no
 *  `Date.now()` is read (the iso is passed in from the server). */
export function formatFeedDate(iso: string | undefined): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${d.getUTCFullYear()}/${m}/${day}`
}

/** Condition / grade chip — graded gets a boxed chip, raw conditions a quiet label.
 *  text-micro (11px) per the design system: chips/badges are the one place that token is
 *  for (text-label/13px read oversized next to the 13px source/date in the row). */
export function ConditionChip({ condition, graded }: { condition: string; graded: boolean }) {
  return (
    <span
      className={cn(
        "text-micro inline-flex shrink-0 items-center rounded px-1.5 py-0.5 tnum",
        graded ? "surface-2 text-foreground ring-1 ring-[var(--p-hair)]" : "text-muted-foreground",
      )}
    >
      {condition}
    </span>
  )
}

/** Price cell — display-currency headline (¥ secondary line intentionally dropped). */
export function FeedPriceCell({
  jpy,
  currency,
  right = false,
}: {
  jpy: number
  currency: Currency
  right?: boolean
}) {
  return (
    <span className={cn("block", right && "text-right")}>
      <span className="text-price tnum block text-foreground">
        {formatDisplayValue(jpyToDisplayValue(jpy, currency), currency)}
      </span>
    </span>
  )
}
