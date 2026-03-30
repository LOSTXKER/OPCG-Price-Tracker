"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { AlertTriangle, BarChart3, ChevronDown, SlidersHorizontal, X } from "lucide-react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem, type ChangePeriod } from "@/components/cards/card-item";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { CHANGE_PERIODS } from "@/components/home/market-types";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { cn } from "@/lib/utils";
import {
  pullChance,
  formatPullPct,
  PACKS_PER_BOX,
  BOXES_PER_CARTON,
} from "@/lib/utils/pull-rate";
import { RARITY_BAR_COLOR, RARITY_HEX } from "@/lib/constants/rarities";
import { UNIT_I18N_KEYS, PULL_UNITS, type Unit } from "@/lib/constants/ui";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { CARD_COLORS, CARD_TYPE_ORDER, getCardTypeLabel } from "@/lib/constants/card-config";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CardData = {
  id: number;
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  isParallel: boolean;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  setCode: string;
  psa10PriceUsd: number | null;
  cardType: string;
  color: string;
};

export type PullRateData = {
  rarity: string;
  avgPerBox: number;
  ratePerPack: number;
};

export type RarityGroup = {
  rarity: string;
  name: string;
  cards: CardData[];
  pullRate?: PullRateData;
  pullChancePerBox?: number;
};

interface SetDetailContentProps {
  groups: RarityGroup[];
  totalCards: number;
  packsPerBox: number | null;
  cardsPerPack: number | null;
  hasPullRates: boolean;
}

/* ------------------------------------------------------------------ */
/*  Filter constants                                                   */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/*  Pull rate helpers                                                  */
/* ------------------------------------------------------------------ */

