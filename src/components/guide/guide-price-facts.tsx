import Link from "next/link";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

export type GuidePriceFact = {
  id: string;
  /** What this column is, e.g. "SEC" or "ปกติ". */
  label: string;
  /**
   * Pre-formatted price string. Callers format via `@/lib/guide/price-format`
   * so the `฿` glyph stays out of `.tsx` files and off the display-currency
   * allowlist — see the note in that module.
   */
  value: string;
  /** Supporting line: card name, sample size, "จาก N ใบ". */
  sub?: ReactNode;
  /** Links the whole column to the card/set it came from. */
  href?: string;
  /** Accent for the value, e.g. a rarity colour. Falls back to foreground. */
  color?: string;
};

/**
 * A row of real prices pulled from the catalogue — the antidote to a guide
 * sentence like "SEC cards go for tens of thousands of baht" that was typed by
 * hand once and quietly went stale.
 *
 * Every number here must come from a query. If the query returns nothing, the
 * caller hides the block rather than rendering placeholders: a guide that
 * invents prices is worse than a guide that stays quiet.
 */
export function GuidePriceFacts({
  facts,
  eyebrow,
  snapshot,
  className,
}: {
  facts: GuidePriceFact[];
  eyebrow?: string;
  /** Freshness stamp from `formatPriceSnapshot`. */
  snapshot?: string | null;
  className?: string;
}) {
  if (facts.length === 0) return null;

  return (
    <Surface variant="outline" className={cn("overflow-hidden", className)}>
      {eyebrow && <div className="border-b border-hair px-4 py-2 text-eyebrow">{eyebrow}</div>}
      <div
        className={cn(
          "grid grid-cols-1 divide-y divide-hair sm:divide-x sm:divide-y-0",
          facts.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
        )}
      >
        {facts.map((fact) => {
          const body = (
            <>
              <p className="text-eyebrow">{fact.label}</p>
              <p
                className="mt-1 font-mono text-lg font-bold"
                style={fact.color ? { color: fact.color } : undefined}
              >
                {fact.value}
              </p>
              {fact.sub && <p className="mt-0.5 text-meta">{fact.sub}</p>}
            </>
          );

          return fact.href ? (
            <Link
              key={fact.id}
              href={fact.href}
              className="block p-4 text-center motion-base hover:bg-muted/50"
            >
              {body}
            </Link>
          ) : (
            <div key={fact.id} className="p-4 text-center">
              {body}
            </div>
          );
        })}
      </div>
      {snapshot && <div className="border-t border-hair px-4 py-2 text-meta">{snapshot}</div>}
    </Surface>
  );
}
