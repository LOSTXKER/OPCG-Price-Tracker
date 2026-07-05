import { Info, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type GuideCalloutTone = "blue" | "amber" | "rose" | "pink" | "red"

// Static class map — Tailwind can't see interpolated `{tone}-500/20` classes.
const TONE: Record<GuideCalloutTone, { border: string; bg: string; icon: string }> = {
  blue: { border: "border-blue-500/20", bg: "bg-blue-500/5", icon: "text-blue-500" },
  amber: { border: "border-amber-500/20", bg: "bg-amber-500/5", icon: "text-amber-500" },
  rose: { border: "border-rose-500/20", bg: "bg-rose-500/5", icon: "text-rose-500" },
  pink: { border: "border-pink-500/20", bg: "bg-pink-500/5", icon: "text-pink-500" },
  red: { border: "border-red-500/20", bg: "bg-red-500/5", icon: "text-red-500" },
}

/**
 * The Info/Tip callout box shared by the guide subpages. `tone` picks the accent
 * color; the body is passed as children so both single-`<p>` and multi-paragraph
 * variants render identically. Icon defaults to lucide Info.
 */
export function GuideCallout({
  tone,
  icon: Icon = Info,
  children,
}: {
  tone: GuideCalloutTone
  icon?: LucideIcon
  children: ReactNode
}) {
  const c = TONE[tone]
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-4 py-3", c.border, c.bg)}>
      <Icon className={cn("mt-0.5 size-4 shrink-0", c.icon)} />
      {children}
    </div>
  )
}
