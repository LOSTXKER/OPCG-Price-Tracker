"use client"

import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * AdSlot — a first-class, design-system ad unit. Reserved height (no layout
 * shift), inherits the warm tokens (radius/hairline/spacing), and a quiet "Ad"
 * label. Shown only on browse/discovery surfaces — never on card-detail price,
 * portfolio, checkout/escrow, or chat (VISION §4.6). Renders a house promo as
 * the fallback creative; a real Google Ad / sponsored unit drops into the same
 * box.
 */
export function AdSlot({
  format = "banner",
  className,
}: {
  format?: "banner" | "feed"
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 hairline",
        format === "feed" ? "min-h-[88px] py-3" : "min-h-[72px] py-3",
        className,
      )}
      style={{ background: "linear-gradient(120deg,#1b1510,#241a12 60%,#2c2013)" }}
    >
      <span className="absolute right-2 top-2 rounded bg-black/35 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/55 backdrop-blur-sm">
        Ad
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: "var(--p-honey-soft)" }}>
        🍯
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-sm font-bold text-foreground">
          <Sparkles className="size-3.5" style={{ color: "var(--primary)" }} /> Meecard Pro
        </p>
        <p className="truncate text-xs text-muted-foreground">ราคา PSA ทุกเกรด · history เต็ม · ไม่มีโฆษณา</p>
      </div>
      <span className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
        ลอง
      </span>
    </div>
  )
}

/** Native "Featured" badge for promoted marketplace listings (not a banner). */
export function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--p-honey-soft)", color: "var(--primary)" }}>
      <Sparkles className="size-2.5" /> Featured
    </span>
  )
}
