"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  Check,
  CheckCheck,
  Settings as SettingsIcon,
} from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PriceAlertItem } from "@/components/alerts/alert-types";
import { useUIStore } from "@/stores/ui-store";
import { apiGet, apiPost, apiTry } from "@/lib/api/client";
import { getCardName, getLocale, t, type Language } from "@/lib/i18n";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { cn } from "@/lib/utils";
import { formatByCurrency } from "@/lib/utils/currency";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

type TabKey = "system" | "price";

export function NotificationBell() {
  const lang = useUIStore((s) => s.language);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("system");

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const [alerts, setAlerts] = useState<PriceAlertItem[] | null>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const data = await apiTry(
      apiGet<{ notifications?: NotificationItem[]; unreadCount?: number }>(
        "/api/notifications?limit=10",
      ),
    );
    if (!data) return;
    setItems(data.notifications ?? []);
    setUnreadCount(data.unreadCount ?? 0);
    setLoaded(true);
  }, []);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const data = await apiTry(apiGet<{ alerts: PriceAlertItem[] }>("/api/alerts"));
      setAlerts(data?.alerts ?? []);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (open && tab === "price" && alerts === null && !alertsLoading) {
      void fetchAlerts();
    }
  }, [open, tab, alerts, alertsLoading, fetchAlerts]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const markAsRead = async (id: number) => {
    await apiTry(apiPost("/api/notifications/read", { id }));
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await apiTry(apiPost("/api/notifications/read", { all: true }));
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!loaded) return null;

  const triggered = (alerts ?? []).filter((a) => !a.isActive && a.triggeredAt);
  const active = (alerts ?? []).filter((a) => a.isActive);
  const priceTabBadge = triggered.length;
  const totalBadge = unreadCount + priceTabBadge;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors ease-chrome hover:bg-muted hover:text-foreground lg:size-8"
        aria-label={t(lang, "notifications")}
      >
        <Bell className="size-4" />
        {totalBadge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger text-micro text-danger-foreground">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-hair bg-popover shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <span className="text-sm font-semibold">{t(lang, "notifications")}</span>
            <Link
              href="/settings/notifications"
              onClick={() => setOpen(false)}
              className="tap-safe inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              title={t(lang, "notifications")}
            >
              <SettingsIcon className="size-3.5" />
            </Link>
          </div>

          <Tabs value={tab} onValueChange={(next) => setTab(next as TabKey)}>
            {/* Tabs strip */}
            <div className="px-3 pt-2">
              <TabsList className="w-full">
                <TabsTrigger value="system" className="flex-1 gap-1.5">
                  {t(lang, "notificationTabSystem")}
                  {unreadCount > 0 && (
                    <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-overlay leading-4 text-danger-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="price" className="flex-1 gap-1.5">
                  {t(lang, "notificationTabPrice")}
                  {priceTabBadge > 0 && (
                    <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-success px-1 text-overlay leading-4 text-success-foreground">
                      {priceTabBadge > 9 ? "9+" : priceTabBadge}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* System tab */}
            <TabsContent value="system" className="mt-0">
              {items.length > 0 && unreadCount > 0 && (
                <div className="flex items-center justify-end px-4 pt-2">
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <CheckCheck className="size-3" />
                    {t(lang, "markAllRead")}
                  </button>
                </div>
              )}
              <div className="max-h-72 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {t(lang, "noNotifications")}
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-3 border-b border-hair px-4 py-3 transition-colors ease-chrome hover:bg-muted/70",
                        !item.read && "bg-primary/5",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", !item.read && "font-medium")}>
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-meta line-clamp-2">{item.message}</p>
                        <p className="mt-1 text-meta text-muted-foreground/60">
                          {formatRelative(item.createdAt, lang)}
                        </p>
                      </div>
                      {!item.read && (
                        <button
                          type="button"
                          onClick={() => void markAsRead(item.id)}
                          className="tap-safe mt-1 shrink-0 rounded-sm p-1 text-muted-foreground transition-colors ease-chrome hover:bg-muted hover:text-foreground"
                          title={t(lang, "markAsRead")}
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Price tab */}
            <TabsContent value="price" className="mt-0">
              <div className="max-h-72 overflow-y-auto">
                {alertsLoading && alerts === null ? (
                  <div className="space-y-2 p-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
                    ))}
                  </div>
                ) : (alerts?.length ?? 0) === 0 ? (
                  <PriceEmpty onNavigate={() => setOpen(false)} />
                ) : (
                  <div>
                    {triggered.length > 0 && (
                      <SectionHeader label={t(lang, "alertHistory")} />
                    )}
                    {triggered.slice(0, 5).map((alert) => (
                      <PriceAlertRow
                        key={alert.id}
                        alert={alert}
                        kind="triggered"
                        onNavigate={() => setOpen(false)}
                      />
                    ))}

                    {active.length > 0 && (
                      <SectionHeader label={t(lang, "activeAlerts")} />
                    )}
                    {active.slice(0, 5).map((alert) => (
                      <PriceAlertRow
                        key={alert.id}
                        alert={alert}
                        kind="active"
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer for price tab */}
              <div className="flex items-center justify-between border-t border-hair px-4 py-2.5">
                <Link
                  href="/opcg/search"
                  onClick={() => setOpen(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t(lang, "setNewAlert")}
                </Link>
                <Link
                  href="/watchlist?tab=alerts"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {t(lang, "manageAllAlerts")}
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="bg-muted/30 px-4 py-1.5 text-eyebrow text-muted-foreground">
      {label}
    </div>
  );
}

function PriceEmpty({ onNavigate }: { onNavigate: () => void }) {
  const lang = useUIStore((s) => s.language);
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <Bell className="size-7 text-muted-foreground/30" />
      <p className="text-sm text-muted-foreground">{t(lang, "noActiveAlerts")}</p>
      <Link
        href="/opcg/search"
        onClick={onNavigate}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        {t(lang, "browseCardsToAlert")}
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function PriceAlertRow({
  alert,
  kind,
  onNavigate,
}: {
  alert: PriceAlertItem;
  kind: "active" | "triggered";
  onNavigate: () => void;
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
  const DirIcon = dirIsAbove ? ArrowUp : ArrowDown;
  const isTriggered = kind === "triggered";

  return (
    <Link
      href={`/opcg/cards/${alert.card.cardCode}`}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-3 border-b border-hair px-4 py-2.5 transition-colors ease-chrome hover:bg-muted/70",
        isTriggered && "bg-success-soft/40",
      )}
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
        {alert.card.imageUrl ? (
          <Image
            src={alert.card.imageUrl}
            alt={cardName}
            fill
            sizes="40px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{cardName}</p>
          <span className="text-meta text-muted-foreground/60">{alert.card.cardCode}</span>
        </div>

        <div className="mt-0.5 flex items-center gap-1.5 text-xs">
          {isTriggered ? (
            <span className="inline-flex items-center gap-1 font-medium text-success">
              <CheckCheck className="size-3" />
              {t(lang, "priceAlertHitTarget")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <DirIcon
                className={cn(
                  "size-3",
                  dirIsAbove ? "text-price-up" : "text-price-down",
                )}
              />
              {t(lang, "priceAlertWatching")}
            </span>
          )}
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            {dirIsAbove ? "≥" : "≤"} <span className="text-foreground">{target}</span>
          </span>
          {current != null && !isTriggered && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{current}</span>
            </>
          )}
        </div>

        {isTriggered && alert.triggeredAt && (
          <p className="mt-0.5 text-meta text-muted-foreground/60">
            {formatRelative(alert.triggeredAt, lang)}
          </p>
        )}
      </div>
    </Link>
  );
}

function formatRelative(iso: string, lang: Language): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(getLocale(lang), {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
