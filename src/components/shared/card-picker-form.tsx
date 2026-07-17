"use client";

import { useEffect, useState, type ReactNode } from "react";

import { fetchCards } from "@/lib/api/fetch-cards";
import { apiGet, apiTry } from "@/lib/api/client";
import { DEFAULT_GAME } from "@/lib/game/constants";
import { useUIStore } from "@/stores/ui-store";

import { SelectStep } from "@/components/portfolio/add-card-select-step";
import {
  type CardWithSet,
  type SetInfo,
} from "@/components/portfolio/add-card-types";

export type { CardWithSet };

/**
 * The ONE "search / filter → pick a card" form for the whole app (เบส: ทุกหน้า
 * ที่ค้นหาการ์ดใช้ฟอร์มนี้). Owns its own search + set/rarity/color/type filter +
 * value-sorted default list + fetch; the host page just supplies `onSelect`.
 *
 * Started life as the portfolio add-card SelectStep; extracted here so watchlist,
 * alerts, marketplace, and compare all get the identical picker instead of each
 * rolling its own. Render it inside a Dialog/Sheet (the header uses DialogTitle
 * for a11y). Multi-pick surfaces pass an `isSelected` predicate + an `onSelect`
 * that toggles (the form highlights selected rows with a check and stays open).
 * (drop-calc stays bespoke — its picker is set-scoped for the per-set drop calc.)
 */
export function CardPickerForm({
  onSelect,
  isSelected,
  showHeader = true,
  footer,
  selected,
}: {
  onSelect: (card: CardWithSet) => void;
  /** Multi-pick mode: predicate → matching rows render selected + onSelect toggles. */
  isSelected?: (card: CardWithSet) => boolean;
  /** Hide the built-in "เลือกการ์ด" header when the host has its own (alerts). */
  showHeader?: boolean;
  /** Commit bar rendered inside the picker (below the list) so the filter overlay
   *  covers it — pass the host's "confirm" button here instead of as a sibling. */
  footer?: ReactNode;
  /** Multi-pick: cards picked so far → a preview strip above the footer (remove
   *  toggles back off via onSelect). */
  selected?: CardWithSet[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardWithSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialCards, setInitialCards] = useState<CardWithSet[]>([]);

  // Game FIRST (เบส: เลือกเกมก่อน) — starts on the visitor's current game, then
  // scopes every fetch below (sets / default list / search). Switching games
  // clears the set + facet filters since rarity/color/type families differ
  // per game.
  const storeGame = useUIStore((s) => s.currentGame);
  const [activeGame, setActiveGameState] = useState(storeGame || DEFAULT_GAME);

  const [sets, setSets] = useState<SetInfo[]>([]);
  const [activeSet, setActiveSet] = useState<string | null>(null);
  const [activeRarity, setActiveRarity] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeCardType, setActiveCardType] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const setActiveGame = (game: string) => {
    if (game === activeGame) return;
    setActiveGameState(game);
    setActiveSet(null);
    setActiveRarity(null);
    setActiveColor(null);
    setActiveCardType(null);
    setActiveVariant(null);
  };

  // Sets for the filter — reload whenever the active game changes.
  useEffect(() => {
    void apiTry(apiGet<{ sets: SetInfo[] }>(`/api/sets?game=${activeGame}`)).then((data) => {
      if (data) setSets(data.sets ?? []);
    });
  }, [activeGame]);

  // Value-sorted default list (shown before any search/filter) — reload
  // whenever the active game changes.
  useEffect(() => {
    let cancelled = false;
    void fetchCards({ sort: "price_desc", limit: 30, game: activeGame })
      .then((data) => {
        if (!cancelled) setInitialCards((data.cards ?? []) as CardWithSet[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeGame]);

  const hasAnyFilter =
    activeSet != null ||
    activeRarity != null ||
    activeColor != null ||
    activeCardType != null ||
    activeVariant != null;
  const activeFilterCount = [
    activeSet,
    activeRarity,
    activeColor,
    activeCardType,
    activeVariant,
  ].filter(Boolean).length;

  useEffect(() => {
    const q = query.trim();
    const hasSearch = q.length >= 2;

    if (!hasSearch && !hasAnyFilter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale results when the query + filters both clear
      setResults([]);
      return;
    }

    setLoading(true);

    const timer = window.setTimeout(
      () => {
        void fetchCards({
          limit: 40,
          search: hasSearch ? q : undefined,
          game: activeGame,
          set: activeSet ?? undefined,
          // Base rarity now expands to its P- family server-side (กด SEC เจอ P-SEC ด้วย);
          // the `variant` facet narrows regular/parallel.
          rarity: activeRarity ?? undefined,
          color: activeColor ?? undefined,
          type: activeCardType ?? undefined,
          variant: activeVariant ?? undefined,
        })
          .then((data) => setResults((data.cards ?? []) as CardWithSet[]))
          .catch(() => setResults([]))
          .finally(() => setLoading(false));
      },
      hasSearch ? 300 : 50,
    );

    return () => {
      window.clearTimeout(timer);
      setLoading(false);
    };
  }, [
    query,
    activeGame,
    activeSet,
    activeRarity,
    activeColor,
    activeCardType,
    activeVariant,
    hasAnyFilter,
  ]);

  const clearAllFilters = () => {
    setActiveSet(null);
    setActiveRarity(null);
    setActiveColor(null);
    setActiveCardType(null);
    setActiveVariant(null);
  };

  const isFiltered = query.trim().length >= 2 || hasAnyFilter;
  const displayCards = isFiltered ? results : initialCards;
  const showEmpty = isFiltered && !loading && results.length === 0;

  return (
    <SelectStep
      query={query}
      setQuery={setQuery}
      loading={loading}
      displayCards={displayCards}
      showEmpty={showEmpty}
      isFiltered={isFiltered}
      activeGame={activeGame}
      onGameChange={setActiveGame}
      sets={sets}
      activeSet={activeSet}
      selectSetCode={setActiveSet}
      activeRarity={activeRarity}
      setActiveRarity={setActiveRarity}
      activeColor={activeColor}
      setActiveColor={setActiveColor}
      activeCardType={activeCardType}
      setActiveCardType={setActiveCardType}
      activeVariant={activeVariant}
      setActiveVariant={setActiveVariant}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      activeFilterCount={activeFilterCount}
      clearAllFilters={clearAllFilters}
      onSelectCard={onSelect}
      isSelected={isSelected}
      showHeader={showHeader}
      footer={footer}
      selected={selected}
    />
  );
}
