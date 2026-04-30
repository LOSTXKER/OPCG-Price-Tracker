"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { SlidersHorizontal, TrendingUpDown, X } from "lucide-react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem, type ChangePeriod } from "@/components/cards/card-item";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { CHANGE_PERIODS } from "@/components/home/market-types";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { cn } from "@/lib/utils";
import { RARITY_HEX } from "@/lib/constants/rarities";
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
}

/* ------------------------------------------------------------------ */
/*  Filter constants                                                   */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SetDetailContent({
  groups,
  totalCards,
}: SetDetailContentProps) {
  const [activeRarity, setActiveRarity] = useState<string>("all");
  const [activeType, setActiveType] = useState<string>("all");
  const [activeColor, setActiveColor] = useState<string>("all");
  const [changePeriod, setChangePeriod] = useState<ChangePeriod>("7d");
  const [filterOpen, setFilterOpen] = useState(false);
  const lang = useUIStore((s) => s.language);

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
      "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
      active
        ? "border-border bg-muted text-foreground"
        : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    );

  return (
    <div className="space-y-4">
      {/* ── Single merged toolbar — sticky ── */}
      <div className="sticky top-0 z-30 -mx-4 bg-background/95 px-4 backdrop-blur-md md:top-[86px] md:-mx-6 md:px-6">
        <div className="flex flex-col gap-1.5 border-b border-border/40 py-2 sm:flex-row sm:items-center sm:gap-2">
          {/* Left: rarity pills — scrollable */}
          <div className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 scrollbar-none">
            <button onClick={() => setActiveRarity("all")} className={pill(activeRarity === "all")}>
              {t(lang, "allTab")}
            </button>
            {groups.map((g) => {
              const active = activeRarity === g.rarity;
              const dotColor = RARITY_HEX[g.rarity] ?? "var(--muted-foreground)";
              return (
                <button
                  key={g.rarity}
                  onClick={() => setActiveRarity(g.rarity)}
                  className={cn(pill(active), "inline-flex items-center gap-1.5")}
                >
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span className="font-semibold uppercase tracking-wide">{g.rarity}</span>
                  <span className="tabular-nums text-muted-foreground/80">{g.cards.length}</span>
                </button>
              );
            })}
          </div>

          {/* Right: controls — sit on row 2 on mobile, inline on sm+ */}
          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:pl-2">
            {/* Period toggle */}
            <div className="flex items-center gap-0.5 rounded-full border border-border/50 p-0.5">
              <TrendingUpDown className="mx-1.5 size-3.5 text-muted-foreground/50" />
              {CHANGE_PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setChangePeriod(p)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums transition-all",
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
                  "relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
                  filterOpen || advFilterCount > 0
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">{t(lang, "filter")}</span>
                {advFilterCount > 0 && !filterOpen && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
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
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-meta transition-colors hover:bg-muted hover:text-foreground"
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
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t(lang, "type")}</span>
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
                      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{t(lang, "color")}</span>
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
      <div className="space-y-12">
        {visibleGroups.map((g) => (
          <section key={g.rarity}>
            {/* Section header */}
            <div className="mb-4 flex items-center gap-3">
              <span
                aria-hidden
                className="h-4 w-1 rounded-full"
                style={{ backgroundColor: RARITY_HEX[g.rarity] ?? "var(--border)" }}
              />
              <RarityBadge rarity={g.rarity} size="sm" />
              <h2 className="min-w-0 truncate text-h4">{g.name}</h2>
              <span className="text-xs tabular-nums text-muted-foreground">{g.cards.length}</span>
              <div className="h-px flex-1 bg-border/40" />
            </div>
            <CardGrid>
              {g.cards.map((c) => (
                <CardItem
                  key={c.id}
                  cardCode={c.cardCode}
                  cardId={c.id}
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
