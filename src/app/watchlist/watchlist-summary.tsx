"use client";

import { Bell, Eye, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";

import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { formatJpyAmount, formatSignedPct } from "@/lib/utils/currency";

import { getEntryChange, type ChangePeriod, type WatchlistEntry } from "./watchlist-types";

export function WatchlistSummary({
  entries,
  period,
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
}) {
  const lang = useUIStore((s) => s.language);
  const currency = useUIStore((s) => s.currency);

  const stats = useMemo(() => {
    let totalValueJpy = 0;
    let alerts = 0;
    let topGainer: WatchlistEntry | null = null;
    let topLoser: WatchlistEntry | null = null;
    let topGainerChange = -Infinity;
    let topLoserChange = Infinity;

    for (const e of entries) {
      if (e.card.latestPriceJpy != null) totalValueJpy += e.card.latestPriceJpy;
      if (e.hasActiveAlert) alerts += 1;
      const change = getEntryChange(e, period);
      if (change == null) continue;
      if (change > topGainerChange) {
        topGainerChange = change;
        topGainer = e;
      }
      if (change < topLoserChange) {
        topLoserChange = change;
        topLoser = e;
      }
    }

    return {
      count: entries.length,
      totalValueJpy,
      alerts,
      topGainer:
        topGainer && topGainerChange > 0
          ? { entry: topGainer, change: topGainerChange }
          : null,
      topLoser:
        topLoser && topLoserChange < 0
          ? { entry: topLoser, change: topLoserChange }
          : null,
    };
  }, [entries, period]);

  const cards = [
    {
      key: "count",
      icon: <Eye className="size-4 text-primary" />,
      label: t(lang, "watchlistSummaryCards"),
      value: stats.count.toLocaleString(),
      sub:
        stats.alerts > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Bell className="size-3" />
            {stats.alerts} {t(lang, "watchlistSummaryAlerts").toLowerCase()}
          </span>
        ) : undefined,
    },
    {
      key: "value",
      icon: <Wallet className="size-4 text-primary" />,
      label: t(lang, "watchlistSummaryValue"),
      value:
        stats.totalValueJpy > 0
          ? formatJpyAmount(stats.totalValueJpy, currency)
          : "—",
    },
    stats.topGainer && {
      key: "gainer",
      icon: <TrendingUp className="size-4 text-price-up" />,
      label: t(lang, "watchlistSummaryGainer"),
      value: truncate(getCardLabel(stats.topGainer.entry), 18),
      sub: formatSignedPct(stats.topGainer.change),
      subTone: "up" as const,
    },
    stats.topLoser && {
      key: "loser",
      icon: <TrendingDown className="size-4 text-price-down" />,
      label: t(lang, "watchlistSummaryLoser"),
      value: truncate(getCardLabel(stats.topLoser.entry), 18),
      sub: formatSignedPct(stats.topLoser.change),
      subTone: "down" as const,
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: React.ReactNode;
    subTone?: "up" | "down";
  }>;

  // Use a responsive grid that adapts to the actual card count so we
  // never render empty "—" placeholders.
  const colsClass =
    cards.length === 2
      ? "grid-cols-2"
      : cards.length === 3
        ? "grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn("grid gap-2.5", colsClass)}>
      {cards.map((c) => (
        <KpiCard
          key={c.key}
          icon={c.icon}
          label={c.label}
          value={c.value}
          sub={c.sub}
          subTone={c.subTone}
        />
      ))}
    </div>
  );
}

function getCardLabel(entry: WatchlistEntry): string {
  return entry.card.nameEn ?? entry.card.nameJp ?? entry.card.cardCode;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  subTone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: React.ReactNode;
  subTone?: "up" | "down";
}) {
  return (
    <div className="panel flex flex-col gap-0.5 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-eyebrow">
        {icon}
        <span>{label}</span>
      </div>
      <p
        className="truncate text-lg font-semibold tabular-nums leading-tight"
        title={value}
      >
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            "text-meta tabular-nums",
            subTone === "up" && "text-price-up",
            subTone === "down" && "text-price-down"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
