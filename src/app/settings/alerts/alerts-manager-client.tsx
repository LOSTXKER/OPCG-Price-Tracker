"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  CircleAlert,
  CircleCheck,
  Globe,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { AlertEditDialog } from "@/components/alerts/alert-edit-dialog";
import { AlertCreateDialog } from "@/components/alerts/alert-create-dialog";
import type { PriceAlertItem } from "@/components/alerts/alert-types";
import { useUIStore } from "@/stores/ui-store";
import { useUpgradeDialog } from "@/components/shared/upgrade-dialog";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { getCardName, getLocale, t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { formatByCurrency } from "@/lib/utils/currency";

type FeedbackKind = "saved" | "reactivated" | "error";

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
      const res = await fetch("/api/alerts");
      if (res.status === 401) {
        setAlerts([]);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(t(lang, "failedToLoad"));
        setLoading(false);
        return;
      }
      const data = (await res.json()) as { alerts: PriceAlertItem[] };
      setAlerts(data.alerts ?? []);
    } catch {
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
      const res = await fetch(`/api/alerts?id=${alert.id}`, { method: "DELETE" });
      if (!res.ok) {
        setFeedback({ alertId: alert.id, kind: "error" });
        return;
      }
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
      const res = await fetch(`/api/alerts?id=${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 403) {
          const msg: string = typeof json?.error === "string" ? json.error : "";
          if (msg.toLowerCase().includes("line")) {
            openUpgradeDialog({ featureKey: "lineAlerts" });
          } else {
            openUpgradeDialog({ featureKey: "priceAlerts" });
          }
          return;
        }
        setFeedback({ alertId: alert.id, kind: "error" });
        return;
      }
      const next = json.alert as PriceAlertItem;
      setAlerts((current) => current.map((a) => (a.id === next.id ? next : a)));
      setFeedback({ alertId: next.id, kind: "reactivated" });
    } catch {
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

function AlertRow({
  alert,
  feedback,
  busy,
  onEdit,
  onDelete,
  onReactivate,
}: {
  alert: PriceAlertItem;
  feedback: FeedbackKind | null;
  busy: boolean;
  onEdit?: () => void;
  onDelete: () => void;
  onReactivate?: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);
  const cardName = getCardName(lang, alert.card);
  const target = formatByCurrency(alert.targetPrice, currency).primary;
  const current =
    alert.card.latestPriceJpy != null
      ? formatByCurrency(alert.card.latestPriceJpy, currency).primary
      : null;

  const dirIsAbove = alert.direction === "ABOVE";
  const directionTone = dirIsAbove ? "text-price-up" : "text-price-down";
  const directionBg = dirIsAbove ? "bg-price-up/10" : "bg-price-down/10";
  const operator = dirIsAbove ? "≥" : "≤";
  const DirectionIcon = dirIsAbove ? ArrowUp : ArrowDown;

  const channelEntries: Array<{
    key: string;
    label: string;
    Icon: LucideIcon;
  }> = (alert.channels.length > 0 ? alert.channels : ["EMAIL"]).map((c) => {
    if (c === "LINE") return { key: c, label: t(lang, "alertChannelLine"), Icon: MessageCircle };
    if (c === "PUSH") return { key: c, label: t(lang, "alertChannelWeb"), Icon: Globe };
    return { key: c, label: t(lang, "alertChannelEmail"), Icon: Mail };
  });

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors",
        alert.isActive ? "border-border/40" : "border-border/30 bg-muted/20",
      )}
    >
      <div className="flex gap-3 sm:gap-4">
        {/* Card image — preserves card aspect ratio (63:88 portrait) */}
        <Link
          href={`/cards/${alert.card.cardCode}`}
          className="relative aspect-[63/88] w-12 shrink-0 overflow-hidden rounded-md bg-muted sm:w-14"
        >
          {alert.card.imageUrl ? (
            <Image
              src={alert.card.imageUrl}
              alt={cardName}
              fill
              sizes="56px"
              className="object-contain"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : null}
        </Link>

        <div className="min-w-0 flex-1">
          {/* Title + actions row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/cards/${alert.card.cardCode}`}
                className="block truncate text-sm font-semibold hover:underline"
              >
                {cardName}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground/70">
                <span>{alert.card.cardCode}</span>
                {!alert.isActive && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-micro">
                    {t(lang, "alertTriggered")}
                  </Badge>
                )}
                <FeedbackPill feedback={feedback} />
              </div>
            </div>

            {/* Actions */}
            <div className="-mr-1 -mt-1 flex shrink-0 items-center">
              {onEdit && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={busy}
                  onClick={onEdit}
                  title={t(lang, "edit")}
                  aria-label={t(lang, "edit")}
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {onReactivate && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground"
                  disabled={busy}
                  onClick={onReactivate}
                  title={t(lang, "reactivate")}
                  aria-label={t(lang, "reactivate")}
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive"
                disabled={busy}
                onClick={onDelete}
                title={t(lang, "delete")}
                aria-label={t(lang, "delete")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Trigger condition — primary info */}
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={cn(
                "inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                directionBg,
                directionTone,
              )}
              aria-hidden
            >
              <DirectionIcon className="size-3" strokeWidth={2.5} />
            </span>
            <span className="text-eyebrow shrink-0 text-muted-foreground">
              {t(lang, "alertTargetLabel")}
            </span>
            <span className={cn("text-base font-semibold tabular-nums leading-none", directionTone)}>
              {operator} {target}
            </span>
          </div>

          {/* Supporting info — current price + channels */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground">
            {current != null && (
              <span>
                {t(lang, "alertNowLabel")}{" "}
                <span className="font-medium text-foreground tabular-nums">{current}</span>
              </span>
            )}
            {current != null && channelEntries.length > 0 && (
              <span aria-hidden className="text-muted-foreground/30">·</span>
            )}
            {channelEntries.map(({ key, label, Icon }) => (
              <span key={key} className="inline-flex items-center gap-1">
                <Icon className="size-3" />
                {label}
              </span>
            ))}
            {!alert.isActive && alert.triggeredAt && (
              <>
                <span aria-hidden className="text-muted-foreground/30">·</span>
                <span className="text-muted-foreground/70">
                  {t(lang, "alertTriggeredOn")}: {formatTriggeredAt(alert.triggeredAt, lang)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackPill({ feedback }: { feedback: FeedbackKind | null }) {
  const lang = useUIStore((s) => s.language);
  if (!feedback) return null;
  if (feedback === "error") {
    return (
      <span className="inline-flex animate-in fade-in zoom-in-95 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <CircleAlert className="size-3" />
        {t(lang, "saveFailed")}
      </span>
    );
  }
  const label =
    feedback === "reactivated"
      ? t(lang, "alertReactivated")
      : t(lang, "alertUpdated");
  return (
    <span className="inline-flex animate-in fade-in zoom-in-95 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <CircleCheck className="size-3" />
      {label}
    </span>
  );
}

function formatTriggeredAt(iso: string, lang: Language): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(getLocale(lang), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
