import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
  /**
   * Additional content rendered below the description (e.g. metadata row,
   * "X items · last updated 5m ago", filter chips). Rendered inside the title
   * column so it inherits the same alignment.
   */
  children?: ReactNode;
  className?: string;
  align?: "start" | "center";
  size?: "default" | "sm";
}

/**
 * Unified page header for all routes (user, admin, seller, settings, …).
 *
 * Stick to this instead of hand-rolling a `<h1 class="text-h1">…<p
 * class="mt-1 text-sm text-muted-foreground">…</p>` block — it bakes in the
 * typography tokens (`.text-h1` / `.page-subtitle`) and a consistent layout
 * for icons, badges, action slots, and breadcrumbs.
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  actions,
  breadcrumb,
  children,
  className,
  align = "start",
  size = "default",
}: PageHeaderProps) {
  // `.text-large-title` is the mobile iOS large-title size (34px) and
  // automatically steps back down to the existing `.text-h1` desktop size
  // (32px, ≥768px) via its own media query — desktop is untouched, mobile
  // gets the bigger, bolder page-identity treatment.
  const titleClass = size === "sm" ? "text-h2" : "text-large-title";

  return (
    <div className={cn("mb-6", className)}>
      {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
      <div
        className={cn(
          "flex flex-wrap items-start gap-3",
          align === "center" ? "justify-center text-center" : "justify-between",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            align === "center" && "mx-auto flex-col gap-2",
          )}
        >
          {Icon && (
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg bg-primary/10",
                size === "sm" ? "h-9 w-9" : "h-10 w-10",
              )}
            >
              <Icon className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5", "text-primary")} />
            </div>
          )}
          <div className={cn("min-w-0", align === "center" && "text-center")}>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={titleClass}>{title}</h1>
              {badge}
            </div>
            {description && <p className="page-subtitle">{description}</p>}
            {children}
          </div>
        </div>
        {actions && (
          <div className={cn("flex shrink-0 items-center gap-2", align === "center" && "w-full justify-center")}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
