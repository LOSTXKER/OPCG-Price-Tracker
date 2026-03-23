"use client";

import { Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CardItem } from "@/components/cards/card-item";
import { CardGrid } from "@/components/cards/card-grid";
import { Button } from "@/components/ui/button";

type WatchCard = {
  id: number;
  cardCode: string;
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
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <p className="text-muted-foreground text-sm">กำลังโหลด…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-muted-foreground text-sm">การ์ดที่คุณติดตาม</p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {items.length === 0 ? (
        <div className="bg-muted/40 rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground text-sm">
            เพิ่มการ์ดเข้า Watchlist โดยกดดาว ⭐
          </p>
        </div>
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
                className="absolute top-2 right-2 z-10 shadow-md"
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
