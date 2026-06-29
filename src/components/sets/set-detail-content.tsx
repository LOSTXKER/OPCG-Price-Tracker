"use client";

import { useState, useMemo, type ReactNode } from "react";
import { TrendingUpDown } from "lucide-react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { type ChangePeriod } from "@/components/cards/card-item";
import { SetCardTile } from "./set-card-tile";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { CHANGE_PERIODS } from "@/components/home/market-types";
import { cn } from "@/lib/utils";
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
/*  Facet dropdown                                                     */
/* ------------------------------------------------------------------ */

type FilterOption = { value: string; label: ReactNode };

/** Compact facet dropdown for the toolbar — reads "<label> <selected>" and opens
 *  a small menu. Replaces the old full-width chip rows (เบส — chips felt cluttered). */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
}) {
  // Render the selected option's label ourselves — base-ui SelectValue shows the
  // raw value ("all") rather than the option label, so map it here.
  const current = options.find((o) => o.value === value)?.label ?? label;
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger
        size="sm"
        className="shrink-0 gap-1.5 text-xs font-medium"
      >
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{current}</span>
      </SelectTrigger>
      <SelectContent className="min-w-48 p-1">
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            className="py-1.5 pr-8 pl-2.5 text-sm"
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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

  // type/color narrow which cards (and therefore which rarities) are available.
  const visibleGroups = useMemo(() => {
    if (activeType === "all" && activeColor === "all") return groups;
    return groups
      .map((g) => ({
        ...g,
        cards: g.cards.filter(
          (c) =>
            (activeType === "all" || c.cardType === activeType) &&
            (activeColor === "all" || c.color.includes(activeColor)),
        ),
      }))
      .filter((g) => g.cards.length > 0);
  }, [groups, activeType, activeColor]);

  if (totalCards === 0) {
    return <KumaEmptyState title={t(lang, "noCardsInSet")} />;
  }

  // Rarity is now a FILTER (เบส): "all" shows every rarity stacked, otherwise
  // only the chosen rarity renders. Falls back to "all" if the chosen rarity is
  // filtered out by type/color (so the view never goes blank unexpectedly).
  const effectiveRarity =
    activeRarity !== "all" &&
    visibleGroups.some((g) => g.rarity === activeRarity)
      ? activeRarity
      : "all";
  const displayGroups =
    effectiveRarity === "all"
      ? visibleGroups
      : visibleGroups.filter((g) => g.rarity === effectiveRarity);
  const totalVisible = visibleGroups.reduce((s, g) => s + g.cards.length, 0);

  // Filters are compact dropdowns (เบส — chips read as clutter): one option list
  // per facet, "all" first as the reset.
  const typeOptions: FilterOption[] = [
    { value: "all", label: t(lang, "allTab") },
    ...availableTypes.map((ct) => ({
      value: ct.value,
      label: getCardTypeLabel(ct.value, lang),
    })),
  ];
  const colorOptions: FilterOption[] = [
    { value: "all", label: t(lang, "allTab") },
    ...availableColors.map((cc) => ({
      value: cc.value,
      label: (
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", cc.dotClass)} />
          {cc.label[lang]}
        </span>
      ),
    })),
  ];

  const rarityTabs = [
    { value: "all", label: t(lang, "allTab"), count: totalVisible },
    ...visibleGroups.map((g) => ({
      value: g.rarity,
      label: g.rarity,
      count: g.cards.length,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Static toolbar (NOT sticky — เบส: no floating chrome). Row 1: rarity
          jump-rail on a hairline baseline + sliding underline. Row 2: facet
          dropdowns (left) + period (right). */}
      <nav aria-label={t(lang, "rarity")} className="space-y-3">
        {/* rarity FILTER — tab bar (sets-index style); honey = active. Click a
            rarity to show only it; "all" stacks every rarity. */}
        <div className="no-sb flex items-center gap-1 overflow-x-auto border-b border-[var(--p-hair)]">
          {rarityTabs.map((rt) => {
            const active = effectiveRarity === rt.value;
            return (
              <button
                key={rt.value}
                type="button"
                onClick={() => setActiveRarity(rt.value)}
                aria-pressed={active}
                className={cn(
                  "ease-chrome -mb-px shrink-0 border-b-2 px-2.5 py-2.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {rt.label}
                <span
                  className={cn(
                    "ml-1.5 tabular-nums",
                    active ? "text-primary/60" : "text-muted-foreground/60",
                  )}
                >
                  {rt.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* controls — facet dropdowns (left) + period (right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {availableTypes.length > 1 && (
              <FilterSelect
                label={t(lang, "type")}
                value={activeType}
                onChange={setActiveType}
                options={typeOptions}
              />
            )}
            {availableColors.length > 1 && (
              <FilterSelect
                label={t(lang, "color")}
                value={activeColor}
                onChange={setActiveColor}
                options={colorOptions}
              />
            )}
          </div>
          <SegmentedControl
            size="sm"
            variant="pill"
            leadingIcon={TrendingUpDown}
            options={CHANGE_PERIODS.map((p) => ({ value: p, label: p }))}
            value={changePeriod}
            onChange={setChangePeriod}
            ariaLabel={t(lang, "change")}
          />
        </div>
      </nav>

      {/* ── Card sections — dense compact grid; "all" stacks every rarity, else
          just the chosen one. ── */}
      <div className="space-y-8">
        {displayGroups.map((g) => (
          <section key={g.rarity}>
            {/* centered section heading — name + shared RarityBadge (the site's
                one rarity-colour component) + count, flanked by hairlines. */}
            <div className="mb-5 flex items-center gap-3 sm:gap-4">
              <span aria-hidden className="h-px flex-1 bg-[var(--p-hair)]" />
              <div className="flex shrink-0 items-center gap-2">
                <h2 className="text-h4">{g.name}</h2>
                <RarityBadge rarity={g.rarity} size="sm" />
                <span className="text-meta tabular-nums">{g.cards.length}</span>
              </div>
              <span aria-hidden className="h-px flex-1 bg-[var(--p-hair)]" />
            </div>
            <div className="grid grid-cols-3 gap-x-2.5 gap-y-4 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {g.cards.map((c) => (
                <SetCardTile key={c.id} card={c} changePeriod={changePeriod} />
              ))}
            </div>
          </section>
        ))}

        {displayGroups.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {t(lang, "noData")}
          </div>
        )}
      </div>
    </div>
  );
}
