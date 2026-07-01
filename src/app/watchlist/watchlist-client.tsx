"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { PageHeader } from "@/components/layout/page-header";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { ApiError, apiDelete, apiGet, apiPatch, apiTry } from "@/lib/api/client";
import { useAuthState } from "@/hooks/use-auth-state";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { invalidateSettings } from "@/hooks/use-settings";
import { createClient } from "@/lib/supabase/client";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { useGameFilterReset } from "@/hooks/use-game-filter";
import { useMultigameDemo, MOCK_POKEMON_WATCHLIST } from "@/lib/mock/multigame-demo";
import { GameFilterChips, type GameChip } from "@/components/shared/game-filter-chips";
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants";
import { getGameConfig } from "@/lib/game-config";

import { WatchlistAddDialog } from "./watchlist-add-dialog";
import { WatchlistEmpty } from "./watchlist-empty";
import { WatchlistGridView } from "./watchlist-grid-view";
import { WatchlistListView } from "./watchlist-list-view";
import { WatchlistMockPreview } from "./watchlist-mock-preview";
import { WatchlistSummary } from "./watchlist-summary";
import { WatchlistToolbar } from "./watchlist-toolbar";
import { sortEntries } from "./watchlist-sort";
import {
  DEFAULT_FILTERS,
  getEntryChange,
  type ChangePeriod,
  type SortKey,
  type WatchView,
  type WatchlistEntry,
  type WatchlistFilters,
} from "./watchlist-types";

const VIEW_STORAGE_KEY = "opcg.watchlist.view";

export default function WatchlistClient() {
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
    return <AuthPreviewGate preview={<WatchlistMockPreview lang={lang} />} />;
  }

  return <WatchlistContent />;
}

