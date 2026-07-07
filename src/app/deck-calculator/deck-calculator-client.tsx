"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { QtyStepper } from "@/components/ui/qty-stepper";

import { AuthPreviewGate } from "@/components/shared/login-gate";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PriceTag } from "@/components/ui/price-tag";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import { useAuthState } from "@/hooks/use-auth-state";
import { invalidateSettings } from "@/hooks/use-settings";
import { useCardSearch, type CardSearchResult } from "@/hooks/use-card-search";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { useUIStore } from "@/stores/ui-store";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LimitCounter } from "@/components/shared/limit-counter";
import { UpgradeBadge } from "@/components/shared/upgrade-badge";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { PageHeader } from "@/components/layout/page-header";

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
        <Skeleton className="h-64 rounded-xl shadow-[var(--panel-shadow)]" />
      </div>
    );
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<DeckMockPreview lang={lang} />} />;
  }

  return <DeckCalculatorContent />;
}

/** OPTCG allows up to 4 copies of a card by name. */
const MAX_COPIES = 4;

function DeckCalculatorContent() {
  const lang = useUIStore((s) => s.language);
  const confirm = useConfirm();
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
  const { limits } = useTierLimits();
  const { openUpgradeDialog } = useUpgradeDialog();
  const deckLimitReached = isFinite(limits.deckCount) && decks.length >= limits.deckCount;

  const loadDecks = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<{ decks: DeckRow[] }>("/api/decks");
      setDecks(data.decks ?? []);
      if (!activeDeck && data.decks?.length) {
        setActiveDeck(data.decks[0]);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        invalidateSettings();
        const supabase = createClient();
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setError(t(lang, "loadFailed"));
    }
    setLoading(false);
  }, [activeDeck, lang]);

  useEffect(() => {
    const t = setTimeout(() => void loadDecks(), 0);
    return () => clearTimeout(t);
  }, [loadDecks]);

  const createDeck = async () => {
    const name = newDeckName.trim();
    if (!name) return;
    try {
      const data = await apiPost<{ deck: DeckRow }>("/api/decks", { name });
      setDecks((prev) => [data.deck, ...prev]);
      setActiveDeck(data.deck);
      setNewDeckName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t(lang, "addFailed"));
    }
  };

  const addCard = async (card: CardSearchResult) => {
    if (!activeDeck) return;
    // Adding a card that's already in the deck bumps its copy count (up to 4)
    // instead of resetting it to 1 — and we keep the dialog open in card mode so
    // several distinct cards can be added in one sitting (VISION §5.4).
    const existingQty =
      activeDeck.cards.find((e) => e.card.id === card.id)?.quantity ?? 0;
    const body =
      searchType === "leader"
        ? { leaderId: card.id }
        : { addCards: [{ cardId: card.id, quantity: Math.min(MAX_COPIES, existingQty + 1) }] };
    try {
      const data = await apiPatch<{ deck: DeckRow }>(`/api/decks/${activeDeck.id}`, body);
      setActiveDeck(data.deck);
      setDecks((prev) => prev.map((d) => (d.id === data.deck.id ? data.deck : d)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t(lang, "addFailed"));
    }
    if (searchType === "leader") {
      setDialogOpen(false);
      cardSearch.reset();
    }
  };

  const setCardQuantity = async (cardId: number, quantity: number) => {
    if (!activeDeck) return;
    if (quantity < 1) {
      void removeCard(cardId);
      return;
    }
    try {
      const data = await apiPatch<{ deck: DeckRow }>(`/api/decks/${activeDeck.id}`, {
        addCards: [{ cardId, quantity: Math.min(MAX_COPIES, quantity) }],
      });
      setActiveDeck(data.deck);
      setDecks((prev) => prev.map((d) => (d.id === data.deck.id ? data.deck : d)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t(lang, "addFailed"));
    }
  };

  const removeCard = async (cardId: number) => {
    if (!activeDeck) return;
    try {
      const data = await apiPatch<{ deck: DeckRow }>(`/api/decks/${activeDeck.id}`, {
        removeCardIds: [cardId],
      });
      setActiveDeck(data.deck);
      setDecks((prev) => prev.map((d) => (d.id === data.deck.id ? data.deck : d)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t(lang, "addFailed"));
    }
  };

  const deleteDeck = async (deckId: number) => {
    try {
      await apiDelete(`/api/decks/${deckId}`);
      setDecks((prev) => prev.filter((d) => d.id !== deckId));
      if (activeDeck?.id === deckId) setActiveDeck(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t(lang, "addFailed"));
    }
  };

  const confirmDeleteDeck = async (deck: DeckRow) => {
    const ok = await confirm({
      title: `${t(lang, "deleteDeck")} · ${deck.name}`,
      description: t(lang, "confirmDeleteDeck"),
      confirmLabel: t(lang, "deleteDeck"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    });
    if (ok) void deleteDeck(deck.id);
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
        <Skeleton className="h-64 rounded-xl shadow-[var(--panel-shadow)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t(lang, "deckCalculatorNav")}
        description={t(lang, "deckCalculatorDesc")}
      />

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex flex-wrap items-end gap-2">
        <div
          className={cn(
            "min-w-0 flex-1",
            deckLimitReached && "cursor-pointer",
          )}
          onClick={
            deckLimitReached
              ? () => openUpgradeDialog({ featureKey: "deckCount" })
              : undefined
          }
        >
          <Input
            placeholder={t(lang, "newDeckName")}
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            disabled={deckLimitReached}
          />
        </div>
        {deckLimitReached ? (
          <div className="flex items-center gap-2 text-meta">
            <LimitCounter current={decks.length} max={limits.deckCount} />
            <UpgradeBadge featureKey="deckCount" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={() => void createDeck()} disabled={!newDeckName.trim()}>
              {t(lang, "createDeck")}
            </Button>
            {isFinite(limits.deckCount) && (
              <LimitCounter current={decks.length} max={limits.deckCount} />
            )}
          </div>
        )}
      </div>

      {decks.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {decks.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDeck(d)}
              className={`ease-chrome rounded-lg border px-3 py-1.5 text-sm font-medium ${
                activeDeck?.id === d.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-hair hover:bg-muted"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      )}

      {activeDeck ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate text-h3">{activeDeck.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{totalCards}/50 {t(lang, "cardsCount")}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void confirmDeleteDeck(activeDeck)}
              >
                {t(lang, "deleteDeck")}
              </Button>
            </div>
          </div>

          <Surface variant="outline" padding="md">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm font-medium">{t(lang, "totalValue")}</p>
              <PriceTag jpy={totalPrice} showChange={false} size="lg" />
            </div>
          </Surface>

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
              <div className="flex items-center gap-3 rounded-lg border border-hair p-2">
                {activeDeck.leader.imageUrl && (
                  <Image
                    src={activeDeck.leader.imageUrl}
                    alt={activeDeck.leader.nameEn ?? activeDeck.leader.nameJp}
                    width={40}
                    height={56}
                    className="rounded-sm"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{activeDeck.leader.nameEn ?? activeDeck.leader.nameJp}</p>
                  <p className="text-muted-foreground font-mono text-xs">{activeDeck.leader.cardCode}</p>
                </div>
                <PriceTag jpy={activeDeck.leader.latestPriceJpy} showChange={false} size="sm" />
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
                    className="flex items-center gap-3 rounded-lg border border-hair p-2"
                  >
                    {entry.card.imageUrl && (
                      <Image
                        src={entry.card.imageUrl}
                        alt={entry.card.nameEn ?? entry.card.nameJp}
                        width={32}
                        height={45}
                        className="rounded-sm"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.card.nameEn ?? entry.card.nameJp}</p>
                      <p className="text-muted-foreground font-mono text-xs">
                        {entry.card.cardCode}
                      </p>
                    </div>
                    <QtyStepper
                      variant="joined"
                      size="sm"
                      showInput={false}
                      value={entry.quantity}
                      onChange={(q) => void setCardQuantity(entry.card.id, q)}
                      min={0}
                      max={MAX_COPIES}
                      decreaseLabel={t(lang, "decrease")}
                      increaseLabel={t(lang, "increase")}
                    />
                    <PriceTag
                      jpy={(entry.card.latestPriceJpy ?? 0) * entry.quantity}
                      showChange={false}
                      size="sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t(lang, "remove")}
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
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-hair py-16 text-center">
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
          <div className="max-h-60 space-y-1 overflow-auto rounded-lg border border-hair p-1">
            {cardSearch.query.trim().length < 2 ? (
              <p className="text-muted-foreground px-2 py-3 text-sm">{t(lang, "typeAtLeast2Chars")}</p>
            ) : cardSearch.results.length === 0 ? (
              <p className="text-muted-foreground px-2 py-3 text-sm">{t(lang, "noResults")}</p>
            ) : (
              cardSearch.results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="ease-chrome block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/70"
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
      <PageHeader
        title={t(lang, "deckCalculatorNav")}
        description={t(lang, "deckCalculatorDesc")}
      />

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <div className="h-10 rounded-lg border border-hair bg-background px-3 py-2 text-sm text-muted-foreground">
            {t(lang, "newDeckName")}
          </div>
        </div>
        <div className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {t(lang, "createDeck")}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-h3">My OP-09 Deck</h2>
          <span className="text-muted-foreground text-sm">12/50 {t(lang, "cardsCount")}</span>
        </div>

        <Surface variant="outline" padding="md">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm font-medium">{t(lang, "totalValue")}</p>
            <p className="font-price text-lg font-bold">¥23,400</p>
          </div>
        </Surface>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t(lang, "leader")}</h3>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-hair p-2">
            <div className="size-10 rounded-sm bg-muted" />
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
              <div key={c.code} className="flex items-center gap-3 rounded-lg border border-hair p-2">
                <div className="size-8 rounded-sm bg-muted" />
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
