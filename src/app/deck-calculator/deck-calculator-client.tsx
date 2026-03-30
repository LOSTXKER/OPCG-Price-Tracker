"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";

import { AuthPreviewGate } from "@/components/shared/login-gate";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PriceDisplay } from "@/components/shared/price-display";
import { useAuthState } from "@/hooks/use-auth-state";
import { useCardSearch, type CardSearchResult } from "@/hooks/use-card-search";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";

type DeckRow = {
  id: number;
  name: string;
  leader: CardSearchResult | null;
  cards: { card: CardSearchResult; quantity: number }[];
};

export default function DeckCalculatorClient() {
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
    return <AuthPreviewGate preview={<DeckMockPreview lang={lang} />} />;
  }

  return <DeckCalculatorContent />;
}

function DeckCalculatorContent() {
  const lang = useUIStore((s) => s.language);
  const [decks, setDecks] = useState<DeckRow[]>([]);
  const [activeDeck, setActiveDeck] = useState<DeckRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchType, setSearchType] = useState<"leader" | "card">("card");
  const cardSearch = useCardSearch({
    typeFilter: searchType === "leader" ? "LEADER" : undefined,
  });
  const [newDeckName, setNewDeckName] = useState("");

  const loadDecks = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/decks");
      if (!res.ok) {
        if (res.status === 401) {
          setError(t(lang, "login"));
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
      setError(t(lang, "loadFailed"));
    }
    setLoading(false);
  }, [activeDeck, lang]);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  const createDeck = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        setError(t(lang, "addFailed"));
      } else {
        const data = (await res.json()) as { deck: DeckRow };
        setDecks((prev) => [data.deck, ...prev]);
        setActiveDeck(data.deck);
        setNewDeckName("");
      }
    } catch {
      setError(t(lang, "addFailed"));
    }
  };

  const addCard = async (card: CardSearchResult) => {
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
      if (!res.ok) {
        setError(t(lang, "addFailed"));
      } else {
        const data = (await res.json()) as { deck: DeckRow };
        setActiveDeck(data.deck);
        setDecks((prev) => prev.map((d) => (d.id === data.deck.id ? data.deck : d)));
      }
    } catch {
      setError(t(lang, "addFailed"));
    }
    setDialogOpen(false);
    cardSearch.reset();
  };

  const removeCard = async (cardId: number) => {
    if (!activeDeck) return;
    try {
      const res = await fetch(`/api/decks/${activeDeck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeCardIds: [cardId] }),
      });
      if (!res.ok) {
        setError(t(lang, "addFailed"));
      } else {
        const data = (await res.json()) as { deck: DeckRow };
        setActiveDeck(data.deck);
        setDecks((prev) => prev.map((d) => (d.id === data.deck.id ? data.deck : d)));
      }
    } catch {
      setError(t(lang, "addFailed"));
    }
  };

  const deleteDeck = async (deckId: number) => {
    try {
      const res = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (!res.ok) {
        setError(t(lang, "addFailed"));
        return;
      }
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      if (activeDeck?.id === deckId) setActiveDeck(null);
    } catch {
      setError(t(lang, "addFailed"));
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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "deckCalculatorNav")}</h1>
        <p className="text-muted-foreground text-sm">{t(lang, "deckCalculatorDesc")}</p>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            placeholder={t(lang, "newDeckName")}
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
          />
        </div>
        <Button onClick={() => void createDeck()} disabled={!newDeckName.trim()}>
          {t(lang, "createDeck")}
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
              <span className="text-muted-foreground text-sm">{totalCards}/50 {t(lang, "cardsCount")}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void deleteDeck(activeDeck.id)}
              >
                {t(lang, "deleteDeck")}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">{t(lang, "totalValue")}</p>
              <PriceDisplay priceJpy={totalPrice} showChange={false} size="lg" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t(lang, "leader")}</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchType("leader");
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-1 size-3" />
                {t(lang, "selectLeader")}
              </Button>
            </div>
            {activeDeck.leader ? (
              <div className="flex items-center gap-3 rounded-lg border p-2">
                {activeDeck.leader.imageUrl && (
                  <Image
                    src={activeDeck.leader.imageUrl}
                    alt={activeDeck.leader.nameEn ?? activeDeck.leader.nameJp}
                    width={40}
                    height={56}
                    className="rounded"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activeDeck.leader.nameEn ?? activeDeck.leader.nameJp}</p>
                  <p className="text-muted-foreground font-mono text-xs">{activeDeck.leader.cardCode}</p>
                </div>
                <PriceDisplay priceJpy={activeDeck.leader.latestPriceJpy} showChange={false} size="sm" />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t(lang, "noLeaderSelected")}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t(lang, "cardsInDeck")} ({totalCards} {t(lang, "cardsCount")})</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchType("card");
                  setDialogOpen(true);
                }}
              >
                <Plus className="mr-1 size-3" />
                {t(lang, "addCard")}
              </Button>
            </div>
            {activeDeck.cards.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t(lang, "noCardsInDeck")}</p>
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
                        alt={entry.card.nameEn ?? entry.card.nameJp}
                        width={32}
                        height={45}
                        className="rounded"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.card.nameEn ?? entry.card.nameJp}</p>
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
          <p className="text-muted-foreground text-sm">{t(lang, "createFirstDeck")}</p>
        </div>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {searchType === "leader" ? t(lang, "selectLeader") : t(lang, "addCard")}
            </DialogTitle>
            <DialogDescription>{t(lang, "searchByNameOrCode")}</DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t(lang, "searchByNameOrCode")}
            value={cardSearch.query}
            onChange={(e) => cardSearch.setQuery(e.target.value)}
            autoComplete="off"
          />
          <div className="max-h-60 space-y-1 overflow-auto rounded-md border p-1">
            {cardSearch.query.trim().length < 2 ? (
              <p className="text-muted-foreground px-2 py-3 text-sm">{t(lang, "typeAtLeast2Chars")}</p>
            ) : cardSearch.results.length === 0 ? (
              <p className="text-muted-foreground px-2 py-3 text-sm">{t(lang, "noResults")}</p>
            ) : (
              cardSearch.results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="hover:bg-muted block w-full rounded-md px-3 py-2 text-left text-sm"
                  onClick={() => void addCard(c)}
                >
                  <span className="font-medium">{c.nameEn ?? c.nameJp}</span>
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

function DeckMockPreview({ lang }: { lang: Language }) {
  const mockCards = [
    { code: "OP09-019", name: "Roronoa Zoro", price: "¥2,800", qty: 4 },
    { code: "OP09-044", name: "Boa Hancock", price: "¥1,900", qty: 4 },
    { code: "OP09-033", name: "Sanji", price: "¥450", qty: 4 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t(lang, "deckCalculatorNav")}</h1>
        <p className="text-muted-foreground text-sm">{t(lang, "deckCalculatorDesc")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <div className="h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            {t(lang, "newDeckName")}
          </div>
        </div>
        <div className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {t(lang, "createDeck")}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My OP-09 Deck</h2>
          <span className="text-muted-foreground text-sm">12/50 {t(lang, "cardsCount")}</span>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">{t(lang, "totalValue")}</p>
            <p className="font-price text-lg font-bold">¥23,400</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t(lang, "leader")}</h3>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-2">
            <div className="size-10 rounded bg-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Monkey D. Luffy</p>
              <p className="text-muted-foreground font-mono text-xs">OP09-001</p>
            </div>
            <p className="font-price text-sm font-semibold">¥3,200</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">{t(lang, "cardsInDeck")} (12 {t(lang, "cardsCount")})</h3>
          <div className="space-y-1">
            {mockCards.map((c) => (
              <div key={c.code} className="flex items-center gap-3 rounded-lg border p-2">
                <div className="size-8 rounded bg-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-muted-foreground font-mono text-xs">{c.code} x{c.qty}</p>
                </div>
                <p className="font-price text-sm font-semibold">{c.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
