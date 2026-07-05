"use client";

import {
  useEffect,
  useMemo,
  useState,
  lazy,
  Suspense,
  type CSSProperties,
} from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarRange, LineChart as LineChartIcon, Lock, Scale } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CHART_PERIODS } from "@/lib/constants/chart-periods";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { CardPickerModal } from "@/components/compare/card-picker-modal";
import { useCompareStore } from "@/stores/compare-store";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { MAX_COMPARE } from "@/lib/constants/prices";
import { BRAND_PRIMARY, BRAND_GOLD } from "@/lib/constants/brand";
import { formatJpyAmount, type Currency } from "@/lib/utils/currency";
import { useCompareData, type CompareCard } from "@/hooks/use-compare-data";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { LimitCounter } from "@/components/shared/limit-counter";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { COMPARE_COLS_VAR, CompareSection } from "./_components/compare-section";
import { CardRail } from "./_components/card-rail";
import { CompareDossier } from "./_components/compare-dossier";

const CompareChart = lazy(() =>
  import("./compare-chart").then((m) => ({ default: m.CompareChart }))
);

const FALLBACK_COLORS = [
  BRAND_PRIMARY,
  BRAND_GOLD,
  "#A57E61",
  "#FA999B",
  "#ef4444",
  "#10b981",
];

