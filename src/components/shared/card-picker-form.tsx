"use client";

import { useEffect, useState } from "react";

import { fetchCards } from "@/lib/api/fetch-cards";
import { apiGet, apiTry } from "@/lib/api/client";

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
 * alerts, marketplace, drop-calc, compare… all get the identical picker instead
 * of each rolling its own. Render it inside a Dialog/Sheet (the header uses
 * DialogTitle for a11y). Multi-pick surfaces pass `selectedIds` + `onSelect`
 * that toggles (the form highlights selected rows and stays open).
 */
export function CardPickerForm({
  onSelect,
  selectedIds,
}: {
  onSelect: (card: CardWithSet) => void;
  /** Multi-pick mode: ids already chosen — rows render selected + onSelect toggles. */
  selectedIds?: ReadonlySet<number>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardWithSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialCards, setInitialCards] = useState<CardWithSet[]>([]);

  const [sets, setSets] = useState<SetInfo[]>([]);
  const [activeSet, setActiveSet] = useState<string | null>(null);
  const [activeRarity, setActiveRarity] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeCardType, setActiveCardType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Sets for the filter — load once when the form mounts.
  useEffect(() => {
    void apiTry(apiGet<{ sets: SetInfo[] }>("/api/sets")).then((data) => {
      if (data) setSets(data.sets ?? []);
    });
  }, []);

  // Value-sorted default list (shown before any search/filter) — loaded once.
  useEffect(() => {
    let cancelled = false;
    void fetchCards({ sort: "price_desc", limit: 30 })
      .then((data) => {
        if (!cancelled) setInitialCards((data.cards ?? []) as CardWithSet[]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const hasAnyFilter =
    activeSet != null ||
    activeRarity != null ||
    activeColor != null ||
    activeCardType != null;
  const activeFilterCount = [
    activeSet,
    activeRarity,
    activeColor,
    activeCardType,
  ].filter(Boolean).length;

  useEffect(() => {
    const q = query.trim();
    const hasSearch = q.length >= 2;

    if (!hasSearch && !hasAnyFilter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale results when the query + filters both clear
      setResults([]);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the spinner immediately, before the debounced fetch
    setLoading(true);

    const timer = window.setTimeout(
      () => {
        void fetchCards({
          limit: 40,
          search: hasSearch ? q : undefined,
          set: activeSet ?? undefined,
          rarity: activeRarity ?? undefined,
          color: activeColor ?? undefined,
          type: activeCardType ?? undefined,
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
  }, [query, activeSet, activeRarity, activeColor, activeCardType, hasAnyFilter]);

  const clearAllFilters = () => {
    setActiveSet(null);
    setActiveRarity(null);
    setActiveColor(null);
    setActiveCardType(null);
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
      sets={sets}
      activeSet={activeSet}
      selectSetCode={setActiveSet}
      activeRarity={activeRarity}
      setActiveRarity={setActiveRarity}
      activeColor={activeColor}
      setActiveColor={setActiveColor}
      activeCardType={activeCardType}
      setActiveCardType={setActiveCardType}
      showFilters={showFilters}
      setShowFilters={setShowFilters}
      activeFilterCount={activeFilterCount}
      clearAllFilters={clearAllFilters}
      onSelectCard={onSelect}
      selectedIds={selectedIds}
    />
  );
}
