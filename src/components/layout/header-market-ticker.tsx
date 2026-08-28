"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  TrendingUp,
  Zap,
} from "lucide-react";

import { Price } from "@/components/shared/price-inline";
import { HeaderCatalogControl } from "@/components/layout/header-catalog-control";
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
      <div className="flex h-11 items-center gap-3 px-6 lg:px-8">
        {/* The brand opens this row (owner call 2026-08-28), which frees the
            row below to be nav + a search field wide enough to be found. */}
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

        <div className="hidden h-5 w-px shrink-0 bg-border/60 lg:block" aria-hidden />

        {/* Global catalog scope: Game → Set. It stays available on every route
            without adding a third chrome row. */}
        <HeaderCatalogControl
          game={game}
          sets={sets}
          loading={setsLoading}
          error={setsError}
          onRetry={onSetsRetry}
          presentation="desktop"
        />

        <div className="h-5 w-px shrink-0 bg-border/60" aria-hidden />

        {/* Market context remains available and scrolls before it can squeeze
            either global navigation or the right-side actions. */}
        <div className="flex min-h-0 min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden text-muted-foreground [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stats.totalCards > 0 && (
            <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 text-sm lg:h-8">
              <span className="font-medium">{t(language, "totalCards")}</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCount(stats.totalCards)}
              </span>
            </div>
          )}

          {stats.totalValue > 0 && (
            <Link
              href={`/${game}/market-overview`}
              className="group ease-chrome flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 text-sm transition-colors hover:bg-muted lg:h-8"
            >
              <span className="font-medium">{t(language, "totalValue")}</span>
              <span className="font-semibold tabular-nums text-price-up">
                <Price jpy={stats.totalValue} />
              </span>
              <TrendingUp className="size-3 shrink-0 text-price-up opacity-60 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          <div className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-muted/50 px-2.5 text-sm lg:h-8">
            <span className="font-medium">JPY/THB</span>
            <span className="font-semibold tabular-nums text-foreground">
              {stats.exchangeRate.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Right — upgrade + preferences + account. Owner call 2026-08-28:
            search left this strip for the taller primary row, and the account
            cluster (chat · notifications · profile) came up here to sit with
            the other "about me" controls. */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Account moved into this strip, so seven controls now compete for
              one 44px row. Below `lg` the standalone upgrade button yields
              first — it is the only item here that is also a row in the
              profile menu ("อัปเกรดแพ็กเกจ"), so nothing becomes unreachable. */}
          {authLoaded && authUser && canUpgrade && (
            <>
              <Link
                href="/pricing"
                className="ease-chrome hidden min-h-11 items-center gap-1 rounded-full border border-primary/30 px-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 lg:flex lg:h-8 lg:min-h-0"
              >
                <Zap className="size-3" />
                {t(language, "upgrade")}
              </Link>
              <div className="mx-1 hidden h-5 w-px bg-border/60 lg:block" />
            </>
          )}

          {children && (
            <>
              <div className="mx-1 hidden h-5 w-px bg-border/60 sm:block" />
              {children}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
