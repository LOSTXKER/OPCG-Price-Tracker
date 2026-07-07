"use client"

import { Pencil } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatPct } from "@/lib/utils/currency"

export function AssetEditButton({
  lang,
  onEdit,
}: {
  lang: Language
  onEdit: () => void
}) {
  const label = t(lang, "edit")
  // Ghost icon — no border chrome on every row (minimal pass); aria-label +
  // title carry the name, hover/focus reveal the affordance.
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={label}
      title={label}
      className="tap-safe inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <Pencil className="size-3.5" />
    </button>
  )
}

export function ChangeCell({
  value,
  label,
}: {
  value?: number | null
  label?: string
}) {
  if (value == null)
    return label ? (
      <span className="tabular-nums text-meta text-muted-foreground/60">
        {label} —
      </span>
    ) : (
      <span className="tabular-nums text-xs text-muted-foreground">—</span>
    )
  return (
    <span
      className={cn(
        "tabular-nums text-micro",
        value > 0
          ? "text-price-up"
          : value < 0
            ? "text-price-down"
            : "text-muted-foreground",
      )}
    >
      {label && <span className="mr-0.5 font-sans text-muted-foreground/60">{label}</span>}
      {value > 0 ? "+" : ""}
      {formatPct(value)}%
    </span>
  )
}
