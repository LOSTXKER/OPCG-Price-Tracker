"use client";

import { Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CardItem } from "@/components/cards/card-item";
import { CardGrid } from "@/components/cards/card-grid";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/hooks/use-auth-state";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";

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

export default function WatchlistClient() {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  if (authed === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<WatchlistMockPreview lang={lang} />} />;
  }

  return <WatchlistContent />;
}

function WatchlistContent() {
  const lang = useUIStore((s) => s.language);
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/watchlist");
    if (!res.ok) {
      setError(t(lang, "loadFailed"));
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { items: WatchlistEntry[] };
    setItems(data.items ?? []);
    setLoading(false);
  }, [lang]);

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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "watchlistNav")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t(lang, "emptyWatchlistDesc")}</p>
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
                aria-label={t(lang, "removeFromWatchlist")}
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

function WatchlistMockPreview({ lang }: { lang: Language }) {
  const cards = [
    { code: "OP09-001", name: "Monkey D. Luffy", price: "¥3,200", change: "+12%" },
    { code: "OP09-019", name: "Roronoa Zoro", price: "¥2,800", change: "+5%" },
    { code: "OP09-044", name: "Boa Hancock", price: "¥1,900", change: "-3%" },
    { code: "OP08-058", name: "Trafalgar Law", price: "¥1,500", change: "+8%" },
    { code: "OP08-001", name: "Nami", price: "¥980", change: "+2%" },
    { code: "OP07-034", name: "Shanks", price: "¥4,100", change: "-1%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t(lang, "watchlistNav")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(lang, "emptyWatchlistDesc")}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.code} className="rounded-xl border border-border/40 bg-card overflow-hidden">
            <div className="aspect-[3/4] bg-muted" />
            <div className="p-3 space-y-1">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{c.code}</p>
              <div className="flex items-center justify-between">
                <p className="font-price text-sm font-semibold">{c.price}</p>
                <span className={`text-xs font-medium ${c.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                  {c.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
