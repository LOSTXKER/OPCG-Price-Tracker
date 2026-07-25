"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToolbarSearch } from "@/components/ui/toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertEditDialog } from "@/components/alerts/alert-edit-dialog";
import { AlertCreateDialog } from "@/components/alerts/alert-create-dialog";
import type { PriceAlertItem } from "@/components/alerts/alert-types";
import { useUIStore } from "@/stores/ui-store";
import { useGameFilterReset } from "@/hooks/use-game-filter";
import { useMultigameDemo, MOCK_POKEMON_ALERTS } from "@/lib/mock/multigame-demo";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { ApiError, apiDelete, apiGet, apiPatch } from "@/lib/api/client";
import { t, type Language } from "@/lib/i18n";
import {
  GameFilterChips,
  getLaunchReadyGameChips,
  type GameChip,
} from "@/components/shared/game-filter-chips";
import { ALL_GAMES, DEFAULT_GAME } from "@/lib/game/constants";
import { getGameConfig, isGameSlugLaunchReady } from "@/lib/game-config";
import { AlertRow, type FeedbackKind } from "./alert-row";
import { groupAlertsByGame, AlertGameGroup } from "./alert-groups";
import { filterAlertsBySearch, sortAlertsByUrgency } from "./alerts-sort";

type Feedback = {
  alertId: number;
  kind: FeedbackKind;
};

export type AlertsPanelState = {
  status: "loading" | "error" | "empty" | "ready";
  itemCount: number;
  quotaCount?: number;
};

interface AlertsManagerClientProps {
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;
  onPageStateChange?: (state: AlertsPanelState) => void;
}

