"use client";

import { TrendingUpDown } from "lucide-react";

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
