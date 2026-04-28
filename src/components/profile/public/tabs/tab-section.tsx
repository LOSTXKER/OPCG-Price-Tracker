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
        // The tab nav directly above already labels this section, so the
        // tab body intentionally drops the `panel-accent` orange stripe
        // and the `section-heading` left bar — both repeat what the active
        // tab is already shouting. We keep a soft card surface so the
        // grid sits on a defined ground without competing with the tabs.
        "rounded-2xl border border-border/50 bg-card/40 p-4 md:p-5",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            {title != null && (
              <h2 className="text-h4">{title}</h2>
            )}
            {meta != null && (
              <p
                className={cn(
                  title == null
                    ? "text-sm font-medium text-foreground/80"
                    : "mt-0.5 text-meta",
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
