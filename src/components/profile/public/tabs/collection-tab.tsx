"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Layers, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t, type Language } from "@/lib/i18n";
import type { CollectionStats } from "@/lib/profile/load-public-profile";

import { CollectionCard } from "../cards/collection-card";
import type { ProfileCardData } from "../types";
import { collectionGridClass } from "./grid-cols";
import { HintTile } from "./hint-tile";
import { TabSection } from "./tab-section";
import { TabToolbar, type FilterChip, type SortOption } from "./tab-toolbar";

const RARE_RARITIES = new Set(["SR", "SEC", "L", "SP", "P-SR", "P-SEC"]);

// Lower-rarity codes get a sort weight (smaller = lower); used to flip them
// to the bottom in "By rarity" sort. We don't try to enumerate every rarity —
// anything not listed gets weight 0.
const RARITY_WEIGHT: Record<string, number> = {
  SEC: 100,
  "P-SEC": 95,
  SR: 90,
  "P-SR": 85,
  L: 80,
  SP: 75,
  R: 50,
  UC: 30,
  C: 10,
};

type CollectionFilter = "all" | "rare";
type CollectionSort = "recent" | "rarity" | "set";

const TOOLBAR_THRESHOLD = 4;

export function CollectionTabContent({
  cards,
  stats,
  hideQty,
  isOwner,
  lang,
}: {
  cards: ProfileCardData[];
  stats: CollectionStats;
  hideQty: boolean;
  isOwner: boolean;
  lang: Language;
}) {
  const isEmpty = stats.totalCards === 0 && cards.length === 0;

  const [filter, setFilter] = useState<CollectionFilter | string>("all");
  const [sort, setSort] = useState<CollectionSort>("recent");

  const filtered = useMemo(() => {
    let arr = cards.slice();
    if (filter === "rare") arr = arr.filter((c) => RARE_RARITIES.has(c.rarity));
    else if (filter !== "all") arr = arr.filter((c) => c.setCode === filter);

    switch (sort) {
      case "rarity":
        arr.sort(
          (a, b) => (RARITY_WEIGHT[b.rarity] ?? 0) - (RARITY_WEIGHT[a.rarity] ?? 0),
        );
        break;
      case "set":
        arr.sort((a, b) => (a.setCode ?? "").localeCompare(b.setCode ?? ""));
        break;
      case "recent":
      default:
        // Server already sends recent-first — preserve that.
        break;
    }
    return arr;
  }, [cards, filter, sort]);

  if (isEmpty) {
    return (
      <TabSection title={t(lang, "tabCollection")}>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60">
            <Layers className="size-7 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t(lang, "noCollectionYet")}
          </p>
          {isOwner && (
            <Link href="/portfolio">
              <Button size="sm" className="gap-1.5 rounded-full">
                <Package className="size-3.5" />
                {t(lang, "addYourFirstCard")}
              </Button>
            </Link>
          )}
        </div>
      </TabSection>
    );
  }

  const remaining = Math.max(0, stats.totalCards - cards.length);

  // Keep the meta line minimal — just the card count. Sets/rare breakdowns
  // are already surfaced via the featured-set chips and the rarity filter,
  // so repeating them here reads as noise.
  const metaLine = `${stats.totalCards.toLocaleString()} ${t(lang, "cardsInCollection").toLowerCase()}`;

  // Only highlight sets where the user has made meaningful progress.
  const featuredSets = stats.topSets.filter(
    (s) => s.completionPct >= 30 || s.cardsOwned >= 20,
  );

  // Filter chips: All · Rare · then top-3 sets so we don't drown the bar.
  const filters: FilterChip<string>[] = [
    { value: "all", label: t(lang, "filterAll") },
    { value: "rare", label: t(lang, "filterRare") },
    ...stats.topSets
      .slice(0, 3)
      .map((s) => ({ value: s.code, label: s.nameEn ?? s.name })),
  ];

  const sortOptions: SortOption<CollectionSort>[] = [
    { value: "recent", label: t(lang, "sortRecent") },
    { value: "rarity", label: t(lang, "sortRarity") },
    { value: "set", label: t(lang, "sortSet") },
  ];

  const showToolbar = cards.length >= TOOLBAR_THRESHOLD;

  // Featured-set chips render as a "highlights" row directly under the
  // header — gives visitors a quick read on the strongest sets before they
  // scan the grid.
  const headerExtra =
    featuredSets.length > 0 ? (
      <div className="flex flex-wrap items-center gap-1.5">
        {featuredSets.map((s) => {
          const name = lang === "JP" ? s.name : (s.nameEn ?? s.name);
          return (
            <span
              key={s.code}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              title={`${s.cardsOwned}/${s.cardCount} (${s.completionPct}%)`}
            >
              {name}
              <span className="text-primary/60">{s.completionPct}%</span>
            </span>
          );
        })}
      </div>
    ) : null;

  return (
    <TabSection
      // Title omitted — the tab nav already labels this section. Repeating
      // it as a panel heading reads as redundant noise.
      meta={metaLine}
      headerExtra={headerExtra}
    >
      {showToolbar && (
        <TabToolbar
          filters={filters}
          activeFilter={filter}
          onFilter={setFilter}
          sortOptions={sortOptions}
          activeSort={sort}
          onSort={setSort}
          lang={lang}
        />
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t(lang, "noCollectionYet")}
        </p>
      ) : (
        <div className={collectionGridClass(filtered.length)}>
          {filtered.map((c) => (
            <CollectionCard
              key={c.cardCode}
              card={c}
              hideQty={hideQty}
              showLock={isOwner && !!c.isPrivate}
              lang={lang}
            />
          ))}
          {filtered.length === 1 && (
            <HintTile kind="collection" isOwner={isOwner} lang={lang} />
          )}
        </div>
      )}

      {remaining > 0 && (
        <p className="text-center text-meta">
          {t(lang, "collectionShowingFirst")
            .replace("{shown}", String(cards.length))
            .replace("{total}", String(stats.totalCards))}
        </p>
      )}
    </TabSection>
  );
}
