"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Zap } from "lucide-react";

import { Price } from "@/components/shared/price-inline";
import { HeaderCatalogControl } from "@/components/layout/header-catalog-control";
import { HeaderTickerMarquee } from "@/components/layout/header-ticker-marquee";
import type { SetPickerItem } from "@/components/shared/set-picker";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { formatCount } from "@/lib/utils/currency";
import type { MarketStats } from "./header-constants";

interface MarketTickerProps {
  stats: MarketStats;
  game: string;
  sets: readonly SetPickerItem[];
  setsLoading: boolean;
  setsError: boolean;
  onSetsRetry: () => void;
  authLoaded: boolean;
  authUser: object | null;
  canUpgrade: boolean;
  /** Account cluster (chat · notifications · profile, or the guest links). */
  children?: ReactNode;
  /** True once the page is scrolled — chrome goes opaque; at the top it's transparent. */
  scrolled: boolean;
}

/** One market figure on the strip: muted label · bright tabular value — plain
 *  text, never a chip, so nothing up here reads as a button (navbar แบบ C,
 *  owner call 2026-08-28).
 *
 *  `secondary` figures fold away on narrower chrome so the moving half of the
 *  strip always keeps room to read. */
function StripFigure({
  label,
  secondary,
  children,
}: {
  label: string;
  secondary?: "lg" | "xl";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 items-baseline gap-1.5 whitespace-nowrap",
        secondary === "lg" && "hidden lg:flex",
        secondary === "xl" && "hidden xl:flex",
        !secondary && "flex",
      )}
    >
      <span className="text-meta">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-foreground">
        {children}
      </span>
    </span>
  );
}

export function HeaderMarketTicker({
  stats,
  game,
  sets,
  setsLoading,
  setsError,
  onSetsRetry,
  authLoaded,
  authUser,
  canUpgrade,
  children,
  scrolled,
}: MarketTickerProps) {
  const language = useUIStore((s) => s.language);

  return (
    <div
      className={cn(
        "ease-chrome border-b transition-colors",
        scrolled ? "border-hair" : "border-transparent",
      )}
    >
      {/* Market pulse strip — the CMC/CoinGecko anatomy the owner picked
          (แบบ C, 2026-08-28): the figures live on their own hairline band so
          the brand row below stays a brand row. Figures are text, not chips.
          The site-wide totals stay pinned and neutral on the left; the cards
          that actually moved scroll on the right, where green/red is earned
          (VISION §1) because those numbers really are gains and losses. */}
      <div
        data-slot="ticker-strip"
        className="hairline-b flex h-8 items-center gap-4 overflow-hidden px-6 lg:px-8"
      >
        {stats.totalCards > 0 && (
          <StripFigure label={t(language, "totalCards")}>
            {formatCount(stats.totalCards)}
          </StripFigure>
        )}

        {sets.length > 0 && (
          <StripFigure label={t(language, "sets")} secondary="xl">
            {formatCount(sets.length)}
          </StripFigure>
        )}

        {stats.totalValue > 0 && (
          <Link
            href={`/${game}/market-overview`}
            className="group flex shrink-0 items-baseline gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="text-meta">{t(language, "totalValue")}</span>
            <span className="ease-chrome text-xs font-semibold tabular-nums text-foreground transition-colors group-hover:text-primary">
              <Price jpy={stats.totalValue} />
            </span>
          </Link>
        )}

        <StripFigure label="JPY/THB" secondary="lg">
          {stats.exchangeRate.toFixed(3)}
        </StripFigure>

        {stats.updatedLabels && (
          <span className="hidden shrink-0 whitespace-nowrap text-meta xl:inline">
            {t(language, "lastUpdatedLabel")} {stats.updatedLabels[language]}
          </span>
        )}

        <HeaderTickerMarquee movers={stats.movers} />
      </div>

      {/* Brand row — with the figures gone to the strip, this row holds only
          identity (brand · Game → Set) and account. No vertical dividers:
          spacing does the grouping. */}
      <div className="flex h-11 items-center gap-3 px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Meecard"
          className="ease-chrome flex min-h-11 shrink-0 items-center gap-2 rounded-lg pr-1 transition-opacity hover:opacity-80 lg:h-8 lg:min-h-0"
        >
          <Image
            src="/meecard.png"
            alt=""
            width={754}
            height={694}
            className="h-auto w-6 shrink-0 select-none"
            priority
          />
          <span className="hidden text-sm font-bold tracking-tight text-foreground lg:inline">
            Meecard
          </span>
        </Link>

        {/* Global catalog scope: Game → Set. It stays available on every route
            without stealing width from the nav row below. */}
        <HeaderCatalogControl
          game={game}
          sets={sets}
          loading={setsLoading}
          error={setsError}
          onRetry={onSetsRetry}
          presentation="desktop"
        />

        <div className="min-w-0 flex-1" />

        {/* Right — upgrade + account. Below `lg` the standalone upgrade button
            yields first — it is the only item here that is also a row in the
            profile menu ("อัปเกรดแพ็กเกจ"), so nothing becomes unreachable. */}
        <div className="flex shrink-0 items-center gap-2">
          {authLoaded && authUser && canUpgrade && (
            <Link
              href="/pricing"
              className="ease-chrome hidden min-h-11 items-center gap-1 rounded-full border border-primary/30 px-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 lg:flex lg:h-8 lg:min-h-0"
            >
              <Zap className="size-3" />
              {t(language, "upgrade")}
            </Link>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