function WatchlistContent() {
  const lang = useUIStore((s) => s.language);
  const { limits } = useTierLimits();
  const confirm = useConfirm();

  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [view, setView] = useLocalStorage<WatchView>(VIEW_STORAGE_KEY, "list");
  const [period, setPeriod] = useState<ChangePeriod>("7d");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [filters, setFilters] = useState<WatchlistFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  // One unified watchlist across every game, filtered in-view by game. The filter
  // is PER-PAGE (local, session-only) — never shared with portfolio/alerts.
  const [gameFilter, setGameFilter] = useState<string>(ALL_GAMES);
  const demo = useMultigameDemo();
  const availableGames = useMemo(
    () => [...new Set(items.map((e) => e.card.set.game?.slug ?? DEFAULT_GAME))],
    [items],
  );
  useGameFilterReset(gameFilter, availableGames, setGameFilter);
  const [addOpen, setAddOpen] = useState(false);

  const [alertTarget, setAlertTarget] = useState<WatchlistEntry | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const [sparklines, setSparklines] = useState<Record<number, number[]>>({});
  const sparklineFetchedRef = useRef<Set<number>>(new Set());

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiGet<{ items: WatchlistEntry[] }>("/api/watchlist");
      // Demo-only: append mock Pokémon entries so the multi-game UI is visible.
      setItems([...(data.items ?? []), ...(demo ? MOCK_POKEMON_WATCHLIST : [])]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        invalidateSettings();
        toast.error(t(lang, "watchlistSessionExpired"));
        const supabase = createClient();
        await supabase.auth.signOut();
      } else {
        setError(t(lang, "loadFailed"));
      }
    } finally {
      setLoading(false);
    }
  }, [lang, demo]);

  useEffect(() => {
    void load();
  }, [load]);

  // Fetch sparklines for visible cards (list view only, lazy)
  useEffect(() => {
    if (view !== "list") return;
    const ids = items
      .map((i) => i.cardId)
      .filter((id) => !sparklineFetchedRef.current.has(id));
    if (ids.length === 0) return;
    ids.forEach((id) => sparklineFetchedRef.current.add(id));
    const params = ids.slice(0, 50).join(",");
    void apiTry(
      apiGet<{ sparklines?: Record<number, number[]> }>(
        `/api/cards/sparklines?ids=${params}`
      )
    ).then((data) => {
      // ignore failures — sparkline is optional eye-candy
      if (data?.sparklines) {
        setSparklines((prev) => ({ ...prev, ...data.sparklines }));
      }
    });
  }, [items, view]);

  const setOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const e of items) {
      const code = e.card.set.code;
      if (!seen.has(code)) seen.set(code, code.toUpperCase());
    }
    return Array.from(seen.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [items]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = items.filter((entry) => {
      if (
        gameFilter !== ALL_GAMES &&
        (entry.card.set.game?.slug ?? DEFAULT_GAME) !== gameFilter
      )
        return false;
      if (filters.pinnedOnly && entry.pinnedAt == null) return false;
      if (filters.hasAlert && !entry.hasActiveAlert) return false;
      if (filters.setCodes.length > 0 && !filters.setCodes.includes(entry.card.set.code)) {
        return false;
      }
      if (filters.direction) {
        const change = getEntryChange(entry, period);
        if (change == null) return false;
        if (filters.direction === "up" && change <= 0) return false;
        if (filters.direction === "down" && change >= 0) return false;
      }
      if (q) {
        const name = `${entry.card.nameEn ?? ""} ${entry.card.nameJp ?? ""} ${entry.card.nameTh ?? ""}`.toLowerCase();
        const code = entry.card.cardCode.toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }
      return true;
    });

    out = sortEntries(out, sortKey, period);
    return out;
  }, [items, search, filters, sortKey, period, gameFilter]);

  // Per-game counts + logos for the chip rail (cross-game, from all items).
  const gameMeta = useMemo(() => {
    const count = new Map<string, number>();
    const logo = new Map<string, string | null>();
    for (const e of items) {
      const g = e.card.set.game;
      const slug = g?.slug ?? DEFAULT_GAME;
      count.set(slug, (count.get(slug) ?? 0) + 1);
      if (g?.logoUrl && !logo.has(slug)) logo.set(slug, g.logoUrl);
    }
    return { count, logo };
  }, [items]);

  // Chips for games the user actually watches cards in (count > 0). The rail
  // self-hides below two games.
  const gameChips = useMemo<GameChip[]>(
    () =>
      [...gameMeta.count.entries()]
        .filter(([, c]) => c > 0)
        .map(([slug, c]) => ({
          slug,
          label: getGameConfig(slug)?.shortName ?? slug.toUpperCase(),
          value: `${c} ${t(lang, "card")}`,
          logoUrl: gameMeta.logo.get(slug) ?? null,
        })),
    [gameMeta, lang],
  );

  const toggleSelect = (cardId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const visibleIds = filteredEntries.map((e) => e.cardId);
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        visibleIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const removeSingle = async (entry: WatchlistEntry) => {
    const cardName = getCardName(lang, entry.card);
    const ok = await confirm({
      title: cardName,
      description: t(lang, "watchlistConfirmRemove"),
      confirmLabel: t(lang, "removeFromWatchlist"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    });
    if (!ok) return;

    const previousItems = items;
    setRemovingIds((prev) => new Set(prev).add(entry.cardId));
    setItems((prev) => prev.filter((x) => x.cardId !== entry.cardId));
    setSelected((prev) => {
      if (!prev.has(entry.cardId)) return prev;
      const next = new Set(prev);
      next.delete(entry.cardId);
      return next;
    });

    try {
      await apiDelete(`/api/watchlist?cardId=${entry.cardId}`);
      toast.success(t(lang, "watchlistRemoved"));
    } catch {
      setItems(previousItems);
      toast.error(t(lang, "watchlistUpdateFailed"));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.cardId);
        return next;
      });
    }
  };

  const removeBulk = async () => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const ok = await confirm({
      title: t(lang, "watchlistConfirmBulkRemoveTitle"),
      description: `${t(lang, "watchlistConfirmBulkRemoveDesc")} (${ids.length})`,
      confirmLabel: t(lang, "watchlistRemoveSelected"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    });
    if (!ok) return;

    const previousItems = items;
    setRemovingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setItems((prev) => prev.filter((x) => !selected.has(x.cardId)));
    setSelected(new Set());

    try {
      await apiDelete(`/api/watchlist?cardIds=${ids.join(",")}`);
      toast.success(t(lang, "watchlistRemoved"));
    } catch {
      setItems(previousItems);
      toast.error(t(lang, "watchlistUpdateFailed"));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  };

  const togglePin = async (entry: WatchlistEntry) => {
    const previousItems = items;
    const nextPinnedAt = entry.pinnedAt ? null : new Date().toISOString();
    setItems((prev) =>
      prev.map((x) => (x.cardId === entry.cardId ? { ...x, pinnedAt: nextPinnedAt } : x))
    );
    try {
      const data = await apiPatch<{ item?: WatchlistEntry }>(
        `/api/watchlist/${entry.cardId}`,
        { pinnedAt: "toggle" }
      );
      if (data?.item) {
        const fresh = data.item;
        setItems((prev) =>
          prev.map((x) =>
            x.cardId === entry.cardId ? { ...x, pinnedAt: fresh.pinnedAt } : x
          )
        );
      }
    } catch {
      setItems(previousItems);
      toast.error(t(lang, "watchlistUpdateFailed"));
    }
  };

  const openSetAlert = (entry: WatchlistEntry) => {
    setAlertTarget(entry);
    setAlertOpen(true);
  };

  const refreshAlerts = () => {
    void load();
  };

  const hasAnySparkline = useMemo(
    () =>
      filteredEntries.some(
        (e) => sparklines[e.cardId] && sparklines[e.cardId].length >= 2
      ),
    [filteredEntries, sparklines]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-96 rounded-xl shadow-[var(--panel-shadow)]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={t(lang, "watchlistNav")}
        description={items.length === 0 ? t(lang, "emptyWatchlistDesc") : undefined}
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            {t(lang, "addCard")}
          </Button>
        }
      >
        {items.length > 0 && (
          <div className="mt-1.5">
            <WatchlistSummary entries={items} period={period} />
          </div>
        )}
      </PageHeader>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
        <WatchlistEmpty onAdd={() => setAddOpen(true)} />
      ) : (
        <>
          <GameFilterChips games={gameChips} activeGame={gameFilter} onSelect={setGameFilter} />

          <WatchlistToolbar
            view={view}
            onViewChange={setView}
            period={period}
            onPeriodChange={setPeriod}
            sortKey={sortKey}
            onSortChange={setSortKey}
            filters={filters}
            onFiltersChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            setOptions={setOptions}
            itemCount={items.length}
            limit={limits.watchlistCards}
            selectedCount={selected.size}
            onClearSelection={() => setSelected(new Set())}
            onBulkRemove={() => void removeBulk()}
          />

          {filteredEntries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--p-hair)] py-10 text-center text-sm text-muted-foreground">
              {t(lang, "noCardsFoundDesc")}
            </div>
          ) : view === "list" ? (
            <WatchlistListView
              entries={filteredEntries}
              period={period}
              selected={selected}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleSelectAll}
              sparklines={sparklines}
              hasAnySparkline={hasAnySparkline}
              onTogglePin={(e) => void togglePin(e)}
              onSetAlert={openSetAlert}
              onRemove={(e) => void removeSingle(e)}
              removingIds={removingIds}
              showGameBadge={availableGames.length >= 2}
            />
          ) : (
            <WatchlistGridView
              entries={filteredEntries}
              period={period}
              selected={selected}
              onToggleSelect={toggleSelect}
              onTogglePin={(e) => void togglePin(e)}
              onSetAlert={openSetAlert}
              onRemove={(e) => void removeSingle(e)}
              removingIds={removingIds}
            />
          )}
        </>
      )}

      {alertTarget && (
        <CardSetAlertDialog
          cardId={alertTarget.cardId}
          cardName={getCardName(lang, alertTarget.card)}
          currentPriceJpy={alertTarget.card.latestPriceJpy}
          open={alertOpen}
          onOpenChange={(open) => {
            setAlertOpen(open);
            if (!open) setAlertTarget(null);
          }}
          onCreated={refreshAlerts}
          hideTrigger
        />
      )}

      <WatchlistAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={() => void load()}
      />
    </div>
  );
}

