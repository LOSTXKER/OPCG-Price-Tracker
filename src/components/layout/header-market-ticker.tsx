"use client";

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
  /** The search field. It rides in this row, ahead of upgrade (owner call
   *  2026-08-29): the row already says WHAT catalog you are looking at, so the
   *  way to search inside it belongs here too — and the nav row below is left
   *  to hold everything that is yours. */
  searchSlot?: ReactNode;
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
  secondary?: "lg" | "xl" | "2xl";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "shrink-0 items-baseline gap-1.5 whitespace-nowrap",
        secondary === "lg" && "hidden lg:flex",
        secondary === "xl" && "hidden xl:flex",
        secondary === "2xl" && "hidden 2xl:flex",
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
  searchSlot,
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
      {/* ONE row, not two (owner call 2026-08-29, navbar D2): the catalog scope
          the visitor is browsing leads the row, the market figures and the
          movers rail follow it, and account closes it. Folding the old brand
          row into this strip is what buys the page 28px back — the brand mark
          now leads the nav row below instead. */}
      <div
        data-slot="ticker-strip"
        className="hairline-b flex h-12 items-center gap-3 overflow-hidden px-6 lg:px-8"
      >
        {/* Global catalog scope: Game → Set. It stays available on every route
            and now opens the row, because everything to its right — the totals
            and the movers — is the market it scopes. */}
        <HeaderCatalogControl
          game={game}
          sets={sets}
          loading={setsLoading}
          error={setsError}
          onRetry={onSetsRetry}
          presentation="desktop"
        />

        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

        {/* Figures are text, not chips (แบบ C, 2026-08-28). Two of the five
            fold away entirely in this one-row layout: the set count is already
            implied by the set control on the left, and the update date is the
            least glanced-at of the five — the rail needs their width more. */}
        {/* With search now sharing this row, the two supporting figures step
            back on narrower desktops so the movers rail keeps a readable width
            — measured: without this, the rail collapses to 44px at 1280. The
            total value stays at every width: it is the one figure that is a
            link, and the row's only tie to /market-overview. */}
        {stats.totalCards > 0 && (
          <StripFigure label={t(language, "totalCards")} secondary="2xl">
            {formatCount(stats.totalCards)}
          </StripFigure>
        )}

        {stats.totalValue > 0 && (
          <Link
            href={`/${game}/market-overview`}
            className="group hidden shrink-0 items-baseline gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 xl:flex"
          >
            <span className="text-meta">{t(language, "totalValue")}</span>
            <span className="ease-chrome text-xs font-semibold tabular-nums text-foreground transition-colors group-hover:text-primary">
              <Price jpy={stats.totalValue} />
            </span>
          </Link>
        )}

        <StripFigure label="JPY/THB" secondary="2xl">
          {stats.exchangeRate.toFixed(3)}
        </StripFigure>

        {/* The cards that actually moved scroll here, where green/red is earned
            (VISION §1) because those numbers really are gains and losses. */}
        <HeaderTickerMarquee movers={stats.movers} />

        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

        {/* Search closes the catalog row, just ahead of upgrade. */}
        {searchSlot}

        {/* Upgrade is the last thing in the row. Below `lg` it yields first —
            it is the only item here that is also a row in the profile menu
            ("อัปเกรดแพ็กเกจ"), so nothing becomes unreachable. */}
        {authLoaded && authUser && canUpgrade && (
          <Link
            href="/pricing"
            className="ease-chrome hidden min-h-11 shrink-0 items-center gap-1 rounded-full border border-primary/30 px-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 lg:flex lg:h-8 lg:min-h-0"
          >
            <Zap className="size-3" />
            {t(language, "upgrade")}
          </Link>
        )}
      </div>
    </div>
  );
}
