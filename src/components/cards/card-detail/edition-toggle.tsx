"use client"

import { cn } from "@/lib/utils"

export type Edition = "JP" | "EN"

/**
 * Edition (language) segmented control — JP | EN. EN stays selectable even before
 * pricing lands so the page can show an honest empty state instead of hiding the
 * future edition axis.
 */
export function EditionToggle({
  value,
  onChange,
  enAvailable = false,
}: {
  value: Edition
  onChange: (e: Edition) => void
  enAvailable?: boolean
}) {
  return (
    <div className="surface-2 inline-flex rounded-full p-0.5 text-sm font-semibold ring-1 ring-hair">
      <button
        type="button"
        onClick={() => onChange("JP")}
        aria-pressed={value === "JP"}
        className={cn(
          "ease-chrome min-h-11 rounded-full px-3 py-1.5 md:min-h-9",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
          value === "JP"
            ? "bg-foreground/10 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        JP
      </button>
      <button
        type="button"
        onClick={() => onChange("EN")}
        aria-pressed={value === "EN"}
        className={cn(
          "ease-chrome inline-flex min-h-11 items-center gap-1 rounded-full px-3 py-1.5 md:min-h-9",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
          value === "EN"
            ? "bg-foreground/10 text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        EN
        {!enAvailable && (
          <span className="text-overlay uppercase text-muted-foreground/60">soon</span>
        )}
      </button>
    </div>
  )
}
