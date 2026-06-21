import type { ReactNode } from "react";

import { Surface, type SurfaceProps } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title?: ReactNode;
  description?: ReactNode;
  /** Right-aligned actions in the header row (links, buttons, filters). */
  actions?: ReactNode;
  /** Heading element. Defaults to `h2`. */
  as?: "h2" | "h3" | "h4";
  /** Visual variant for the surface. Defaults to `panel`. */
  variant?: SurfaceProps["variant"];
  /** Apply the primary stripe accent above the header. */
  accent?: boolean;
  /** Body padding. Defaults to `lg` (20px). */
  padding?: SurfaceProps["padding"];
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  children: ReactNode;
}

const HEADING_CLASS: Record<NonNullable<SectionCardProps["as"]>, string> = {
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
};

/**
 * `Surface` (panel) + structured header + body.
 *
 * Replaces the recurring `<div className="panel"><div className="px-5 py-4
 * border-b">…title…</div><div className="p-5">…</div></div>` pattern across
 * home / portfolio / market-overview / admin / public profile.
 *
 * Use the looser `<Section />` primitive when you only want a heading row
 * without any surface chrome.
 */
export function SectionCard({
  title,
  description,
  actions,
  as: Heading = "h2",
  variant = "panel",
  accent = false,
  padding = "lg",
  className,
  bodyClassName,
  headerClassName,
  children,
}: SectionCardProps) {
  const showHeader = Boolean(title || description || actions);

  return (
    <Surface
      variant={variant}
      padding="none"
      className={cn(accent && "", className)}
    >
      {showHeader && (
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-3 border-b border-[var(--p-hair)] px-5 py-4",
            headerClassName,
          )}
        >
          <div className="min-w-0">
            {title && (
              <Heading className={HEADING_CLASS[Heading]}>{title}</Heading>
            )}
            {description && <p className="page-subtitle">{description}</p>}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      <div
        className={cn(
          padding === "none" && "p-0",
          padding === "sm" && "p-3",
          padding === "md" && "p-4",
          padding === "lg" && "p-5",
          padding === "xl" && "p-6",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </Surface>
  );
}