function useChartColors() {
  const [colors, setColors] = useState(FALLBACK_COLORS);
  useEffect(() => {
    // rAF keeps the DOM read + setState out of the synchronous effect body;
    // fallback colors render for at most one frame.
    const raf = requestAnimationFrame(() => {
      const style = getComputedStyle(document.documentElement);
      const resolved = [
        style.getPropertyValue("--chart-1").trim(),
        style.getPropertyValue("--chart-2").trim(),
        style.getPropertyValue("--chart-3").trim(),
        style.getPropertyValue("--chart-4").trim(),
        style.getPropertyValue("--chart-5").trim(),
        style.getPropertyValue("--primary").trim(),
      ].filter(Boolean);
      if (resolved.length >= 5) setColors(resolved);
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return colors;
}

function findExtremeCode<T extends CompareCard>(
  cards: T[],
  pick: (c: T) => number | null | undefined,
  mode: "min" | "max",
): string | null {
  const valid = cards
    .map((c) => ({ code: c.cardCode, v: pick(c) }))
    .filter((x): x is { code: string; v: number } => x.v != null);
  if (valid.length < 2) return null;
  const target =
    mode === "max"
      ? Math.max(...valid.map((x) => x.v))
      : Math.min(...valid.map((x) => x.v));
  return valid.find((x) => x.v === target)?.code ?? null;
}

export default function CompareClient() {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency) as Currency;
  const priceFormatter = useMemo(
    () => (n: number) => formatJpyAmount(n, currency),
    [currency],
  );
  const storeItems = useCompareStore((s) => s.items);
  const removeFromStore = useCompareStore((s) => s.remove);
  const clearStore = useCompareStore((s) => s.clear);
  const markSeen = useCompareStore((s) => s.markSeen);
  const COLORS = useChartColors();

  // Landing on /compare counts as "checkout" for the cart-style floating
  // bar — from now on, navigating away shouldn't resurrect it on every page.
  useEffect(() => {
    if (storeItems.length > 0) markSeen();
  }, [markSeen, storeItems.length]);

  // Compare is a task-scoped flow: pick cards, view the comparison, done.
  // When the user leaves this page we wipe the selection so it never
  // follows them back to home / card detail / etc. Refresh resets too —
  // the store is in-memory only.
  useEffect(() => {
    return () => {
      useCompareStore.getState().clear();
    };
  }, []);

  const [pickerOpen, setPickerOpen] = useState(false);
  const { limits } = useTierLimits();
  const { openUpgradeDialog } = useUpgradeDialog();

  const codes = useMemo(
    () => storeItems.map((i) => i.cardCode),
    [storeItems],
  );

  const {
    orderedCards,
    chartData,
    lowestPriceCode,
    days,
    setDays,
    loading,
    chartLocked,
    hasChart,
  } = useCompareData(codes);
  // How many columns does this user's tier get them? We always render a
  // lane per tier slot (filled or not) so the layout reflects the package
  // up front — seeing "2 lanes" vs "5 lanes" is itself a plan cue. The
  // absolute cap (MAX_COMPARE) guards unlimited tiers from exploding.
  const tierColumnsTarget = Math.min(
    isFinite(limits.compareCards) ? limits.compareCards : MAX_COMPARE,
    MAX_COMPARE,
  );

  // Always reserve an upgrade lane whenever the tier has a finite cap that
  // sits below the absolute cap — gives the user a constant visual hint of
  // what they could unlock, regardless of how many cards they've added.
  const canUpsell =
    isFinite(limits.compareCards) &&
    tierColumnsTarget < MAX_COMPARE;

  const handleAddClick = () => setPickerOpen(true);
  const handleUpgradeClick = () =>
    openUpgradeDialog({ featureKey: "comparePlus" });

  const winners = useMemo(
    () => ({
      lowestPrice: lowestPriceCode,
      topGain7d: findExtremeCode(orderedCards, (c) => c.change7d, "max"),
      topGain30d: findExtremeCode(orderedCards, (c) => c.change30d, "max"),
      maxPower: findExtremeCode(orderedCards, (c) => c.power, "max"),
      maxCounter: findExtremeCode(orderedCards, (c) => c.counter, "max"),
    }),
    [orderedCards, lowestPriceCode],
  );
  // Total grid columns = max(filled cards, tier lanes) + upgrade teaser
  // when relevant. Every grid on the page (rail + data rows/details) reads
  // this one variable, so lanes never drift across sections.
  const baseLaneCount = Math.max(orderedCards.length, tierColumnsTarget);
  const gridColumnCount = baseLaneCount + (canUpsell ? 1 : 0);
  // Trailing empty columns rendered by every data section so the grid keeps
  // its full width (labels + `—` placeholders) even when cards are missing.
  const placeholderCount = Math.max(gridColumnCount - orderedCards.length, 0);

  const gridStyle = useMemo<CSSProperties>(
    () => {
      // Scale column min/max with the count so few columns breathe and fill
      // the container instead of clustering to the left, while many columns
      // stay compact (close to the card aspect ratio) and allow horizontal
      // scroll on overflow. Mobile still overflows via the `overflow-x-auto`
      // wrappers on each grid — we don't clamp on viewport here.
      // No horizontal scroll: every lane shares the available width with
      // `minmax(0, 1fr)` so the grid always fits the viewport. The `0`
      // floor lets long content (trait strings, names) shrink gracefully
      // instead of forcing the parent to overflow. Max width per lane is
      // capped so a single card on a wide desktop doesn't stretch into a
      // billboard.
      const count = Math.max(gridColumnCount, 1);
      const max =
        count <= 1
          ? 440
          : count === 2
            ? 360
            : count === 3
              ? 280
              : count === 4
                ? 240
                : 220;
      return {
        [COMPARE_COLS_VAR]: `repeat(${count}, minmax(0, ${max}px))`,
      } as CSSProperties;
    },
    [gridColumnCount],
  );

  const headerActions =
    codes.length === 0 ? undefined : (
      <button
        type="button"
        onClick={clearStore}
        className="text-meta motion-base hover:text-foreground"
      >
        {t(lang, "clearAll")}
      </button>
    );

  return (
    <div className="space-y-6 sm:space-y-10" style={gridStyle}>
      <PageHeader
        icon={Scale}
        title={t(lang, "compareCards")}
        breadcrumb={
          <Breadcrumb
            items={[
              { label: t(lang, "home"), href: "/" },
              { label: t(lang, "compareCards") },
            ]}
          />
        }
        badge={
          isFinite(limits.compareCards) ? (
            <LimitCounter current={codes.length} max={limits.compareCards} />
          ) : undefined
        }
        actions={headerActions}
      />

      <CardRail
        cards={orderedCards}
        colors={COLORS}
        lang={lang}
        onRemove={removeFromStore}
        totalLanes={gridColumnCount}
        canUpsell={canUpsell}
        onAddClick={handleAddClick}
        onUpgradeClick={handleUpgradeClick}
      />

      <CompareDossier
        cards={orderedCards}
        placeholderCount={placeholderCount}
        winners={winners}
        priceFormatter={priceFormatter}
        lang={lang}
      />

      <CompareSection
        title={t(lang, "comparePriceChart")}
        action={
          hasChart ? (
            <SegmentedControl
              size="sm"
              variant="pill"
              leadingIcon={CalendarRange}
              options={CHART_PERIODS.map((p) => {
                const locked =
                  isFinite(limits.priceHistoryDays) &&
                  p.days > limits.priceHistoryDays;
                return {
                  value: p.value,
                  label: p.label,
                  locked,
                  ariaLabel: locked ? t(lang, "upgradeToUnlock") : undefined,
                };
              })}
              // Map the current `days` number back to a period token. We
              // round up for any custom value so we never end up with no
              // selection highlighted.
              value={
                CHART_PERIODS.find((p) => p.days === days)?.value ??
                CHART_PERIODS.find((p) => p.days >= days)?.value ??
                "30d"
              }
              onChange={(v) => {
                const next = CHART_PERIODS.find((p) => p.value === v);
                if (!next) return;
                // API caps unlimited tier at 9999 days; pass that for "all"
                // instead of `Infinity` (which would parse to NaN).
                setDays(isFinite(next.days) ? next.days : 9999);
              }}
              onLocked={() =>
                openUpgradeDialog({ featureKey: "priceHistoryExtended" })
              }
              ariaLabel={t(lang, "filter")}
            />
          ) : undefined
        }
      >
        {hasChart && (
          <div className="pt-6 sm:pt-10">
            <Suspense fallback={<Skeleton className="h-[350px] rounded-lg" />}>
              <CompareChart chartData={chartData} cards={orderedCards} colors={COLORS} />
            </Suspense>
          </div>
        )}

        {chartLocked && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Lock className="size-8 text-amber-500/60" />
            <p className="text-meta font-semibold text-foreground">
              {t(lang, "upgradeToUnlock")}
            </p>
            <button
              type="button"
              onClick={() => openUpgradeDialog({ featureKey: "comparePlus" })}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground motion-base hover:bg-primary/90"
            >
              {t(lang, "subscribe")}
            </button>
          </div>
        )}

        {!hasChart && !chartLocked && (
          <div className="pt-6 sm:pt-10">
            <ChartPlaceholder hint={t(lang, "compareEmpty")} />
          </div>
        )}
      </CompareSection>

      {loading && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t(lang, "loading")}
        </div>
      )}

      <CardPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*  Chart placeholder — shown when no cards are selected yet  */
/* ────────────────────────────────────────────────────────── */

/**
 * Quiet empty state for the Price Chart when no cards are picked yet.
 * Avoids fake gridlines or trend lines — those imply data that isn't there.
 * Just a small icon + hint, sized close to the real chart so the section
 * doesn't visibly resize when a card is added.
 */
function ChartPlaceholder({ hint }: { hint: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 py-12 text-center sm:min-h-[240px]">
      <LineChartIcon className="size-7 text-muted-foreground/40" aria-hidden />
      <p className="text-meta text-muted-foreground">{hint}</p>
    </div>
  );
}
