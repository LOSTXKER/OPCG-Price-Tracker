"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog";
import { Button } from "@/components/ui/button";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { EmptyState } from "@/components/shared/empty-state";
import type { SetPickerItem } from "@/components/shared/set-picker";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { ApiError, apiDelete, apiGet } from "@/lib/api/client";
import { useAuthState } from "@/hooks/use-auth-state";
import { invalidateSettings } from "@/hooks/use-settings";
import { createClient } from "@/lib/supabase/client";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { useGameFilterReset } from "@/hooks/use-game-filter";
import { useMultigameDemo, MOCK_POKEMON_WATCHLIST } from "@/lib/mock/multigame-demo";
import {
  GameFilterChips,
  getLaunchReadyGameChips,
  type GameChip,
} from "@/components/shared/game-filter-chips";
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants";
import { getGameConfig, isGameSlugLaunchReady } from "@/lib/game-config";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { isRawGrade, type GradeKey } from "@/lib/pricing/grade-tiers";
import { useSparklines } from "@/hooks/use-sparklines";

import { WatchlistAddDialog } from "./watchlist-add-dialog";
import { WatchlistEmpty } from "./watchlist-empty";
import {
  WatchlistListView,
  type WatchlistHeaderCol,
} from "./watchlist-list-view";
import {
  createWatchlistLoadRevision,
  shouldSettleWatchlistForeground,
} from "./watchlist-load-revision";
import { WatchlistMockPreview } from "./watchlist-mock-preview";
import { WatchlistSkeleton } from "./watchlist-skeleton";
import { WatchlistSelectionBar } from "./watchlist-selection-bar";
import { WatchlistToolbar } from "./watchlist-toolbar";
import {
  countActiveWatchlistFilters,
  ensureValidSetCode,
  filterAndSortEntries,
  normalizeWatchlistSortForGrade,
  pruneSelectedToVisible,
} from "./watchlist-sort";
import { buildWatchlistTabHref } from "./watchlist-tab-query";
import {
  DEFAULT_FILTERS,
  type ChangePeriod,
  type SortKey,
  type WatchlistEntry,
  type WatchlistFilters,
  type WatchlistPanelState,
} from "./watchlist-types";

interface WatchlistClientProps {
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
  onPageStateChange?: (state: WatchlistPanelState) => void;
}

export default function WatchlistClient(props: WatchlistClientProps = {}) {
  const { authed } = useAuthState();
  const lang = useUIStore((s) => s.language);

  if (authed === null) {
    return <WatchlistSkeleton />;
  }

  if (authed === false) {
    return <AuthPreviewGate preview={<WatchlistMockPreview lang={lang} />} />;
  }

  return <WatchlistContent {...props} />;
}

