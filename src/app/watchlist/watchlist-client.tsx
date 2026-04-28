"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CardSetAlertDialog } from "@/components/cards/card-set-alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthPreviewGate } from "@/components/shared/login-gate";
import { PageHeader } from "@/components/layout/page-header";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { useAuthState } from "@/hooks/use-auth-state";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTierLimits } from "@/hooks/use-tier-limits";
import { invalidateSettings } from "@/hooks/use-settings";
import { createClient } from "@/lib/supabase/client";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";

import { WatchlistEditDialog } from "./watchlist-edit-dialog";
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

  const [editTarget, setEditTarget] = useState<WatchlistEntry | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [alertTarget, setAlertTarget] = useState<WatchlistEntry | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);

  const [sparklines, setSparklines] = useState<Record<number, number[]>>({});
  const sparklineFetchedRef = useRef<Set<number>>(new Set());

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/watchlist");
      if (!res.ok) {
        if (res.status === 401) {
          invalidateSettings();
          toast.error(t(lang, "watchlistSessionExpired"));
          const supabase = createClient();
          await supabase.auth.signOut();
        } else {
          setError(t(lang, "loadFailed"));
        }
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { items: WatchlistEntry[] };
      setItems(data.items ?? []);
    } catch {
      setError(t(lang, "loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

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
    fetch(`/api/cards/sparklines?ids=${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sparklines) {
          setSparklines((prev) => ({ ...prev, ...data.sparklines }));
        }
      })
      .catch(() => {
        // ignore — sparkline is optional eye-candy
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
  }, [items, search, filters, sortKey, period]);

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
      const res = await fetch(`/api/watchlist?cardId=${entry.cardId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("remove failed");
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
      const res = await fetch(`/api/watchlist?cardIds=${ids.join(",")}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("bulk remove failed");
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
      const res = await fetch(`/api/watchlist/${entry.cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinnedAt: "toggle" }),
      });
      if (!res.ok) throw new Error("pin failed");
      const data = await res.json().catch(() => null);
      if (data?.item) {
        const fresh = data.item as WatchlistEntry;
        setItems((prev) =>
          prev.map((x) =>
            x.cardId === entry.cardId
              ? { ...x, pinnedAt: fresh.pinnedAt, note: fresh.note, targetPriceJpy: fresh.targetPriceJpy }
              : x
          )
        );
      }
    } catch {
      setItems(previousItems);
      toast.error(t(lang, "watchlistUpdateFailed"));
    }
  };

  const handleEditSave = async (data: {
    cardId: number;
    note: string | null;
    targetPriceJpy: number | null;
  }): Promise<boolean> => {
    const previousItems = items;
    setItems((prev) =>
      prev.map((x) =>
        x.cardId === data.cardId
          ? { ...x, note: data.note, targetPriceJpy: data.targetPriceJpy }
          : x
      )
    );

    try {
      const res = await fetch(`/api/watchlist/${data.cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: data.note,
          targetPriceJpy: data.targetPriceJpy,
        }),
      });
      if (!res.ok) throw new Error("update failed");
      return true;
    } catch {
      setItems(previousItems);
      return false;
    }
  };

  const openEdit = (entry: WatchlistEntry) => {
    setEditTarget(entry);
    setEditOpen(true);
  };

  const openSetAlert = (entry: WatchlistEntry) => {
    setAlertTarget(entry);
    setAlertOpen(true);
  };

  const refreshAlerts = () => {
    void load();
  };

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
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t(lang, "watchlistNav")}
        description={items.length === 0 ? t(lang, "emptyWatchlistDesc") : undefined}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      {items.length === 0 ? (
        <WatchlistEmpty />
      ) : (
        <>
          <WatchlistSummary entries={items} period={period} />

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
            <div className="panel py-10 text-center text-sm text-muted-foreground">
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
              onTogglePin={(e) => void togglePin(e)}
              onEdit={openEdit}
              onSetAlert={openSetAlert}
              onRemove={(e) => void removeSingle(e)}
              removingIds={removingIds}
            />
          ) : (
            <WatchlistGridView
              entries={filteredEntries}
              period={period}
              selected={selected}
              onToggleSelect={toggleSelect}
              onTogglePin={(e) => void togglePin(e)}
              onEdit={openEdit}
              onSetAlert={openSetAlert}
              onRemove={(e) => void removeSingle(e)}
              removingIds={removingIds}
            />
          )}
        </>
      )}

      <WatchlistEditDialog
        open={editOpen}
        entry={editTarget}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
        onSave={handleEditSave}
      />

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
    </div>
  );
}

