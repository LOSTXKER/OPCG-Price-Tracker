"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared shell for the three public-profile tab bodies (Listings / Collection
 * / Reviews). Wraps the toolbar + body in a single soft-bordered panel so
 * the page reads as one cohesive section instead of several floating bands,
 * and gives every tab a consistent header rhythm:
 *
 *   <Title>           <trailing slot — e.g. "view all" link>
 *   <muted meta line>
 *   ─────────────────────────────────────────
 *   {children}
 *
 * The panel intentionally uses a soft `bg-card/30` (not the full `.panel`
 * class) so it sits one step behind the inner cards/tiles in visual weight
 * — content stays the hero, the panel just holds it together.
 */
export function TabSection({
  title,
  meta,
  trailing,
  headerExtra,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  /** Small muted line under the title (e.g. "1 รายการ · ฿268,758"). */
  meta?: ReactNode;
  /** Right-aligned slot in the header row (e.g. "View all on marketplace"). */
  trailing?: ReactNode;
  /**
   * Optional row that renders below the header (above the body). Useful for
   * featured chips, summary highlights, etc., that aren't part of the title
   * line itself.
   */
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHeader = title != null || meta != null || trailing != null;

  return (
    <section
      className={cn(
        // Match the rest of the site's panel rhythm — `panel` (warm card
        // surface + soft shadow) topped with `panel-accent` (2px primary
        // stripe) so the profile body docks visually with the home market
        // overview, portfolio, etc.
        "panel panel-accent p-4 md:p-5",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            {title != null && (
              <h2 className="section-heading text-h4">{title}</h2>
            )}
            {meta != null && (
              <p
                className={cn(
                  // When there's no title, the meta line is the section
                  // anchor — give it the same accent stripe so the panel
                  // still reads as a labelled section. Otherwise we just
                  // pad it to align under the title.
                  title == null
                    ? "section-heading text-sm font-medium text-foreground/80"
                    : "mt-0.5 pl-3 text-meta",
                )}
              >
                {meta}
              </p>
            )}
          </div>
          {trailing != null && <div className="shrink-0">{trailing}</div>}
        </header>
      )}

      {headerExtra != null && (
        <div className={cn(hasHeader && "mt-3")}>{headerExtra}</div>
      )}

      <div
        className={cn(
          (hasHeader || headerExtra != null) && "mt-4",
          "space-y-4",
          bodyClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
