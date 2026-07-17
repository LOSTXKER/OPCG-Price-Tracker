"use client";

import { ArrowDown, ArrowUp, TrendingUpDown } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

import type { ChangePeriod } from "./watchlist-types";

/** Compact range control kept beside the result count, where its effect is visible. */
export function WatchlistPeriodControl({
  period,
  onPeriodChange,
}: {
  period: ChangePeriod;
  onPeriodChange: (period: ChangePeriod) => void;
}) {
  const lang = useUIStore((s) => s.language);

  return (
    <SegmentedControl<ChangePeriod>
      options={(["24h", "7d", "30d"] as const).map((value) => ({
        value,
        label: value,
      }))}
      value={period}
      onChange={onPeriodChange}
      size="sm"
      variant="pill"
      leadingIcon={TrendingUpDown}
      ariaLabel={t(lang, "pricePeriod")}
      className="shrink-0"
    />
  );
}

/**
 * Desktop-only row-3 left slot — replaces the count line + period control
 * (the table already has 24H/7D/30D columns). Computed over ALL watched
 * cards for the active period, not the filtered/sorted view.
 */
export function WatchlistPulseText({
  itemCount,
  upCount,
  downCount,
}: {
  itemCount: number;
  upCount: number;
  downCount: number;
}) {
  const lang = useUIStore((s) => s.language);

  return (
    <p className="shrink-0 text-body-sm tabular-nums" aria-live="polite">
      <span className="text-muted-foreground">
        {t(lang, "watchlistTracking")} {itemCount.toLocaleString()} {t(lang, "cardUnit")}
      </span>
      <span className="mx-1.5 text-muted-foreground/30">·</span>
      <span className="inline-flex items-center gap-0.5 font-medium text-price-up">
        <ArrowUp className="size-3" aria-hidden />
        {upCount.toLocaleString()}
      </span>
      <span className="mx-1.5 text-muted-foreground/30">·</span>
      <span className="inline-flex items-center gap-0.5 font-medium text-price-down">
        <ArrowDown className="size-3" aria-hidden />
        {downCount.toLocaleString()}
      </span>
    </p>
  );
}
