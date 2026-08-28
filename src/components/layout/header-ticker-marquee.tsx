"use client";

import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

import { Price } from "@/components/shared/price-inline";
import { baseCardCode } from "@/lib/cards/card-code";
import { getCardName, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { MarketMover } from "./header-constants";

/**
 * The scrolling half of the header strip: cards whose price moved most in 24h.
 *
 * Colour rule (VISION §1): green/red is reserved for real gains and losses, and
 * these ARE real per-card deltas — so they carry it, always paired with an
 * arrow so the meaning survives greyscale and colour blindness. The site-wide
 * figures beside this marquee stay neutral, because a catalog total is not a
 * profit.
 */
export function HeaderTickerMarquee({
  movers,
  className,
}: {
  movers: readonly MarketMover[];
  className?: string;
}) {
  const language = useUIStore((s) => s.language);

  // No data, no empty rail — the strip just keeps its figures.
  if (movers.length === 0) return null;

  const items = movers.map((mover) => {
    const change = mover.priceChange24h ?? 0;
    const up = change > 0;
    const Arrow = up ? ArrowUp : ArrowDown;
    return (
      <Link
        key={mover.cardCode}
        href={`/opcg/cards/${mover.cardCode}`}
        // Two runs of twelve cards ride in this rail on every route. Prefetching
        // all of them would spend the visitor's bandwidth on a browse aid they
        // may never click — the same call the catalog dropdown already makes.
        prefetch={false}
        className="ease-chrome flex shrink-0 items-baseline gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 transition-colors hover:bg-muted/60"
      >
        <span className="text-xs font-medium text-foreground">
          {getCardName(language, mover)}
        </span>
        {/* Readers never see the scraper's printing suffix (owner ruling
            2026-08-08) — the href above keeps the full code. */}
        <span className="text-meta">{baseCardCode(mover.cardCode)}</span>
        {mover.latestPriceJpy != null && mover.latestPriceJpy > 0 && (
          <span className="text-xs font-semibold tabular-nums text-foreground">
            <Price jpy={mover.latestPriceJpy} thb={mover.latestPriceThb} />
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-price text-xs font-semibold tabular-nums",
            up ? "text-price-up" : "text-price-down",
          )}
        >
          <Arrow className="size-3" aria-hidden />
          {up ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </Link>
    );
  });

  return (
    <div
      data-slot="ticker-marquee"
      aria-label={t(language, "marketMovers")}
      className={cn("ticker-viewport min-w-0 flex-1", className)}
    >
      {/* Two identical runs: the keyframe travels exactly -50%, so the second
          run is under the cursor at the moment the first one wraps. The clone
          is aria-hidden so screen readers and the tab order see each card once.
          Hovering pauses the animation (globals.css) so links stay clickable. */}
      <div className="animate-ticker flex w-max items-center">
        <div className="flex items-center gap-1">{items}</div>
        <div className="flex items-center gap-1" aria-hidden>
          {items}
        </div>
      </div>
    </div>
  );
}
