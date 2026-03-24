"use client";

import { Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CardItem } from "@/components/cards/card-item";
import { CardGrid } from "@/components/cards/card-grid";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { Button } from "@/components/ui/button";

type WatchCard = {
  id: number;
  cardCode: string;
  baseCode: string | null;
  nameJp: string;
  nameEn: string | null;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  latestPriceThb: number | null;
  priceChange7d: number | null;
  set: { code: string };
};

type WatchlistEntry = {
  id: number;
  cardId: number;
  card: WatchCard;
};

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/watchlist");
    if (!res.ok) {
      setError("โหลด Watchlist ไม่สำเร็จ");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { items: WatchlistEntry[] };
    setItems(data.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async (cardId: number) => {
    setRemoving(cardId);
    try {
      const res = await fetch(`/api/watchlist?cardId=${cardId}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((x) => x.cardId !== cardId));
      }
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="panel animate-pulse p-8">
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="mt-3 h-6 w-48 rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-bold tracking-tight">Watchlist</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">การ์ดที่คุณติดตาม</p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {items.length === 0 ? (
        <KumaEmptyState preset="empty-watchlist" />
      ) : (
        <CardGrid>
          {items.map((entry) => (
            <div key={entry.id} className="relative">
              <CardItem
                cardCode={entry.card.cardCode}
                nameJp={entry.card.nameJp}
                nameEn={entry.card.nameEn}
                rarity={entry.card.rarity}
                imageUrl={entry.card.imageUrl}
                priceJpy={entry.card.latestPriceJpy}
                priceThb={entry.card.latestPriceThb}
                priceChange7d={entry.card.priceChange7d}
                setCode={entry.card.set.code}
              />
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="absolute top-2 right-2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                aria-label="ลบออกจาก Watchlist"
                disabled={removing === entry.cardId}
                onClick={() => void remove(entry.cardId)}
              >
                <Star className="size-4 fill-amber-400 text-amber-500" />
              </Button>
            </div>
          ))}
        </CardGrid>
      )}
    </div>
  );
}
