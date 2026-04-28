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
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KumaEmptyState } from "@/components/kuma/kuma-empty-state";
import { AlertEditDialog } from "@/components/alerts/alert-edit-dialog";
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
      <div>
        <h2 className="text-h3">{t(lang, "managePriceAlerts")}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {t(lang, "managePriceAlertsSubtitle")}
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="text-h5">{t(lang, "activeAlerts")}</h3>
          <span className="text-meta text-muted-foreground">
            {active.length}
          </span>
        </div>
        {active.length === 0 ? (
          <ActiveEmpty />
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
    </div>
  );
}

function ActiveEmpty() {
  const lang = useUIStore((s) => s.language);
  return (
    <div className="rounded-xl border border-dashed border-border/40 bg-card/50 px-6 py-10">
      <KumaEmptyState
        variant="minimal"
        icon={Bell}
        title={t(lang, "noActiveAlerts")}
        description={t(lang, "noActiveAlertsDesc")}
      />
      <div className="flex justify-center">
        <Link href="/cards">
          <Button variant="outline" size="sm" className="gap-1.5">
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
  const directionBorder = dirIsAbove ? "border-price-up/20" : "border-price-down/20";
  const operator = dirIsAbove ? "≥" : "≤";

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
      <div className="flex items-start gap-3">
        {/* Card image */}
        <Link
          href={`/cards/${alert.card.cardCode}`}
          className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted"
        >
          {alert.card.imageUrl ? (
            <Image
              src={alert.card.imageUrl}
              alt={cardName}
              fill
              sizes="56px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : null}
        </Link>

        <div className="min-w-0 flex-1">
          {/* Title row */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/cards/${alert.card.cardCode}`}
              className="truncate text-sm font-semibold hover:underline"
            >
              {cardName}
            </Link>
            <span className="text-meta text-muted-foreground/70">
              {alert.card.cardCode}
            </span>
            {!alert.isActive && (
              <Badge variant="secondary" className="text-xs">
                {t(lang, "alertTriggered")}
              </Badge>
            )}
            <FeedbackPill feedback={feedback} />
          </div>

          {/* Detail row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs",
                directionTone,
                directionBg,
                directionBorder,
              )}
            >
              {dirIsAbove ? (
                <ArrowUp className="size-3" />
              ) : (
                <ArrowDown className="size-3" />
              )}
              <span className="opacity-80">
                {t(lang, "alertTargetLabel")} {operator}
              </span>
              <span className="font-semibold">{target}</span>
            </span>

            {current != null && (
              <span className="text-meta text-muted-foreground">
                {t(lang, "alertNowLabel")}{" "}
                <span className="text-foreground">{current}</span>
              </span>
            )}

            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-muted-foreground">
              {channelEntries.map(({ key, label, Icon }) => (
                <span key={key} className="inline-flex items-center gap-1">
                  <Icon className="size-3.5" />
                  {label}
                </span>
              ))}
            </span>

            {!alert.isActive && alert.triggeredAt && (
              <span className="text-meta text-muted-foreground/70">
                {t(lang, "alertTriggeredOn")}: {formatTriggeredAt(alert.triggeredAt, lang)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 px-2"
              disabled={busy}
              onClick={onEdit}
            >
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">{t(lang, "edit")}</span>
            </Button>
          )}
          {onReactivate && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1.5 px-2"
              disabled={busy}
              onClick={onReactivate}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">{t(lang, "reactivate")}</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-destructive"
            disabled={busy}
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">{t(lang, "delete")}</span>
          </Button>
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
