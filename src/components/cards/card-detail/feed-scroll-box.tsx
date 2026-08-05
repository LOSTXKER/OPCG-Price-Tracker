import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Caps a feed at roughly five rows and lets the rest scroll inside the block
 * (owner decision, เบส 2026-08-04).
 *
 * Two things this deliberately does NOT do:
 *  - it does not slice the data, so every row still ships in the first HTML
 *    response and a crawler reads the whole feed;
 *  - it does not hide the scrollbar (no `no-sb`), because the bar is the only
 *    signal that there is more below the fifth row.
 *
 * `overscroll-contain` stops a flick inside the box from scrolling the page
 * once the list bottoms out — the nested-scroll trap the market feeds used to
 * avoid by expanding in page flow instead.
 */
export function FeedScrollBox({
  children,
  variant = "table",
  className,
}: {
  children: ReactNode
  /** `table` allows for a sticky header row; `list` is the <sm fallback. */
  variant?: "table" | "list"
  className?: string
}) {
  return (
    <div
      className={cn(
        "overflow-y-auto overscroll-contain",
        // ~5 rows: table rows carry a second line (¥ under ฿) so they run
        // taller than the list rows, and the table also reserves a header.
        variant === "table" ? "max-h-80" : "max-h-72",
        className,
      )}
    >
      {children}
    </div>
  )
}
