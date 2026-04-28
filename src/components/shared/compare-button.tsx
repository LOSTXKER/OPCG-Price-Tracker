"use client"

import { Check, Scale } from "lucide-react"
import { useCompareStore, type CompareItem } from "@/stores/compare-store"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function CompareButton({
  item,
  size = "sm",
  variant = "icon",
  className,
}: {
  item: CompareItem
  size?: "sm" | "md"
  variant?: "icon" | "label"
  className?: string
}) {
  const lang = useUIStore((s) => s.language)
  const selected = useCompareStore((s) => s.items.some((i) => i.cardCode === item.cardCode))
  const totalSelected = useCompareStore((s) => s.items.length)
  const toggle = useCompareStore((s) => s.toggle)

  if (variant === "label") {
    const baseLabel = selected
      ? t(lang, "removeFromCompare")
      : t(lang, "addToCompare")
    const showCount = !selected && totalSelected > 0
    const label = showCount
      ? t(lang, "compareWithCount").replace("{n}", String(totalSelected))
      : baseLabel
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggle(item)
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
          selected
            ? "border-primary/40 bg-primary/10 text-primary"
            : showCount
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
          className
        )}
      >
        {selected ? <Check className="size-3.5" /> : <Scale className="size-3.5" />}
        {label}
      </button>
    )
  }

  const iconSize = size === "sm" ? "size-3.5" : "size-5"

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggle(item)
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
        selected
          ? "text-primary hover:text-primary/80"
          : "text-muted-foreground/40 hover:text-primary",
        className
      )}
      aria-label={selected ? t(lang, "removeFromCompare") : t(lang, "addToCompare")}
    >
      <Scale className={cn(iconSize, selected && "fill-current")} />
    </button>
  )
}
