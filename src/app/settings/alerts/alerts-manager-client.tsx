"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { AlertEditDialog } from "@/components/alerts/alert-edit-dialog";
import { AlertCreateDialog } from "@/components/alerts/alert-create-dialog";
import type { PriceAlertItem } from "@/components/alerts/alert-types";
import { useUIStore } from "@/stores/ui-store";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { ApiError, apiDelete, apiGet, apiPatch } from "@/lib/api/client";
import { t } from "@/lib/i18n";
import { AlertRow, type FeedbackKind } from "./alert-row";

type Feedback = {
  alertId: number;
  kind: FeedbackKind;
};

export function AlertsManagerClient() {
  const lang = useUIStore((s) => s.language);
  const [alerts, setAlerts] = useState<PriceAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PriceAlertItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const { openUpgradeDialog } = useUpgradeDialog();

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const data = await apiGet<{ alerts: PriceAlertItem[] }>("/api/alerts");
      setAlerts(data.alerts ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAlerts([]);
        return;
      }
      setError(t(lang, "failedToLoad"));
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    void fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const { active, history } = useMemo(() => {
    const a: PriceAlertItem[] = [];
    const h: PriceAlertItem[] = [];
    for (const alert of alerts) {
      if (alert.isActive) a.push(alert);
      else h.push(alert);
    }
    return { active: a, history: h };
  }, [alerts]);

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
    if (!window.confirm(t(lang, "deleteAlertConfirm"))) return;
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => void fetchAlerts()}>
          {t(lang, "retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-h2">{t(lang, "managePriceAlerts")}</h2>
          <p className="page-subtitle">{t(lang, "managePriceAlertsSubtitle")}</p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="shrink-0 gap-1.5 rounded-full"
        >
          <Plus className="size-3.5" />
          {t(lang, "createAlert")}
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-h5">{t(lang, "activeAlerts")}</h3>
          <span className="text-meta text-muted-foreground">
            {active.length}
          </span>
        </div>
        {active.length === 0 ? (
          <ActiveEmpty onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="space-y-2">
            {active.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                feedback={feedback?.alertId === alert.id ? feedback.kind : null}
                busy={busyId === alert.id}
                onEdit={() => onEdit(alert)}
                onDelete={() => void onDelete(alert)}
              />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-h5">{t(lang, "alertHistory")}</h3>
            <span className="text-meta text-muted-foreground">
              {history.length}
            </span>
          </div>
          <div className="space-y-2">
            {history.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                feedback={feedback?.alertId === alert.id ? feedback.kind : null}
                busy={busyId === alert.id}
                onReactivate={() => void onReactivate(alert)}
                onDelete={() => void onDelete(alert)}
              />
            ))}
          </div>
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

function ActiveEmpty({ onCreate }: { onCreate: () => void }) {
  const lang = useUIStore((s) => s.language);
  return (
    <div className="rounded-xl border border-dashed border-border/40 bg-card/50 px-6 py-10">
      <KumaEmptyState
        variant="minimal"
        icon={Bell}
        title={t(lang, "noActiveAlerts")}
        description={t(lang, "noActiveAlertsDesc")}
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" onClick={onCreate} className="gap-1.5 rounded-full">
          <Plus className="size-3.5" />
          {t(lang, "createAlert")}
        </Button>
        <Link href="/cards">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Bell className="size-3.5" />
            {t(lang, "browseCardsToAlert")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
