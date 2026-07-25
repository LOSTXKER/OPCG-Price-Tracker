"use client"

import { Info } from "lucide-react"

import { SegmentedControl } from "@/components/ui/segmented-control"
import { formatDisplayValue, jpyToDisplayValue, type Currency } from "@/lib/utils/currency"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

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
    <span className="text-micro rounded-full bg-foreground/[0.06] px-2 py-0.5 font-semibold uppercase text-muted-foreground ring-1 ring-hair">
      {t(lang, "sampleLabel")}
    </span>
  )
}

/** Full disclosure for simulated rows. The badge alone is too easy to miss and
 *  must never be the only signal that prices, dates, or sellers are fabricated. */
export function SampleDisclosure({
  lang,
  kind,
}: {
  lang: Language
  kind: "sales" | "listings"
}) {
  return (
    <div
      role="note"
      className="mt-3 flex items-start gap-2 rounded-lg bg-foreground/[0.04] px-3 py-2.5 ring-1 ring-hair"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p className="text-body-sm text-foreground">
        {t(lang, kind === "sales" ? "sampleSalesDisclosure" : "sampleListingsDisclosure")}
      </p>
    </div>
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
      <div className="no-sb max-w-full overflow-x-auto">
        <SegmentedControl
          value={active}
          onChange={onSelect}
          options={options.map((value) => ({
            value,
            label: render(value),
          }))}
          size="sm"
          variant="pill"
          ariaLabel={label}
          className="shrink-0"
        />
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
        "text-micro inline-flex shrink-0 items-center rounded-sm px-1.5 py-0.5 tnum",
        graded ? "surface-2 text-foreground ring-1 ring-hair" : "text-muted-foreground",
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
