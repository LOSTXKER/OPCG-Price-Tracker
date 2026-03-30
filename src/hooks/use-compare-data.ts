"use client";

import { useCallback, useEffect, useState, useMemo } from "react";

type CompareCard = {
  cardCode: string;
  nameJp: string;
  nameEn: string | null;
  nameTh: string | null;
  rarity: string;
  cardType: string;
  color: string;
  cost: number | null;
  power: number | null;
  counter: number | null;
  life: number | null;
  attribute: string | null;
  trait: string | null;
  isParallel: boolean;
  imageUrl: string | null;
  setCode: string;
  currentPrice: number | null;
  change24h: number | null;
  change7d: number | null;
  change30d: number | null;
};

type PriceHistoryEntry = { price: number | null; date: string };

export type { CompareCard, PriceHistoryEntry };

export function useCompareData(codes: string[]) {
  const [cards, setCards] = useState<CompareCard[]>([]);
  const [priceHistory, setPriceHistory] = useState<
    Record<string, PriceHistoryEntry[]>
  >({});
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartLocked, setChartLocked] = useState(false);

  const fetchCardSpecs = useCallback(async (cardCodes: string[]) => {
    if (cardCodes.length === 0) {
      setCards([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/cards?codes=${cardCodes.join(",")}&limit=${cardCodes.length}`
      );
      if (!res.ok) {
        setError(`Failed to load cards (${res.status})`);
        return;
      }
      const data = await res.json();
      const mapped: CompareCard[] = (data.cards ?? []).map(
        (c: Record<string, unknown>) => ({
          cardCode: c.cardCode,
          nameJp: c.nameJp,
          nameEn: c.nameEn ?? null,
          nameTh: c.nameTh ?? null,
          rarity: c.rarity,
          cardType: c.cardType,
          color: c.color ?? c.colorEn ?? "",
          cost: c.cost ?? null,
          power: c.power ?? null,
          counter: c.counter ?? null,
          life: c.life ?? null,
          attribute: c.attribute ?? null,
          trait: c.trait ?? null,
          isParallel: !!c.isParallel,
          imageUrl: c.imageUrl ?? null,
          setCode: (c.set as { code?: string })?.code ?? "",
          currentPrice: c.latestPriceJpy ?? null,
          change24h: c.priceChange24h ?? null,
          change7d: c.priceChange7d ?? null,
          change30d: c.priceChange30d ?? null,
        })
      );
      setCards(mapped);
    } catch {
      setError("Failed to load card data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPriceHistory = useCallback(
    async (cardCodes: string[], d: number) => {
      if (cardCodes.length === 0) {
        setPriceHistory({});
        return;
      }
      try {
        const res = await fetch(
          `/api/analytics/compare?cards=${cardCodes.join(",")}&days=${d}`
        );
        if (res.status === 401 || res.status === 403) {
          setChartLocked(true);
          return;
        }
        if (!res.ok) return;
        setChartLocked(false);
        const data = await res.json();
        const map: Record<string, PriceHistoryEntry[]> = {};
        for (const card of data.cards ?? []) {
          map[card.cardCode] = card.priceHistory;
        }
        setPriceHistory(map);
      } catch {
        /* graceful failure */
      }
    },
    []
  );

  useEffect(() => {
    fetchCardSpecs(codes);
  }, [codes, fetchCardSpecs]);

  useEffect(() => {
    fetchPriceHistory(codes, days);
  }, [codes, days, fetchPriceHistory]);

  const chartData = useMemo(() => {
    const dateMap: Record<string, Record<string, number | null>> = {};
    for (const [cardCode, entries] of Object.entries(priceHistory)) {
      for (const ph of entries) {
        if (!dateMap[ph.date]) dateMap[ph.date] = {};
        dateMap[ph.date][cardCode] = ph.price;
      }
    }
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, prices]) => ({ date, ...prices }));
  }, [priceHistory]);

  const orderedCards = useMemo(() => {
    return codes
      .map((code) => cards.find((c) => c.cardCode === code))
      .filter(Boolean) as CompareCard[];
  }, [codes, cards]);

  const lowestPriceCode = useMemo(() => {
    const withPrice = orderedCards.filter(
      (c) => c.currentPrice != null && c.currentPrice > 0
    );
    if (withPrice.length < 2) return null;
    const min = Math.min(...withPrice.map((c) => c.currentPrice!));
    return withPrice.find((c) => c.currentPrice === min)?.cardCode ?? null;
  }, [orderedCards]);

  return {
    cards,
    orderedCards,
    chartData,
    lowestPriceCode,
    days,
    setDays,
    loading,
    error,
    chartLocked,
    hasChart: chartData.length > 0 && !chartLocked,
  };
}