export function AlertsManagerClient({
  createOpen: controlledCreateOpen,
  onCreateOpenChange,
  onPageStateChange,
}: AlertsManagerClientProps = {}) {
  const lang = useUIStore((s) => s.language);
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PriceAlertItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // One unified alerts list across every game, filtered in-view by game. The
  // filter is PER-PAGE (local, session-only) — never shared with portfolio/watchlist.
  const [gameFilter, setGameFilter] = useState<string>(ALL_GAMES);
  const [search, setSearch] = useState("");
  const demo = useMultigameDemo();
  const availableGames = useMemo(
    () => [
      ...new Set(
        alerts
          .map((a) => a.card.set?.game?.slug ?? DEFAULT_GAME)
          .filter(isGameSlugLaunchReady),
      ),
    ],
    [alerts],
  );
  useGameFilterReset(gameFilter, availableGames, setGameFilter);
  const { openUpgradeDialog } = useUpgradeDialog();
  const confirmDialog = useConfirm();
  const createOpen = controlledCreateOpen ?? internalCreateOpen;
  const setCreateOpen = useCallback(
    (open: boolean) => {
      if (controlledCreateOpen === undefined) setInternalCreateOpen(open);
      onCreateOpenChange?.(open);
    },
    [controlledCreateOpen, onCreateOpenChange],
  );

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<{ alerts: PriceAlertItem[] }>("/api/alerts");
      // Demo-only: append mock Pokémon alerts so the multi-game UI is visible.
      setAlerts([...(data.alerts ?? []), ...(demo ? MOCK_POKEMON_ALERTS : [])]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAlerts([]);
        return;
      }
      setError(t(lang, "failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [lang, demo]);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  const panelStatus: AlertsPanelState["status"] = loading
    ? "loading"
    : error
      ? "error"
      : alerts.length === 0
        ? "empty"
        : "ready";

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const scopedAlerts = useMemo(
    () =>
      gameFilter === ALL_GAMES
        ? alerts
        : alerts.filter((a) => (a.card.set?.game?.slug ?? DEFAULT_GAME) === gameFilter),
    [alerts, gameFilter],
  );

  // Search stays out of the way until there's enough alerts to need it
  // (เบส: ไม่ใส่ chrome ให้หน้าที่มีแค่ 1 แจ้งเตือน).
  const showSearch = alerts.length > 3;
  const searchedAlerts = useMemo(
    () => (showSearch ? filterAlertsBySearch(scopedAlerts, lang, search) : scopedAlerts),
    [scopedAlerts, lang, search, showSearch],
  );

  const { active, history } = useMemo(() => {
    const a: PriceAlertItem[] = [];
    const h: PriceAlertItem[] = [];
    for (const alert of searchedAlerts) {
      if (alert.isActive) a.push(alert);
      else h.push(alert);
    }
    // Active section sorts by urgency (closest to firing first); history
    // keeps its natural order (most recently triggered first, from the API).
    return { active: sortAlertsByUrgency(a), history: h };
  }, [searchedAlerts]);
  const activeQuotaCount = alerts.reduce(
    (count, alert) => count + (alert.id > 0 && alert.isActive ? 1 : 0),
    0,
  );

  useEffect(() => {
    onPageStateChange?.({
      status: panelStatus,
      itemCount: alerts.length,
      quotaCount: activeQuotaCount,
    });
  }, [activeQuotaCount, alerts.length, onPageStateChange, panelStatus]);

  // Games + logos for the chip rail (cross-game, from all alerts).
  const gameMeta = useMemo(() => {
    const slugs = new Set<string>();
    const logo = new Map<string, string | null>();
    for (const a of alerts) {
      const g = a.card.set?.game ?? null;
      const slug = g?.slug ?? DEFAULT_GAME;
      slugs.add(slug);
      if (g?.logoUrl && !logo.has(slug)) logo.set(slug, g.logoUrl);
    }
    return { slugs, logo };
  }, [alerts]);

  // Chips for games the user actually has alerts in. Keep the launch-ready game
  // context visible even when every alert currently belongs to one game.
  const gameChips = useMemo<GameChip[]>(
    () =>
      [...gameMeta.slugs].map((slug) => ({
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

  const onEdit = (alert: PriceAlertItem) => {
    setEditing(alert);
    setEditOpen(true);
  };

  const onSaved = (next: PriceAlertItem) => {
    setAlerts((current) => current.map((a) => (a.id === next.id ? next : a)));
    setFeedback({ alertId: next.id, kind: "saved" });
  };

  const onCreated = (next: PriceAlertItem) => {
    setAlerts((current) => [next, ...current]);
    setFeedback({ alertId: next.id, kind: "saved" });
  };

  const onDelete = async (alert: PriceAlertItem) => {
    if (busyId === alert.id) return;
    const confirmed = await confirmDialog({
      title: t(lang, "deleteAlertConfirm"),
      description: "",
      confirmLabel: t(lang, "delete"),
      cancelLabel: t(lang, "cancel"),
      variant: "destructive",
    });
    if (!confirmed) return;
    setBusyId(alert.id);
    try {
      await apiDelete(`/api/alerts?id=${alert.id}`);
      setAlerts((current) => current.filter((a) => a.id !== alert.id));
    } catch {
      setFeedback({ alertId: alert.id, kind: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const onReactivate = async (alert: PriceAlertItem) => {
    if (busyId === alert.id) return;
    setBusyId(alert.id);
    try {
      const json = await apiPatch<{ alert: PriceAlertItem }>(
        `/api/alerts?id=${alert.id}`,
        { isActive: true },
      );
      const next = json.alert;
      setAlerts((current) => current.map((a) => (a.id === next.id ? next : a)));
      setFeedback({ alertId: next.id, kind: "reactivated" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        if (err.message.toLowerCase().includes("line")) {
          openUpgradeDialog({ featureKey: "lineAlerts" });
        } else {
          openUpgradeDialog({ featureKey: "priceAlerts" });
        }
        return;
      }
      setFeedback({ alertId: alert.id, kind: "error" });
    } finally {
      setBusyId(null);
    }
  };

  // Grouped by game (crest + count, collapsible) only when the list spans ≥2
  // games with no game filter active — otherwise flat. Row badges stay off:
  // grouped mode carries the game in the header, flat mode is single-game/scoped.
  const grouped = gameFilter === ALL_GAMES && availableGames.length >= 2;
  const renderAlertList = (list: PriceAlertItem[], mode: "active" | "history") => {
    const rowOf = (alert: PriceAlertItem) => (
      <AlertRow
        key={alert.id}
        alert={alert}
        feedback={feedback?.alertId === alert.id ? feedback.kind : null}
        busy={busyId === alert.id}
        onEdit={mode === "active" ? () => onEdit(alert) : undefined}
        onReactivate={mode === "history" ? () => void onReactivate(alert) : undefined}
        onDelete={() => void onDelete(alert)}
        showGameBadge={false}
      />
    );
    // One calm panel of divided rows (same language as the watchlist list)
    // instead of a stack of separately-outlined boxes.
    if (!grouped)
      return (
        <div className="panel divide-y divide-hair overflow-hidden">
          {list.map(rowOf)}
        </div>
      );
    return (
      <div className="space-y-3">
        {groupAlertsByGame(list).map((g) => (
          <AlertGameGroup key={g.slug} group={g} defaultOpen={mode === "active"}>
            <div className="panel divide-y divide-hair overflow-hidden">
              {g.alerts.map(rowOf)}
            </div>
          </AlertGameGroup>
        ))}
      </div>
    );
  };

  if (loading) {
    return <AlertsManagerSkeleton />;
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
            size="sm"
            variant="outline"
            className="sm:min-h-11 md:min-h-0"
            onClick={() => void fetchAlerts()}
          >
            {t(lang, "retry")}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="space-y-3" aria-labelledby="active-alerts-heading">
        <div
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          data-slot="alerts-section-head"
        >
          <AlertSectionHeading
            id="active-alerts-heading"
            title={t(lang, "activeAlerts")}
            count={active.length}
          />

          {/* The game scope belongs to the list it controls, so keep it on the
              section-heading baseline instead of leaving a detached third row
              under the tabs. Search joins the same compact toolbar only once
              there are enough alerts to need it. */}
          {(launchReadyGameChips.length > 0 || showSearch) && (
            <div
              className="flex min-w-0 flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center"
              data-slot="alerts-toolbar"
            >
              {launchReadyGameChips.length > 0 && (
                <div className="shrink-0" data-slot="alerts-game-scope">
                  <GameFilterChips
                    games={launchReadyGameChips}
                    activeGame={gameFilter}
                    onSelect={setGameFilter}
                    variant="select"
                  />
                </div>
              )}

              {showSearch && (
                <ToolbarSearch
                  type="search"
                  value={search}
                  onValueChange={setSearch}
                  placeholder={t(lang, "alertsSearchPlaceholder")}
                  aria-label={t(lang, "alertsSearchPlaceholder")}
                  containerClassName="min-w-0 flex-1 border-border bg-background py-0 sm:max-w-72"
                />
              )}
            </div>
          )}
        </div>
        {active.length === 0 ? (
          gameFilter !== ALL_GAMES ? (
            <FilteredEmpty lang={lang} onShowAll={() => setGameFilter(ALL_GAMES)} />
          ) : (
            <ActiveEmpty
              onCreate={alerts.length === 0 ? () => setCreateOpen(true) : undefined}
            />
          )
        ) : (
          renderAlertList(active, "active")
        )}
      </section>

      {history.length > 0 && (
        <section className="space-y-3" aria-labelledby="alert-history-heading">
          <AlertSectionHeading
            id="alert-history-heading"
            title={t(lang, "alertHistory")}
            count={history.length}
          />
          {renderAlertList(history, "history")}
        </section>
      )}

      <AlertEditDialog
        alert={editing}
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) setEditing(null);
        }}
        onSaved={onSaved}
      />

      <AlertCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={onCreated}
      />
    </div>
  );
}

export function AlertsManagerSkeleton() {
  return (
    <div className="space-y-4 md:space-y-5">
      <div className="space-y-3">
        <div
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          data-slot="alerts-skeleton-section-head"
        >
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-5" />
          </div>
          <div
            className="flex min-w-0 flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center"
            data-slot="alerts-skeleton-toolbar"
          >
            <Skeleton
              className="h-11 w-32 rounded-lg sm:h-9"
              data-slot="alerts-skeleton-game-filter"
            />
            <Skeleton
              className="h-11 min-w-0 rounded-lg sm:h-9 sm:w-72"
              data-slot="alerts-skeleton-search"
            />
          </div>
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AlertSectionHeading({
  id,
  title,
  count,
}: {
  id: string;
  title: string;
  count: number;
}) {
  // Count sits next to the label (same grammar as the tab badge) instead of
  // floating detached at the far edge of the row.
  return (
    <h2 id={id} className="text-h5 flex items-baseline gap-1.5">
      {title}
      <span className="text-meta tabular-nums font-normal">{count}</span>
    </h2>
  );
}

function FilteredEmpty({
  lang,
  onShowAll,
}: {
  lang: Language;
  onShowAll: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-hair bg-card/50 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{t(lang, "noActiveAlerts")}</p>
      <div className="mt-3 flex items-center justify-center">
        <Button
          size="sm"
          onClick={onShowAll}
          className="rounded-full sm:min-h-11 md:min-h-0"
        >
          {t(lang, "showAllGames")}
        </Button>
      </div>
    </div>
  );
}

function ActiveEmpty({ onCreate }: { onCreate?: () => void }) {
  const lang = useUIStore((s) => s.language);
  return (
    <EmptyState
      variant="dashed"
      icon={Bell}
      title={t(lang, "noActiveAlerts")}
      description={t(lang, "noActiveAlertsDesc")}
      action={
        onCreate ? (
          <Button
            size="sm"
            onClick={onCreate}
            className="min-h-11 gap-1.5 rounded-full sm:min-h-11 md:min-h-0"
          >
            <Plus className="size-3.5" />
            {t(lang, "createAlert")}
          </Button>
        ) : undefined
      }
    />
  );
}
