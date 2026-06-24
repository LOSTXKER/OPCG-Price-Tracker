"use client"

import { Pencil } from "lucide-react"

import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { formatPct } from "@/lib/utils/currency"

export function AssetEditButton({
  lang,
  onEdit,
  showLabel = false,
}: {
  lang: Language
  onEdit: () => void
  showLabel?: boolean
}) {
  const label = t(lang, "edit")
  return (
    <button
      type="button"
      onClick={onEdit}
      aria-label={label}
      title={label}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[var(--p-hair)] bg-background/40 px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <Pencil className="size-3.5" />
      {showLabel ? <span>{label}</span> : null}
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
      <span className="font-price text-meta text-muted-foreground/60">
        {label} —
      </span>
    ) : (
      <span className="font-price text-xs text-muted-foreground">—</span>
    )
  return (
    <span
      className={cn(
        "font-price text-micro tabular-nums",
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
