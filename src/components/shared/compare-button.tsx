"use client"

import { Check, Scale } from "lucide-react"
import { useCompareStore, type CompareItem } from "@/stores/compare-store"
import { useUIStore } from "@/stores/ui-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useTierLimits } from "@/hooks/use-tier-limits"
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog"

export function CompareButton({
  item,
  size = "sm",
  variant = "icon",
  className,
}: {
  item: CompareItem
  size?: "sm" | "md"
  /**
   * - `icon`: bare icon button (default — used in tables/headers)
   * - `chip`: square chip with visible surface and large tap target,
   *   for use in card grid action rows.
   * - `label`: full pill button with text (used on detail page)
   * - `ghost`: text-only ghost button
   */
  variant?: "icon" | "chip" | "label" | "ghost"
  className?: string
}) {
  const lang = useUIStore((s) => s.language)
  const selected = useCompareStore((s) => s.items.some((i) => i.cardCode === item.cardCode))
  const totalSelected = useCompareStore((s) => s.items.length)
  const toggle = useCompareStore((s) => s.toggle)
  const { limits } = useTierLimits()
  const { openUpgradeDialog } = useUpgradeDialog()

  /** Add to compare when allowed, or prompt upgrade when at tier limit.
   * We never silently drop the click — the user always sees a response. */
  const handleToggle = () => {
    if (!selected && totalSelected >= limits.compareCards) {
      openUpgradeDialog({ featureKey: "comparePlus" })
      return
    }
    toggle(item)
  }

  if (variant === "ghost") {
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
          handleToggle()
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors",
          selected
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          className,
        )}
      >
        {selected ? <Check className="size-3.5" /> : <Scale className="size-3.5" />}
        {label}
      </button>
    )
  }

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
          handleToggle()
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
          selected
            ? "border-primary/40 bg-primary/10 text-primary"
            : showCount
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
          className,
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
        handleToggle()
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-90",
        variant === "chip"
          ? "h-9 w-9 rounded-md border border-[var(--p-hair)] bg-muted/30 hover:border-primary/50 hover:bg-primary/10"
          : "rounded-sm",
        selected
          ? variant === "chip"
            ? "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15"
            : "text-primary hover:text-primary/80"
          : variant === "chip"
            ? "text-muted-foreground hover:text-primary"
            : "text-muted-foreground/40 hover:text-primary",
        className,
      )}
      aria-label={selected ? t(lang, "removeFromCompare") : t(lang, "addToCompare")}
    >
      <Scale className={cn(iconSize, selected && "fill-current")} />
    </button>
  )
}
