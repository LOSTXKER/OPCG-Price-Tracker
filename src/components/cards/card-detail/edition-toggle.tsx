"use client"

import { cn } from "@/lib/utils"

export type Edition = "JP" | "EN"

/**
 * Edition (language) segmented control — JP | EN (VISION §5.1 / §3). A second axis
 * above the grade rail. EN is shown disabled with a "soon" chip until EN pricing
 * lands (VISION §6 / V7) — absence is signalled, not hidden.
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
    <div className="surface-2 hairline inline-flex rounded-full p-0.5 text-sm font-semibold">
      <button
        type="button"
        onClick={() => onChange("JP")}
        aria-pressed={value === "JP"}
        className={cn(
          "ease-chrome min-h-9 rounded-full px-3 py-1.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
          value === "JP"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        🇯🇵 JP
      </button>
      <button
        type="button"
        disabled={!enAvailable}
        onClick={() => enAvailable && onChange("EN")}
        aria-pressed={value === "EN"}
        className={cn(
          "ease-chrome inline-flex min-h-9 items-center gap-1 rounded-full px-3 py-1.5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset",
          value === "EN"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
          !enAvailable && "cursor-not-allowed opacity-50 hover:text-muted-foreground",
        )}
      >
        🇬🇧 EN
        {!enAvailable && (
          <span className="text-overlay uppercase text-muted-foreground/60">soon</span>
        )}
      </button>
    </div>
  )
}
