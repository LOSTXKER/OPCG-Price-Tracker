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
  const toggle = useCompareStore((s) => s.toggle)

  if (variant === "label") {
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
            ? "border-blue-500/40 bg-blue-500/10 text-blue-500"
            : "border-border text-muted-foreground hover:border-blue-400/40 hover:bg-blue-500/5 hover:text-blue-400",
          className
        )}
      >
        {selected ? <Check className="size-3.5" /> : <Scale className="size-3.5" />}
        {selected ? t(lang, "removeFromCompare") : t(lang, "addToCompare")}
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
          ? "text-blue-400 hover:text-blue-500"
          : "text-muted-foreground/40 hover:text-blue-400",
        className
      )}
      aria-label={selected ? t(lang, "removeFromCompare") : t(lang, "addToCompare")}
    >
      <Scale className={cn(iconSize, selected && "fill-current")} />
    </button>
  )
}
