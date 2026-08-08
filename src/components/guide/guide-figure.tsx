import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

/**
 * The "show, don't tell" wrapper for the guide pages.
 *
 * A guide section that *claims* something ("the same card exists in several
 * versions and the prices are worlds apart") should put the evidence on the
 * page right under the claim. This is the frame that evidence sits in: a small
 * eyebrow saying what you're looking at, the exhibit itself (a CardThumbStrip,
 * a diagram, a price trio), and an optional caption carrying the takeaway plus
 * a data-freshness stamp.
 *
 * Deliberately dumb — it owns no data fetching. Callers pass real rows they
 * queried themselves and hide the whole figure when the query came back empty,
 * so a figure is never rendered as an empty box.
 */
export function GuideFigure({
  eyebrow,
  caption,
  snapshot,
  children,
  className,
}: {
  /** Short label above the exhibit, e.g. "ตัวอย่างจริงจากคลังราคา". */
  eyebrow?: string;
  /** Takeaway under the exhibit — what the reader is supposed to notice. */
  caption?: ReactNode;
  /** Data-freshness stamp, e.g. formatPriceSnapshot(...). Rendered muted-est. */
  snapshot?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Surface variant="outline" className={cn("overflow-hidden", className)}>
      {eyebrow && <div className="border-b border-hair px-4 py-2 text-eyebrow">{eyebrow}</div>}
      <div className="p-4">{children}</div>
      {(caption || snapshot) && (
        <div className="border-t border-hair px-4 py-2.5">
          {caption && <p className="text-body-sm leading-relaxed text-muted-foreground">{caption}</p>}
          {snapshot && <p className={cn("text-meta", caption && "mt-1")}>{snapshot}</p>}
        </div>
      )}
    </Surface>
  );
}
