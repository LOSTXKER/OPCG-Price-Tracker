"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { CardGrid } from "@/components/cards/card-grid";
import { CardItem, type ChangePeriod } from "@/components/cards/card-item";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { CHANGE_PERIODS } from "@/components/home/market-types";
import { cn } from "@/lib/utils";
import { RARITY_HEX } from "@/lib/constants/rarities";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import {
  CARD_COLORS,
  CARD_TYPE_ORDER,
  getCardTypeLabel,
} from "@/lib/constants/card-config";

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
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SetDetailContent({
  groups,
  totalCards,
}: SetDetailContentProps) {
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
    return CARD_TYPE_ORDER.filter((ty) => counts.has(ty)).map((ty) => ({
      value: ty,
      count: counts.get(ty)!,
    }));
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
  const hasFilterControls =
    availableTypes.length > 1 || availableColors.length > 1;

  const filterCard = (c: CardData) => {
    if (activeType !== "all" && c.cardType !== activeType) return false;
    if (activeColor !== "all" && !c.color.includes(activeColor)) return false;
    return true;
  };

  const clearAdvFilters = () => {
    setActiveType("all");
    setActiveColor("all");
  };

  // Rarity is the page's STRUCTURE (one section per rarity + a text jump index),
  // not a hide-filter — only type/color narrow the rendered sections.
  const visibleGroups = hasActiveFilters
    ? groups
        .map((g) => ({ ...g, cards: g.cards.filter(filterCard) }))
        .filter((g) => g.cards.length > 0)
    : groups;

  const pill = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
      active
        ? "border-border bg-muted text-foreground"
        : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
    );

  return (
    <div className="space-y-6">
      {/* Controls — static (not sticky, no frosted overlay). Jump-to-rarity
          index on the left, period + filters on the right; one hairline base. */}
      <div className="-mx-4 px-4 md:-mx-6 md:px-6">
        <div className="flex flex-col gap-2 border-b border-[var(--p-hair)] pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          {/* Jump-to-rarity — plain text links to each section (no pills) */}
          <nav className="text-meta -mx-1 flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 px-1">
            {visibleGroups.map((g) => (
              <a
                key={g.rarity}
                href={`#r-${g.rarity}`}
                className="ease-chrome shrink-0 font-medium transition-colors hover:text-foreground"
              >
                {g.rarity}
              </a>
            ))}
          </nav>

          {/* Right: period (plain text) + filters toggle */}
          <div className="flex shrink-0 items-center gap-4">
            <div className="flex items-center gap-2">
              {CHANGE_PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setChangePeriod(p)}
                  className={cn(
                    "text-xs tabular-nums transition-colors",
                    changePeriod === p
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            {hasFilterControls && (
              <button
                onClick={() => setFilterOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-1 text-xs font-medium transition-colors",
                  filterOpen || advFilterCount > 0
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                {t(lang, "filter")}
                {advFilterCount > 0 && (
                  <span className="tabular-nums text-muted-foreground/70">
                    ({advFilterCount})
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* In-flow filter disclosure — pushes content down, never floats/overlays */}
        {filterOpen && hasFilterControls && (
          <div className="space-y-3 border-b border-[var(--p-hair)] py-3">
            {availableTypes.length > 1 && (
              <div>
                <span className="text-meta mb-1.5 block">
                  {t(lang, "type")}
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setActiveType("all")}
                    className={pill(activeType === "all")}
                  >
                    {t(lang, "allTab")}
                  </button>
                  {availableTypes.map((ct) => (
                    <button
                      key={ct.value}
                      onClick={() => setActiveType(ct.value)}
                      className={pill(activeType === ct.value)}
                    >
                      {getCardTypeLabel(ct.value, lang)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableColors.length > 1 && (
              <div>
                <span className="text-meta mb-1.5 block">
                  {t(lang, "color")}
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setActiveColor("all")}
                    className={pill(activeColor === "all")}
                  >
                    {t(lang, "allTab")}
                  </button>
                  {availableColors.map((cc) => (
                    <button
                      key={cc.value}
                      onClick={() => setActiveColor(cc.value)}
                      className={cn(
                        pill(activeColor === cc.value),
                        "flex items-center gap-1.5",
                      )}
                    >
                      <span
                        className={cn("size-2 rounded-full", cc.dotClass)}
                      />
                      {cc.label[lang]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {advFilterCount > 0 && (
              <button
                onClick={clearAdvFilters}
                className="text-meta flex items-center gap-1 hover:text-foreground"
              >
                <X className="size-3" />
                {t(lang, "clearAll")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Card sections — rarity IS the structure ── */}
      <div className="space-y-16">
        {visibleGroups.map((g) => (
          <section
            key={g.rarity}
            id={`r-${g.rarity}`}
            className="scroll-mt-20 md:scroll-mt-28"
          >
            <div className="mb-5 flex items-end justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  aria-hidden
                  className="h-5 w-1 shrink-0 rounded-full"
                  style={{
                    backgroundColor: RARITY_HEX[g.rarity] ?? "var(--border)",
                  }}
                />
                <h2 className="min-w-0 truncate text-h3">{g.name}</h2>
              </div>
              <span className="text-meta shrink-0 tabular-nums">
                {g.cards.length}
              </span>
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
          <div className="py-16 text-center text-sm text-muted-foreground">
            {t(lang, "noData")}
          </div>
        )}
      </div>
    </div>
  );
}
