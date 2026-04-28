import type { LucideIcon } from "lucide-react"

import { Surface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"

export type StatCardTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"

export interface StatCardProps {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon?: LucideIcon
  iconNode?: React.ReactNode
  /** Visual tone for the icon. Defaults to muted. */
  tone?: StatCardTone
  className?: string
  children?: React.ReactNode
  /**
   * @deprecated Per-card icon color was removed during the minimal-UI sweep.
   * Pass `tone="primary"` instead. Accepted only for backwards-compat with
   * older call sites; ignored visually.
   */
  color?: string
  /**
   * @deprecated Per-card icon background was removed. Accepted but ignored.
   */
  bg?: string
}

/**
 * Compact KPI card.
 *
 * Single source of truth for "label + value + icon" tiles across portfolio,
 * seller dashboard, admin dashboard, and honey overview. Backed by `Surface`
 * (`outline` variant) so radius, border, and hover states match other surfaces.
 *
 * Color discipline: there is **no** per-card color or background. The icon is
 * always `text-muted-foreground` (or `text-primary` when `tone="primary"`) on
 * a neutral `bg-muted/50` chip — the warm-brown theme is the only palette.
 */
export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconNode,
  tone = "default",
  className,
  children,
}: StatCardProps) {
  return (
    <Surface
      variant="outline"
      padding="md"
      className={cn("relative overflow-hidden", className)}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-label text-muted-foreground">{label}</p>
          <p className="mt-1 truncate font-price text-h2 text-foreground">{value}</p>
          {sub && (
            <p className="mt-0.5 truncate text-meta text-muted-foreground/70">{sub}</p>
          )}
        </div>
        {(Icon || iconNode) && (
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              tone === "success" && "bg-success-soft",
              tone === "warning" && "bg-warning-soft",
              tone === "danger" && "bg-danger-soft",
              tone === "info" && "bg-info-soft",
              (tone === "default" || tone === "primary") && "bg-muted/50",
            )}
          >
            {iconNode ?? (
              Icon && (
                <Icon
                  className={cn(
                    "size-[18px]",
                    tone === "primary" && "text-primary",
                    tone === "success" && "text-success",
                    tone === "warning" && "text-warning",
                    tone === "danger" && "text-danger",
                    tone === "info" && "text-info",
                    tone === "default" && "text-muted-foreground",
                  )}
                />
              )
            )}
          </div>
        )}
      </div>
      {children}
    </Surface>
  )
}
