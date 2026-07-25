"use client";

import { useCallback, useEffect, useState, useMemo } from "react";

import { ApiError, apiGet } from "@/lib/api/client";

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

/** Loose shape of a card row from `/api/cards` — only the fields this hook maps. */
type RawCompareCard = {
  cardCode: string;
  nameJp: string;
  nameEn?: string | null;
  nameTh?: string | null;
  rarity: string;
  cardType: string;
  color?: string | null;
  colorEn?: string | null;
  cost?: number | null;
  power?: number | null;
  counter?: number | null;
  life?: number | null;
  attribute?: string | null;
  trait?: string | null;
  isParallel?: boolean;
  imageUrl?: string | null;
  set?: { code?: string } | null;
  latestPriceJpy?: number | null;
  priceChange24h?: number | null;
  priceChange7d?: number | null;
  priceChange30d?: number | null;
};

export type { CompareCard, PriceHistoryEntry };

export function useCompareData(codes: string[]) {
  const [cards, setCards] = useState<CompareCard[]>([]);
  const [priceHistory, setPriceHistory] = useState<
    Record<string, PriceHistoryEntry[]>
  >({});
  // Free includes 30 days. Start from the universally available range so the
  // selected control never claims 90 days while the API silently caps to 30.
  const [days, setDays] = useState(30);
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
      const data = await apiGet<{ cards?: RawCompareCard[] }>(
        `/api/cards?codes=${cardCodes.join(",")}&limit=${cardCodes.length}`
      );
      const mapped: CompareCard[] = (data.cards ?? []).map((c) => ({
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
        setCode: c.set?.code ?? "",
        currentPrice: c.latestPriceJpy ?? null,
        change24h: c.priceChange24h ?? null,
        change7d: c.priceChange7d ?? null,
        change30d: c.priceChange30d ?? null,
      }));
      setCards(mapped);
    } catch (err) {
      setError(err instanceof ApiError
        ? `Failed to load cards (${err.status})`
        : "Failed to load card data");
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
        const data = await apiGet<{ cards?: { cardCode: string; priceHistory: PriceHistoryEntry[] }[] }>(
          `/api/analytics/compare?cards=${cardCodes.join(",")}&days=${d}`
        );
        setChartLocked(false);
        const map: Record<string, PriceHistoryEntry[]> = {};
        for (const card of data.cards ?? []) {
          map[card.cardCode] = card.priceHistory;
        }
        setPriceHistory(map);
      } catch (err) {
        // Pro-gated chart: 401/403 → show the lock, other failures degrade silently.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setChartLocked(true);
        }
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
