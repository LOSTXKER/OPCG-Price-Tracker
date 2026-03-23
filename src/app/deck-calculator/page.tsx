"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/shared/price-display";

type CardData = {
  id: number;
  cardCode: string;
  nameJp: string;
  rarity: string;
  imageUrl: string | null;
  latestPriceJpy: number | null;
  cardType: string;
};

type DeckCardEntry = {
  card: CardData;
  quantity: number;
};

type DeckRow = {
  id: number;
  name: string;
  leader: CardData | null;
  cards: { card: CardData; quantity: number }[];
};

export default function DeckCalculatorPage() {
  const [decks, setDecks] = useState<DeckRow[]>([]);
  const [activeDeck, setActiveDeck] = useState<DeckRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchType, setSearchType] = useState<"leader" | "card">("card");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<CardData[]>([]);
  const [newDeckName, setNewDeckName] = useState("");

  const loadDecks = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/decks");
      if (!res.ok) {
        if (res.status === 401) {
          setError("กรุณาเข้าสู่ระบบเพื่อใช้ Deck Calculator");
          setLoading(false);
          return;
        }
        throw new Error("Failed");
      }
      const data = (await res.json()) as { decks: DeckRow[] };
      setDecks(data.decks ?? []);
      if (!activeDeck && data.decks?.length) {
        setActiveDeck(data.decks[0]);
      }
    } catch {
      setError("โหลดข้อมูลไม่สำเร็จ");
    }
    setLoading(false);
  }, [activeDeck]);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    const typeFilter = searchType === "leader" ? "&type=LEADER" : "";
    const t = window.setTimeout(() => {
      void fetch(`/api/cards?search=${encodeURIComponent(q)}&limit=20${typeFilter}`)
        .then((r) => r.json())
        .then((j: { cards: CardData[] }) => setSearchResults(j.cards ?? []))
        .catch(() => setSearchResults([]));
    }, 300);
    return () => window.clearTimeout(t);
  }, [search, searchType]);

  const createDeck = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const data = (await res.json()) as { deck: DeckRow };
        setDecks((prev) => [data.deck, ...prev]);
        setActiveDeck(data.deck);
        setNewDeckName("");
      }
    } catch {
      setError("สร้าง Deck ไม่สำเร็จ");
    }
  };

  const addCard = async (card: CardData) => {
    if (!activeDeck) return;
    try {
      const res = await fetch(`/api/decks/${activeDeck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          searchType === "leader"
            ? { leaderId: card.id }
            : { addCards: [{ cardId: card.id, quantity: 1 }] }
        ),
      });
      if (res.ok) {
        const data = (await res.json()) as { deck: DeckRow };
        setActiveDeck(data.deck);
        setDecks((prev) => prev.map((d) => (d.id === data.deck.id ? data.deck : d)));
      }
    } catch {
      setError("เพิ่มการ์ดไม่สำเร็จ");
    }
    setDialogOpen(false);
    setSearch("");
  };

  const removeCard = async (cardId: number) => {
    if (!activeDeck) return;
    try {
      const res = await fetch(`/api/decks/${activeDeck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeCardIds: [cardId] }),
      });
      if (res.ok) {
        const data = (await res.json()) as { deck: DeckRow };
        setActiveDeck(data.deck);
        setDecks((prev) => prev.map((d) => (d.id === data.deck.id ? data.deck : d)));
      }
    } catch {
      setError("ลบการ์ดไม่สำเร็จ");
    }
  };

  const deleteDeck = async (deckId: number) => {
    try {
      await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      if (activeDeck?.id === deckId) setActiveDeck(null);
    } catch {
      setError("ลบ Deck ไม่สำเร็จ");
    }
  };

  const totalPrice = useMemo(() => {
    if (!activeDeck) return 0;
    let total = activeDeck.leader?.latestPriceJpy ?? 0;
    for (const entry of activeDeck.cards) {
      total += (entry.card.latestPriceJpy ?? 0) * entry.quantity;
    }
    return total;
  }, [activeDeck]);

  const totalCards = useMemo(() => {
    if (!activeDeck) return 0;
    return activeDeck.cards.reduce((sum, e) => sum + e.quantity, 0);
  }, [activeDeck]);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-muted-foreground text-sm">กำลังโหลด…</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Deck Calculator</h1>
        <p className="text-muted-foreground text-sm">สร้าง Deck และคำนวณราคารวม</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            placeholder="ชื่อ Deck ใหม่"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
          />
        </div>
        <Button onClick={() => void createDeck()} disabled={!newDeckName.trim()}>
          สร้าง Deck
        </Button>
      </div>

      {decks.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {decks.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDeck(d)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                activeDeck?.id === d.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {activeDeck ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{activeDeck.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{totalCards}/50 ใบ</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void deleteDeck(activeDeck.id)}
              >
                ลบ Deck
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">ราคารวม Deck</p>
              <PriceDisplay priceJpy={totalPrice} showChange={false} size="lg" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Leader</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchType("leader");
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-1 size-3" />
                เลือก Leader
              </Button>
            </div>
            {activeDeck.leader ? (
              <div className="flex items-center gap-3 rounded-lg border p-2">
                {activeDeck.leader.imageUrl && (
                  <Image
                    src={activeDeck.leader.imageUrl}
                    alt={activeDeck.leader.nameJp}
                    width={40}
                    height={56}
                    className="rounded"
                    unoptimized
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activeDeck.leader.nameJp}</p>
                  <p className="text-muted-foreground font-mono text-xs">{activeDeck.leader.cardCode}</p>
                </div>
                <PriceDisplay priceJpy={activeDeck.leader.latestPriceJpy} showChange={false} size="sm" />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">ยังไม่ได้เลือก Leader</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">การ์ดใน Deck ({totalCards} ใบ)</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchType("card");
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-1 size-3" />
                เพิ่มการ์ด
              </Button>
            </div>
            {activeDeck.cards.length === 0 ? (
              <p className="text-muted-foreground text-sm">ยังไม่มีการ์ดใน Deck</p>
            ) : (
              <div className="space-y-1">
                {activeDeck.cards.map((entry) => (
                  <div
                    key={entry.card.id}
                    className="flex items-center gap-3 rounded-lg border p-2"
                  >
                    {entry.card.imageUrl && (
                      <Image
                        src={entry.card.imageUrl}
                        alt={entry.card.nameJp}
                        width={32}
                        height={45}
                        className="rounded"
                        unoptimized
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.card.nameJp}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {entry.card.cardCode} x{entry.quantity}
                      </p>
                    </div>
                    <PriceDisplay
                      priceJpy={(entry.card.latestPriceJpy ?? 0) * entry.quantity}
                      showChange={false}
                      size="sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void removeCard(entry.card.id)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : decks.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <p className="text-muted-foreground text-sm">สร้าง Deck แรกของคุณ</p>
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {searchType === "leader" ? "เลือก Leader" : "เพิ่มการ์ด"}
            </DialogTitle>
            <DialogDescription>พิมพ์ชื่อหรือรหัสการ์ด</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="ค้นหา…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          <div className="max-h-60 space-y-1 overflow-auto rounded-md border p-1">
            {search.trim().length < 2 ? (
              <p className="text-muted-foreground px-2 py-3 text-sm">พิมพ์อย่างน้อย 2 ตัวอักษร</p>
            ) : searchResults.length === 0 ? (
              <p className="text-muted-foreground px-2 py-3 text-sm">ไม่พบผลลัพธ์</p>
            ) : (
              searchResults.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="hover:bg-muted block w-full rounded-md px-3 py-2 text-left text-sm"
                  onClick={() => void addCard(c)}
                >
                  <span className="font-medium">{c.nameJp}</span>
                  <span className="text-muted-foreground block font-mono text-xs">{c.cardCode}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
