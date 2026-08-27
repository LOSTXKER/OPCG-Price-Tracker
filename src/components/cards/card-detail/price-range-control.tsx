"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { t, type Language } from "@/lib/i18n";

import { RANGE_DAYS, RANGES, type ChartRange } from "./card-chart";

export function isPriceHistoryRangeLocked(
  range: ChartRange,
  maxDays: number,
): boolean {
  return Number.isFinite(maxDays) && RANGE_DAYS[range] > maxDays;
}

/**
 * The 7D/1M/3M/1Y/All selector, with the tier lock on the long ranges.
 *
 * Rendered in the chart and time-based market feeds and bound to the same
 * `range` state, so every control stays in sync while remaining next to the
 * data it governs.
 */
export function PriceRangeControl({
  lang,
  range,
  onRangeChange,
  ariaLabel,
  labels,
  className,
}: {
  lang: Language;
  range: ChartRange;
  onRangeChange: (range: ChartRange) => void;
  ariaLabel?: string;
  /** Optional presentation aliases; values and tier locks still use ChartRange. */
  labels?: Partial<Record<ChartRange, string>>;
  className?: string;
}) {
  const { limits, loaded } = useTierLimits();
  const { openUpgradeDialog } = useUpgradeDialog();

  if (!loaded) return <Skeleton className="h-8 w-52 rounded-full" />;

  return (
    <SegmentedControl<ChartRange>
      options={RANGES.map((option) => {
        const locked = isPriceHistoryRangeLocked(
          option,
          limits.priceHistoryDays,
        );
        return {
          value: option,
          label: labels?.[option] ?? option,
          locked,
          ariaLabel: locked ? t(lang, "upgradeToUnlock") : undefined,
        };
      })}
      value={range}
      onChange={onRangeChange}
      onLocked={() => openUpgradeDialog({ featureKey: "priceHistoryExtended" })}
      size="sm"
      variant="pill"
      ariaLabel={ariaLabel ?? t(lang, "priceHistory")}
      className={className}
    />
  );
}