function fmtCount(v: number): string {
  if (v >= 100) return `~${Math.round(v)}`;
  if (v >= 10) return `~${v.toFixed(0)}`;
  if (v >= 1) return `~${v.toFixed(1)}`;
  if (v >= 0.01) return `~${v.toFixed(2)}`;
  return `~${v.toFixed(3)}`;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SetDetailContent({
  groups,
  totalCards,
  packsPerBox,
  cardsPerPack,
  hasPullRates,
}: SetDetailContentProps) {
  const [activeRarity, setActiveRarity] = useState<string>("all");
  const [activeType, setActiveType] = useState<string>("all");
  const [activeColor, setActiveColor] = useState<string>("all");
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d");
  const [filterOpen, setFilterOpen] = useState(false);
  const [unit, setUnit] = useState<Unit>("box");
  const lang = useUIStore((s) => s.language);
  const [pullRateOpen, setPullRateOpen] = useState(false);

  const allCards = useMemo(() => groups.flatMap((g) => g.cards), [groups]);

  const availableTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of allCards) {
      counts.set(c.cardType, (counts.get(c.cardType) ?? 0) + 1);
    }
    return CARD_TYPE_ORDER
      .filter((t) => counts.has(t))
      .map((t) => ({ value: t, count: counts.get(t)! }));
  }, [allCards]);

  const availableColors = useMemo(() => {
    const present = new Set(allCards.map((c) => c.color));
    return CARD_COLORS.filter((cc) => present.has(cc.value));
  }, [allCards]);

  if (totalCards === 0) {
    return <KumaEmptyState title={t(lang, "noCardsInSet")} />;
  }

  const pullRateGroups = groups.filter((g) => g.pullRate);
  const showPullRates = hasPullRates && pullRateGroups.length > 0;

  const countForUnit = (pr: PullRateData) =>
    unit === "pack"
      ? pr.avgPerBox / PACKS_PER_BOX
      : unit === "carton"
        ? pr.avgPerBox * BOXES_PER_CARTON
        : pr.avgPerBox;

  const rateForUnit = (pr: PullRateData) =>
    unit === "pack"
      ? pr.ratePerPack
      : unit === "carton"
        ? pr.avgPerBox * BOXES_PER_CARTON
        : pr.avgPerBox;

  const advFilterCount =
    (activeType !== "all" ? 1 : 0) + (activeColor !== "all" ? 1 : 0);
  const hasActiveFilters = advFilterCount > 0;

  const filterCard = (c: CardData) => {
    if (activeType !== "all" && c.cardType !== activeType) return false;
    if (activeColor !== "all" && !c.color.includes(activeColor)) return false;
    return true;
  };

  const clearAdvFilters = () => {
    setActiveType("all");
    setActiveColor("all");
  };

  const baseGroups =
    activeRarity === "all"
      ? groups
      : groups.filter((g) => g.rarity === activeRarity);

  const visibleGroups = hasActiveFilters
    ? baseGroups
        .map((g) => ({ ...g, cards: g.cards.filter(filterCard) }))
        .filter((g) => g.cards.length > 0)
    : baseGroups;

  const filteredTotal = visibleGroups.reduce((sum, g) => sum + g.cards.length, 0);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filterOpen]);

  const pill = (active: boolean) =>
    cn(
      "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
      active
        ? "bg-muted ring-1 ring-border text-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );

  return (
    <div className="space-y-4">
      {/* ── Drop Rates — collapsible at top ── */}
      {showPullRates && (
        <div className="panel overflow-hidden">
          <button
            onClick={() => setPullRateOpen((o) => !o)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30"
          >
            <BarChart3 className="size-4 text-primary" />
            <span className="text-sm font-semibold">{t(lang, "dropRate")}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
              {pullRateGroups.length}
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
              <AlertTriangle className="size-2.5" />
              {t(lang, "communityEstimate")}
            </span>
            <div className="flex-1" />
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", pullRateOpen && "rotate-180")} />
          </button>

          {pullRateOpen && (
            <div className="border-t border-border/30 px-4 pb-3 pt-2">
              <div className="mb-2 flex items-center gap-2">
                <div className="inline-flex rounded-lg bg-muted/60 p-0.5">
                  {PULL_UNITS.map((u) => (
                    <button
                      key={u}
                      onClick={() => setUnit(u)}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium transition-all",
                        unit === u
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t(lang, UNIT_I18N_KEYS[u])}
                    </button>
                  ))}
                </div>
                {packsPerBox && cardsPerPack && (
                  <span className="text-[11px] text-muted-foreground">
                    {packsPerBox} {t(lang, "perUnit")}/{t(lang, "packUnit")} · {cardsPerPack} {t(lang, "cardsCount")}/{t(lang, "packUnit")}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead className="text-[11px] font-medium text-muted-foreground">
                    <tr className="border-b border-border/30">
                      <th className="py-1.5 text-left font-medium">{t(lang, "level")}</th>
                      <th className="py-1.5 text-left font-medium" />
                      <th className="py-1.5 text-right font-medium">{t(lang, "perUnit")}/{t(lang, UNIT_I18N_KEYS[unit])}</th>
                      <th className="py-1.5 text-right font-medium">{t(lang, "cardsCount")}</th>
                      <th className="py-1.5 text-right font-medium">{t(lang, "chancePerCard")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {pullRateGroups.map((g) => {
                      const pr = g.pullRate!;
                      const count = countForUnit(pr);
                      const chance = pullChance(rateForUnit(pr), g.cards.length);
                      const barWidth = Math.min((pr.avgPerBox / 6) * 100, 100);
                      const barColor = RARITY_BAR_COLOR[g.rarity] ?? "bg-neutral-400";
                      return (
                        <tr key={g.rarity}>
                          <td className="whitespace-nowrap py-2 pl-0"><RarityBadge rarity={g.rarity} size="sm" /></td>
                          <td className="w-full px-3 py-2">
                            <div className="h-1.5 min-w-12 overflow-hidden rounded-full bg-muted">
                              <div className={cn("h-full rounded-full", barColor)} style={{ width: `${barWidth}%` }} />
                            </div>
                          </td>
                          <td className="whitespace-nowrap py-2 text-right font-mono text-sm font-bold tabular-nums">{fmtCount(count)}</td>
                          <td className="whitespace-nowrap py-2 text-right text-xs tabular-nums text-muted-foreground">{g.cards.length}</td>
                          <td className="whitespace-nowrap py-2 text-right font-mono text-xs font-semibold tabular-nums text-primary">{formatPullPct(chance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Single merged toolbar — sticky ── */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-border/40 bg-background/95 px-4 backdrop-blur-md md:top-[86px] md:-mx-6 md:px-6">
        <div className="flex items-center gap-2 py-2">
          {/* Left: rarity pills — scrollable */}
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
            <button onClick={() => setActiveRarity("all")} className={pill(activeRarity === "all")}>
              {t(lang, "allTab")}
            </button>
            {groups.map((g) => (
              <button
                key={g.rarity}
                onClick={() => setActiveRarity(g.rarity)}
                className={cn(pill(activeRarity === g.rarity), "flex items-center gap-1.5")}
              >
                <RarityBadge rarity={g.rarity} size="sm" />
                <span className="tabular-nums">{g.cards.length}</span>
              </button>
            ))}
          </div>

          {/* Right: controls — fixed */}
          <div className="flex shrink-0 items-center gap-1.5 border-l border-border/30 pl-3">
            {/* Period toggle */}
            <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
              {CHANGE_PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setChangePeriod(p)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium tabular-nums transition-colors",
                    changePeriod === p
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Filter button + floating dropdown */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  filterOpen || advFilterCount > 0
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">{t(lang, "filter")}</span>
                {advFilterCount > 0 && !filterOpen && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {advFilterCount}
                  </span>
                )}
              </button>

              {/* Floating filter panel */}
              {filterOpen && (
                <div className="fixed inset-x-3 top-14 z-40 rounded-xl border border-border bg-background p-4 shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-80">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{t(lang, "filter")}</span>
                    <div className="flex items-center gap-2">
                      {advFilterCount > 0 && (
                        <button
                          onClick={clearAdvFilters}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <X className="size-3" />
                          {t(lang, "clearAll")}
                        </button>
                      )}
                      <button
                        onClick={() => setFilterOpen(false)}
                        className="flex items-center justify-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:hidden"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </div>

                  {availableTypes.length > 1 && (
                    <div className="mb-3">
                      <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">{t(lang, "type")}</span>
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setActiveType("all")} className={pill(activeType === "all")}>{t(lang, "allTab")}</button>
                        {availableTypes.map((ct) => (
                          <button key={ct.value} onClick={() => setActiveType(ct.value)} className={pill(activeType === ct.value)}>
                            {getCardTypeLabel(ct.value, lang)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {availableColors.length > 1 && (
                    <div>
                      <span className="mb-1.5 block text-[11px] font-medium text-muted-foreground">{t(lang, "color")}</span>
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => setActiveColor("all")} className={pill(activeColor === "all")}>{t(lang, "allTab")}</button>
                        {availableColors.map((cc) => (
                          <button
                            key={cc.value}
                            onClick={() => setActiveColor(cc.value)}
                            className={cn(pill(activeColor === cc.value), "flex items-center gap-1.5")}
                          >
                            <span className={cn("size-2 rounded-full", cc.dotClass)} />
                            {cc.label[lang]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Card Sections ── */}
      <div className="space-y-14">
        {visibleGroups.map((g) => (
          <section key={g.rarity}>
            {/* Section header */}
            <div className="mb-5 flex items-center gap-3 py-3">
              <div className="h-px flex-1" style={{ background: `linear-gradient(to right, ${RARITY_HEX[g.rarity] ?? "var(--border)"}50, transparent)` }} />
              <RarityBadge rarity={g.rarity} size="md" />
              <h2 className="text-base font-bold">{g.name}</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{g.cards.length}</span>
              <div className="h-px flex-1" style={{ background: `linear-gradient(to left, ${RARITY_HEX[g.rarity] ?? "var(--border)"}50, transparent)` }} />
            </div>
            <CardGrid>
              {g.cards.map((c) => (
                <CardItem
                  key={c.id}
                  cardCode={c.cardCode}
                  nameJp={c.nameJp}
                  nameEn={c.nameEn}
                  rarity={c.rarity}
                  isParallel={c.isParallel}
                  imageUrl={c.imageUrl}
                  priceJpy={c.latestPriceJpy ?? undefined}
                  priceThb={c.latestPriceThb ?? undefined}
                  priceChange24h={c.priceChange24h}
                  priceChange7d={c.priceChange7d}
                  priceChange30d={c.priceChange30d}
                  changePeriod={changePeriod}
                  setCode={c.setCode}
                  pullChancePerBox={g.pullChancePerBox}
                  psa10PriceUsd={c.psa10PriceUsd}
                />
              ))}
            </CardGrid>
          </section>
        ))}

        {visibleGroups.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">{t(lang, "noData")}</div>
        )}
      </div>
    </div>
  );
}
