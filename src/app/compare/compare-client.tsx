"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
  type CSSProperties,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarRange, LineChart as LineChartIcon, Lock, Plus, Scale, X } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { PageHeader } from "@/components/layout/page-header";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { CardPickerModal } from "@/components/compare/card-picker-modal";
import { useCompareStore } from "@/stores/compare-store";
import { useUIStore } from "@/stores/ui-store";
import { getCardName, t } from "@/lib/i18n";
import { MAX_COMPARE } from "@/lib/constants/prices";
import { formatJpyAmount, type Currency } from "@/lib/utils/currency";
import { fetchCards } from "@/lib/api/fetch-cards";
import { useCompareData, type CompareCard } from "@/hooks/use-compare-data";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { LimitCounter } from "@/components/shared/limit-counter";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import {
  COMPARE_COLS_VAR,
  ChangeValue,
  CompareDetails,
  CompareFact,
  CompareRow,
  CompareSection,
  NumericCell,
  PriceCell,
} from "./_components/compare-section";

const CompareChart = lazy(() =>
  import("./compare-chart").then((m) => ({ default: m.CompareChart }))
);

const FALLBACK_COLORS = [
  "#73533E",
  "#E0B865",
  "#A57E61",
  "#FA999B",
  "#ef4444",
  "#10b981",
];