function WatchlistContent({
  addOpen: controlledAddOpen,
  onAddOpenChange,
  onPageStateChange,
}: WatchlistClientProps) {
  const lang = useUIStore((s) => s.language);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  const syncWatchlistIds = useWatchlistStore((state) => state.syncIds);

  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editMode, setEditMode] = useState(false);

  // Multi-select is off by default so rows stay clean (tap = open card). The
  // "แก้ไข" toggle reveals checkboxes; leaving edit mode drops any selection.
  const toggleEditMode = () => {
    setEditMode((prev) => {
      if (prev) setSelected(new Set());
      return !prev;
    });
  };

  const [period, setPeriod] = useState<ChangePeriod>("7d");
  const [grade, setGrade] = useState<GradeKey>("raw");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [filters, setFilters] = useState<WatchlistFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  // One unified watchlist across every game, filtered in-view by game. The filter
  // is PER-PAGE (local, session-only) — never shared with portfolio/alerts.
  const [gameFilter, setGameFilter] = useState<string>(ALL_GAMES);
  const demo = useMultigameDemo();
  const availableGames = useMemo(
    () => [
      ...new Set(
        items
          .map((e) => e.card.set.game?.slug ?? DEFAULT_GAME)
          .filter(isGameSlugLaunchReady),
      ),
    ],
    [items],
  );
  useGameFilterReset(gameFilter, availableGames, setGameFilter);
  // Set choices follow the selected game while the watchlist itself stays unified.
  const scopedByGame = useMemo(
    () =>
      gameFilter === ALL_GAMES
        ? items
        : items.filter((e) => (e.card.set.game?.slug ?? DEFAULT_GAME) === gameFilter),
    [items, gameFilter],
  );
  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const addOpen = controlledAddOpen ?? internalAddOpen;
  const setAddOpen = useCallback(
    (open: boolean) => {
      if (controlledAddOpen === undefined) setInternalAddOpen(open);
      onAddOpenChange?.(open);
    },
    [controlledAddOpen, onAddOpenChange],
  );

  const [alertTarget, setAlertTarget] = useState<WatchlistEntry | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const sparklineCards = useMemo(() => items.map((item) => item.card), [items]);
  const sparklines = useSparklines(sparklineCards);
  const loadRevisionRef = useRef<ReturnType<
    typeof createWatchlistLoadRevision
  > | null>(null);
  if (!loadRevisionRef.current) {
    loadRevisionRef.current = createWatchlistLoadRevision();
  }
  const loadRevision = loadRevisionRef.current;
  const foregroundLoadRevisionRef = useRef<number | null>(null);

  const syncRealIds = useCallback(
    (entries: readonly WatchlistEntry[]) => {
      syncWatchlistIds(
        entries.filter((entry) => entry.cardId > 0).map((entry) => entry.cardId),
      );
    },
    [syncWatchlistIds],
  );

  const load = useCallback(async (background = false) => {
    if (!loadRevision.isActive()) return;
    const revision = loadRevision.begin();
    if (!background) {
      foregroundLoadRevisionRef.current = revision;
      setLoading(true);
      setError(null);
    }
    try {
      const data = await apiGet<{ items: WatchlistEntry[] }>("/api/watchlist");
      if (!loadRevision.canApply(revision)) return;
      const realItems = data.items ?? [];
      // Demo-only: append mock Pokémon entries so the multi-game UI is visible.
      setItems([...realItems, ...(demo ? MOCK_POKEMON_WATCHLIST : [])]);
      syncRealIds(realItems);
    } catch (err) {
      if (!loadRevision.canApply(revision)) return;
      if (err instanceof ApiError && err.status === 401) {
        invalidateSettings();
        toast.error(t(lang, "watchlistSessionExpired"));
        const supabase = createClient();
        await supabase.auth.signOut();
      } else {
        if (background) toast.error(t(lang, "loadFailed"));
        else setError(t(lang, "loadFailed"));
      }
    } finally {
      if (
        shouldSettleWatchlistForeground({
          active: loadRevision.isActive(),
          background,
          completedRevision: revision,
          foregroundRevision: foregroundLoadRevisionRef.current,
          canApply: loadRevision.canApply(revision),
        })
      ) {
        foregroundLoadRevisionRef.current = null;
        setLoading(false);
      }
    }
  }, [lang, demo, loadRevision, syncRealIds]);

  useEffect(() => {
    loadRevision.activate();
    return () => {
      foregroundLoadRevisionRef.current = null;
      loadRevision.dispose();
    };
  }, [loadRevision]);

  useEffect(() => {
    void load();
  }, [load]);

  const panelStatus: WatchlistPanelState["status"] = loading
    ? "loading"
    : error
      ? "error"
      : items.length === 0
        ? "empty"
        : "ready";
  const quotaCount = items.reduce(
    (count, item) => count + (item.cardId > 0 ? 1 : 0),
    0,
  );

  useEffect(() => {
    onPageStateChange?.({
      status: panelStatus,
      itemCount: items.length,
      quotaCount,
    });
  }, [items.length, onPageStateChange, panelStatus, quotaCount]);

  const setOptions = useMemo<SetPickerItem[]>(() => {
    const seen = new Map<string, SetPickerItem>();
    for (const entry of scopedByGame) {
      const code = entry.card.set.code;
      if (seen.has(code)) continue;
      const gameSlug = entry.card.set.game?.slug ?? DEFAULT_GAME;
      const setInfo = getGameConfig(gameSlug)?.sets.find(
        (set) => set.code.toLowerCase() === code.toLowerCase(),
      );
      seen.set(code, {
        code,
        name: setInfo?.name ?? code.toUpperCase(),
        nameEn: setInfo?.nameEn ?? setInfo?.name ?? code.toUpperCase(),
        type: setInfo?.type ?? "OTHER",
      });
    }
    return [...seen.values()].sort((a, b) => a.code.localeCompare(b.code));
  }, [scopedByGame]);

  useEffect(() => {
    const validSetCode = ensureValidSetCode(items, gameFilter, filters.setCode);
    if (validSetCode === filters.setCode) return;
    setFilters((current) => ({ ...current, setCode: validSetCode }));
  }, [filters.setCode, gameFilter, items]);

  const filteredEntries = useMemo(
    () =>
      filterAndSortEntries(
        items,
        { filters, period, search, gameFilter, grade },
        sortKey,
      ),
    [filters, gameFilter, grade, items, period, search, sortKey],
  );

  // Per-game membership + logos for the chip rail (cross-game, from all items).
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

  // Chips for games the user actually watches cards in (count > 0). Keep the
  // launch-ready game context visible even when the list currently has one game.
  const gameChips = useMemo<GameChip[]>(
    () =>
      [...gameMeta.count.entries()]
        .filter(([, c]) => c > 0)
        .map(([slug]) => ({
          slug,
          label: getGameConfig(slug)?.shortName ?? slug.toUpperCase(),
          logoUrl: gameMeta.logo.get(slug) ?? null,
        })),
    [gameMeta],
  );
  const launchReadyGameChips = useMemo(
    () => getLaunchReadyGameChips(gameChips),
    [gameChips],
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

  // Select-mode picks must stay a subset of the visible rows. Search, the
  // filter modal, the game chips, the period control, and background
  // refreshes can all hide entries — a pick that lingered on a hidden row
  // would let the bar count (and bulk-remove delete) cards the user can no
  // longer see. Reconciling against filteredEntries covers every one of
  // those paths at once; picks on rows that stay visible survive.
  useEffect(() => {
    setSelected((prev) => pruneSelectedToVisible(prev, filteredEntries));
  }, [filteredEntries]);

  const allVisibleSelected =
    filteredEntries.length > 0 &&
    filteredEntries.every((entry) => selected.has(entry.cardId));

  const resetAllControls = () => {
    setSearch("");
    setFilters(DEFAULT_FILTERS);
    setGameFilter(ALL_GAMES);
    setSortKey("default");
    setPeriod("7d");
    setGrade("raw");
    setSelected(new Set());
  };

  const hasActiveConstraints =
    search.trim().length > 0 ||
    gameFilter !== ALL_GAMES ||
    !isRawGrade(grade) ||
    countActiveWatchlistFilters(filters) > 0;

  const handleGradeChange = (nextGrade: GradeKey) => {
    setGrade(nextGrade);
    if (isRawGrade(nextGrade)) return;

    // Graded prices have no real historical change series yet. Clear Raw-only
    // constraints and normalize a hidden movement sort to the price column.
    setFilters((current) =>
      current.direction || current.hasAlert
        ? { ...current, direction: null, hasAlert: false }
        : current,
    );
    setSortKey((current) => normalizeWatchlistSortForGrade(current, nextGrade));
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

    if (!loadRevision.beginMutation()) return;
    const previousItems = items;
    const previousSelected = new Set(selected);
    const nextItems = items.filter((item) => item.cardId !== entry.cardId);
    setRemovingIds((prev) => new Set(prev).add(entry.cardId));
    setItems(nextItems);
    syncRealIds(nextItems);
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
      syncRealIds(previousItems);
      setSelected(previousSelected);
      toast.error(t(lang, "watchlistUpdateFailed"));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.cardId);
        return next;
      });
      if (loadRevision.finishMutation()) void load(true);
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

    if (!loadRevision.beginMutation()) return;
    const previousItems = items;
    const previousSelected = new Set(selected);
    const nextItems = items.filter((item) => !selected.has(item.cardId));
    setRemovingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setItems(nextItems);
    syncRealIds(nextItems);
    setSelected(new Set());

    try {
      await apiDelete(`/api/watchlist?cardIds=${ids.join(",")}`);
      toast.success(t(lang, "watchlistRemoved"));
    } catch {
      setItems(previousItems);
      syncRealIds(previousItems);
      setSelected(previousSelected);
      toast.error(t(lang, "watchlistUpdateFailed"));
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      if (loadRevision.finishMutation()) void load(true);
    }
  };

  const openSetAlert = (entry: WatchlistEntry) => {
    // This card already has an alert — send the user to manage (edit/delete) it
    // instead of silently creating a duplicate (the create API has no unique
    // guard, so re-tapping the bell would stack identical alerts).
    if (entry.hasActiveAlert) {
      router.push(buildWatchlistTabHref(pathname, searchParams, "alerts"));
      return;
    }
    setAlertTarget(entry);
    setAlertOpen(true);
  };

  const refreshAlerts = () => {
    void load(true);
  };

  // Desktop list view sorts at the column headers (canonical SortableHeader):
  // name toggles A→Z/Z→A, price toggles high/low, a period column switches the
  // active period + toggles gain/loss on repeat clicks.
  const handleHeaderSort = (col: WatchlistHeaderCol) => {
    if (col === "name") {
      setSortKey(sortKey === "nameAz" ? "nameZa" : "nameAz");
      return;
    }
    if (col === "price") {
      setSortKey(sortKey === "priceHigh" ? "priceLow" : "priceHigh");
      return;
    }
    if (!isRawGrade(grade)) return;
    const alreadyGainOnPeriod = period === col && sortKey === "gain";
    setSortKey(alreadyGainOnPeriod ? "loss" : "gain");
    setPeriod(col);
  };

  if (loading) {
    return <WatchlistSkeleton withHeader={false} />;
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        preset="error"
        lang={lang}
        description={error}
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            className="sm:min-h-11 md:min-h-0"
          >
            {t(lang, "retry")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      {items.length === 0 ? (
        <WatchlistEmpty onAdd={() => setAddOpen(true)} />
      ) : (
        <>
          <WatchlistToolbar
            scope={
              launchReadyGameChips.length > 0 ? (
                <GameFilterChips
                  games={launchReadyGameChips}
                  activeGame={gameFilter}
                  onSelect={setGameFilter}
                  variant="select"
                />
              ) : undefined
            }
            filters={filters}
            onFiltersChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            setOptions={setOptions}
            editMode={editMode}
            onToggleEditMode={toggleEditMode}
            grade={grade}
            onGradeChange={handleGradeChange}
          />

          {editMode && (
            <WatchlistSelectionBar
              selectedCount={selected.size}
              resultCount={filteredEntries.length}
              allVisibleSelected={allVisibleSelected}
              onToggleSelectAll={toggleSelectAll}
              onBulkRemove={() => void removeBulk()}
              onCancel={toggleEditMode}
            />
          )}

          {filteredEntries.length === 0 ? (
            <EmptyState
              preset="no-results"
              lang={lang}
              variant="dashed"
              description={t(lang, "noCardsFoundDesc")}
              action={
                hasActiveConstraints ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetAllControls}
                    className="sm:min-h-11 md:min-h-0"
                  >
                    {t(lang, "clearAll")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <WatchlistListView
              entries={filteredEntries}
              grade={grade}
              period={period}
              onPeriodChange={setPeriod}
              editMode={editMode}
              selected={selected}
              onToggleSelect={toggleSelect}
              sparklines={sparklines}
              onSetAlert={openSetAlert}
              onRemove={(e) => void removeSingle(e)}
              removingIds={removingIds}
              showGameBadge={availableGames.length >= 2}
              sortKey={sortKey}
              onHeaderSort={handleHeaderSort}
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
        onAdded={() => void load(true)}
        currentCount={quotaCount}
      />
    </div>
  );
}
