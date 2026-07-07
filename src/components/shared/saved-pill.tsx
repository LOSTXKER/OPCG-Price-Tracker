import { CircleAlert, CircleCheck } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

// `text-micro` already bundles its own weight; `text-xs` is a bare scale so it
// needs `font-medium` to match the original pills.
const TEXT = { xs: "text-xs font-medium", micro: "text-micro" } as const

/**
 * Transient save-feedback pill (SETTINGS-10) — success (green) or error (red),
 * an icon + a short localized message, fading/zooming in. PRESENTATIONAL ONLY:
 * the parent decides when it mounts/unmounts (the auto-hide timing varies 2–3s
 * per surface). Replaces the per-file Feedback / PrivacyFeedback / FeedbackPill
 * copies.
 */
export function SavedPill({
  kind,
  size = "xs",
  className,
  children,
}: {
  kind: "success" | "error"
  size?: keyof typeof TEXT
  className?: string
  children: ReactNode
}) {
  const Icon = kind === "error" ? CircleAlert : CircleCheck
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 animate-in fade-in zoom-in-95",
        TEXT[size],
        kind === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-success/10 text-success",
        className,
      )}
    >
      <Icon className="size-3" />
      {children}
    </span>
  )
}