function useChartColors() {
  const [colors, setColors] = useState(FALLBACK_COLORS);
  useEffect(() => {
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

  // First-time visitors land on an empty compare store. To avoid a blank
  // page we seed the highest-value card once per mount so the user sees a
  // live example. We respect manual removals (the ref guard stops us from
  // ever re-seeding in the same session).
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (useCompareStore.getState().items.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchCards({ sort: "price_desc", limit: 1 });
        const top = res.cards?.[0];
        if (cancelled || !top) return;
        // Double-check the store is still empty — the user may have added
        // a card while the fetch was in flight; don't clobber their choice.
        if (useCompareStore.getState().items.length > 0) return;
        useCompareStore.getState().toggle({
          cardCode: top.cardCode,
          name: getCardName(lang, top),
          imageUrl: top.imageUrl ?? null,
          rarity: top.rarity,
        });
      } catch {
        /* silent — empty state is an acceptable fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);


  const [pickerOpen, setPickerOpen] = useState(false);
  const { limits } = useTierLimits();
  const tierMax = isFinite(limits.compareCards) ? limits.compareCards : MAX_COMPARE;
  const { openUpgradeDialog } = useUpgradeDialog();

  const codes = useMemo(
    () => storeItems.map((i) => i.cardCode),
    [storeItems]
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
  const showAddSlot = codes.length < tierMax;

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

  // Labels for the Basic Info dossier — kept in one place so the filled
  // column render and the empty-column placeholder stay in sync.
  const basicInfoLabels = useMemo(
    () => [
      t(lang, "set"),
      t(lang, "rarity"),
      t(lang, "type"),
      t(lang, "color"),
      t(lang, "variant"),
      t(lang, "attribute"),
      t(lang, "trait"),
    ],
    [lang],
  );
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
        className="text-meta transition-colors hover:text-foreground"
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

      <CompareSection title={t(lang, "comparePricing")}>
        <CompareRow
          label={t(lang, "price")}
          cards={orderedCards}
          placeholderCount={placeholderCount}
        >
          {(card) => (
            <PriceCell
              value={card.currentPrice}
              winner={card.cardCode === winners.lowestPrice}
              formatter={priceFormatter}
            />
          )}
        </CompareRow>
        <CompareRow
          label={`${t(lang, "change")} 7d`}
          cards={orderedCards}
          placeholderCount={placeholderCount}
        >
          {(card) => (
            <ChangeValue
              value={card.change7d}
              winner={card.cardCode === winners.topGain7d}
            />
          )}
        </CompareRow>
        <CompareRow
          label={`${t(lang, "change")} 30d`}
          cards={orderedCards}
          placeholderCount={placeholderCount}
        >
          {(card) => (
            <ChangeValue
              value={card.change30d}
              winner={card.cardCode === winners.topGain30d}
            />
          )}
        </CompareRow>
      </CompareSection>

      <CompareSection title={t(lang, "compareBasicInfo")}>
        <CompareDetails
          cards={orderedCards}
          placeholderCount={placeholderCount}
          factLabels={basicInfoLabels}
        >
          {(card) => (
            <>
              <CompareFact label={t(lang, "set")}>
                <span className="font-mono">
                  {card.setCode?.toUpperCase() || "—"}
                </span>
              </CompareFact>
              <CompareFact label={t(lang, "rarity")}>
                <RarityBadge rarity={card.rarity} size="sm" />
              </CompareFact>
              <CompareFact label={t(lang, "type")}>
                <span className="capitalize">
                  {card.cardType?.toLowerCase() || "—"}
                </span>
              </CompareFact>
              <CompareFact label={t(lang, "color")}>
                {card.color || "—"}
              </CompareFact>
              <CompareFact label={t(lang, "variant")}>
                {card.isParallel ? t(lang, "parallel") : t(lang, "regular")}
              </CompareFact>
              <CompareFact label={t(lang, "attribute")}>
                {card.attribute ?? "—"}
              </CompareFact>
              <CompareFact label={t(lang, "trait")}>
                <span className="block max-w-full break-words text-balance">
                  {card.trait ?? "—"}
                </span>
              </CompareFact>
            </>
          )}
        </CompareDetails>
      </CompareSection>

      <CompareSection title={t(lang, "compareStats")}>
        <CompareRow
          label={t(lang, "cost")}
          cards={orderedCards}
          placeholderCount={placeholderCount}
        >
          {(card) => <NumericCell value={card.cost} />}
        </CompareRow>
        <CompareRow
          label={t(lang, "power")}
          cards={orderedCards}
          highlight="max"
          getValue={(c) => c.power}
          placeholderCount={placeholderCount}
        >
          {(card, win) => (
            <NumericCell value={card.power} winner={win} format />
          )}
        </CompareRow>
        <CompareRow
          label={t(lang, "counter")}
          cards={orderedCards}
          highlight="max"
          getValue={(c) => c.counter}
          placeholderCount={placeholderCount}
        >
          {(card, win) => <NumericCell value={card.counter} winner={win} />}
        </CompareRow>
        <CompareRow
          label={t(lang, "life")}
          cards={orderedCards}
          placeholderCount={placeholderCount}
        >
          {(card) => <NumericCell value={card.life} />}
        </CompareRow>
      </CompareSection>

      <CompareSection
        title={t(lang, "comparePriceChart")}
        action={
          hasChart ? (
            <SegmentedControl
              size="sm"
              variant="pill"
              leadingIcon={CalendarRange}
              options={[30, 90, 180, 365].map((d) => {
                const locked =
                  isFinite(limits.priceHistoryDays) &&
                  d > limits.priceHistoryDays;
                return {
                  value: String(d),
                  label: `${d}d`,
                  locked,
                  ariaLabel: locked ? t(lang, "upgradeToUnlock") : undefined,
                };
              })}
              value={String(days)}
              onChange={(v) => setDays(Number(v))}
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
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
/*  Card rail — slim sticky product selector (Apple style)    */
/* ────────────────────────────────────────────────────────── */

function CardRail({
  cards,
  colors,
  lang,
  onRemove,
  totalLanes,
  canUpsell,
  onAddClick,
  onUpgradeClick,
}: {
  cards: CompareCard[];
  colors: string[];
  lang: ReturnType<typeof useUIStore.getState>["language"];
  onRemove: (code: string) => void;
  totalLanes: number;
  canUpsell: boolean;
  onAddClick: () => void;
  onUpgradeClick: () => void;
}) {
  const addLabel = t(lang, "addCardToCompare");
  const upgradeLabel = t(lang, "upgradeToUnlock");

  // Each lane gets a role: a filled card, an empty tier slot (user can add),
  // or the upgrade teaser (sits just past the tier cap).
  const lanes = Array.from({ length: totalLanes }, (_, i) => {
    if (i < cards.length) {
      return { kind: "card" as const, card: cards[i], index: i };
    }
    if (canUpsell && i === totalLanes - 1) {
      return { kind: "upgrade" as const, index: i };
    }
    return { kind: "add" as const, index: i };
  });

  return (
    <div>
      <div
        className="mx-auto grid w-full max-w-fit items-stretch gap-3 sm:gap-6"
        style={{ gridTemplateColumns: `var(${COMPARE_COLS_VAR})` }}
      >
          {lanes.map((lane) => {
            if (lane.kind === "card") {
              const { card, index } = lane;
              return (
                <div
                  key={card.cardCode}
                  className="group/slot flex flex-col items-center gap-3 sm:gap-4"
                >
                  <div className="relative aspect-[5/7] w-full max-w-[180px]">
                    <Link
                      href={`/cards/${card.cardCode}`}
                      className="block h-full w-full"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-xl border bg-muted shadow-sm transition-shadow hover:shadow-md">
                        {card.imageUrl ? (
                          <Image
                            src={card.imageUrl}
                            alt={getCardName(lang, card)}
                            fill
                            className="object-cover"
                            sizes="(min-width: 640px) 180px, 40vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-meta">
                            {card.cardCode}
                          </div>
                        )}
                        <span
                          aria-hidden
                          className="absolute inset-x-0 top-0 h-[3px]"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => onRemove(card.cardCode)}
                      className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-background text-muted-foreground shadow-md ring-1 ring-border transition-colors hover:bg-destructive hover:text-destructive-foreground hover:ring-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t(lang, "removeFromCompare")}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="flex w-full flex-col items-center gap-1">
                    <p className="line-clamp-2 max-w-full text-center text-sm font-semibold leading-snug sm:text-base">
                      {getCardName(lang, card)}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {card.cardCode}
                    </p>
                  </div>
                </div>
              );
            }

            const isUpgrade = lane.kind === "upgrade";
            const label = isUpgrade ? upgradeLabel : addLabel;
            const onClick = isUpgrade ? onUpgradeClick : onAddClick;
            return (
              <button
                key={`slot-${lane.index}`}
                type="button"
                onClick={onClick}
                className="group/add flex flex-col items-center gap-3 text-center sm:gap-4"
                aria-label={label}
              >
                <div className="relative aspect-[5/7] w-full max-w-[180px]">
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/10 text-muted-foreground transition-colors group-hover/add:border-primary/50 group-hover/add:bg-primary/5 group-hover/add:text-primary">
                    <span className="flex size-10 items-center justify-center rounded-full border border-current/30 bg-background/60 transition-transform group-hover/add:scale-110">
                      {isUpgrade ? (
                        <Lock className="size-5" />
                      ) : (
                        <Plus className="size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex w-full flex-col items-center gap-1">
                  <p className="line-clamp-2 max-w-full text-center text-sm font-semibold leading-snug text-muted-foreground transition-colors group-hover/add:text-primary sm:text-base">
                    {label}
                  </p>
                </div>
              </button>
            );
          })}
      </div>
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
