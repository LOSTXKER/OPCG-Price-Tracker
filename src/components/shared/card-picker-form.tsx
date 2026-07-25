"use client";

import { useEffect, useState, type ReactNode } from "react";

import { fetchCards } from "@/lib/api/fetch-cards";
import { apiGet, apiTry } from "@/lib/api/client";
import { getActiveGameConfigs } from "@/lib/game-config";
import { DEFAULT_GAME } from "@/lib/game/constants";
import { useUIStore } from "@/stores/ui-store";

import { SelectStep } from "@/components/portfolio/add-card-select-step";
import {
  type CardWithSet,
  type SetInfo,
} from "@/components/portfolio/add-card-types";

export type { CardWithSet };

const ACTIVE_GAMES = getActiveGameConfigs();

type PickerLoadState = {
  requestKey: string;
  cards: CardWithSet[];
  error: boolean;
};

/** @internal Keeps a stale coming-soon preference from producing an empty picker. */
export function getInitialPickerGame(preferredGame: string) {
  return ACTIVE_GAMES.some((game) => game.slug === preferredGame)
    ? preferredGame
    : ACTIVE_GAMES[0]?.slug ?? DEFAULT_GAME;
}

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
  const [resultsState, setResultsState] = useState<PickerLoadState>({
    requestKey: "",
    cards: [],
    error: false,
  });
  const [initialState, setInitialState] = useState<PickerLoadState>({
    requestKey: "",
    cards: [],
    error: false,
  });
  const [loadRevision, setLoadRevision] = useState(0);

  // The picker starts on the visitor's current launch-ready game and scopes every
  // fetch below. A stale coming-soon preference falls back to the first live
  // game; SelectStep still shows that game context when it is the only option.
  const storeGame = useUIStore((s) => s.currentGame);
  const [activeGame, setActiveGameState] = useState(() => getInitialPickerGame(storeGame));

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
    setSets([]);
    setActiveSet(null);
    setActiveRarity(null);
    setActiveColor(null);
    setActiveCardType(null);
    setActiveVariant(null);
  };

  // Sets for the filter — reload whenever the active game changes.
  useEffect(() => {
    let cancelled = false;
    void apiTry(apiGet<{ sets: SetInfo[] }>(`/api/sets?game=${activeGame}`)).then((data) => {
      if (!cancelled && data) setSets(data.sets ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [activeGame, loadRevision]);

  const initialRequestKey = JSON.stringify([activeGame, loadRevision]);

  // Value-sorted default list (shown before any search/filter) — reload
  // whenever the active game changes.
  useEffect(() => {
    const controller = new AbortController();

    void fetchCards(
      { sort: "price_desc", limit: 30, game: activeGame },
      { signal: controller.signal },
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setInitialState({
            requestKey: initialRequestKey,
            cards: (data.cards ?? []) as CardWithSet[],
            error: false,
          });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setInitialState({ requestKey: initialRequestKey, cards: [], error: true });
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeGame, initialRequestKey]);

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

  const trimmedQuery = query.trim();
  const hasSearch = trimmedQuery.length >= 2;
  const isFiltered = hasSearch || hasAnyFilter;
  const filteredRequestKey = JSON.stringify([
    activeGame,
    trimmedQuery,
    activeSet,
    activeRarity,
    activeColor,
    activeCardType,
    activeVariant,
    loadRevision,
  ]);

  useEffect(() => {
    if (!isFiltered) return;

    const controller = new AbortController();

    const timer = window.setTimeout(
      () => {
        void fetchCards(
          {
            limit: 40,
            search: hasSearch ? trimmedQuery : undefined,
            game: activeGame,
            set: activeSet ?? undefined,
            // Base rarity now expands to its P- family server-side (กด SEC เจอ P-SEC ด้วย);
            // the `variant` facet narrows regular/parallel.
            rarity: activeRarity ?? undefined,
            color: activeColor ?? undefined,
            type: activeCardType ?? undefined,
            variant: activeVariant ?? undefined,
          },
          { signal: controller.signal },
        )
          .then((data) => {
            if (!controller.signal.aborted) {
              setResultsState({
                requestKey: filteredRequestKey,
                cards: (data.cards ?? []) as CardWithSet[],
                error: false,
              });
            }
          })
          .catch(() => {
            if (!controller.signal.aborted) {
              setResultsState({
                requestKey: filteredRequestKey,
                cards: [],
                error: true,
              });
            }
          });
      },
      hasSearch ? 300 : 50,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    activeCardType,
    activeColor,
    activeGame,
    activeRarity,
    activeSet,
    activeVariant,
    filteredRequestKey,
    hasSearch,
    isFiltered,
    trimmedQuery,
  ]);

  const clearAllFilters = () => {
    setActiveSet(null);
    setActiveRarity(null);
    setActiveColor(null);
    setActiveCardType(null);
    setActiveVariant(null);
  };

  const initialCurrent = initialState.requestKey === initialRequestKey;
  const resultsCurrent = resultsState.requestKey === filteredRequestKey;
  const initialCards = initialCurrent ? initialState.cards : [];
  const results = resultsCurrent ? resultsState.cards : [];
  const initialLoading = !initialCurrent;
  const resultsLoading = isFiltered && !resultsCurrent;
  const initialError = initialCurrent && initialState.error;
  const resultsError = resultsCurrent && resultsState.error;
  const displayCards = isFiltered ? results : initialCards;
  const loading = isFiltered ? resultsLoading : initialLoading;
  const loadError = isFiltered ? resultsError : initialError;
  const showEmpty = isFiltered && !loading && !loadError && results.length === 0;

  return (
    <SelectStep
      query={query}
      setQuery={setQuery}
      loading={loading}
      loadError={loadError}
      onRetry={() => setLoadRevision((revision) => revision + 1)}
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
