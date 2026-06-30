"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Fragment, useMemo } from "react";

import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { formatJpyAmount, formatSignedPct } from "@/lib/utils/currency";

import { getEntryChange, type ChangePeriod, type WatchlistEntry } from "./watchlist-types";

/**
 * Inline metadata strip for the watchlist page. Replaces the previous 4-tile
 * KPI grid so the page reads as a calm header → toolbar → list flow.
 *
 * The strip renders only the segments that are meaningful for the current
 * data (e.g. omits "0 alerts", omits gainer/loser when the list has fewer
 * than 3 entries with meaningful movement).
 */
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
    let pinned = 0;
    let topGainer: WatchlistEntry | null = null;
    let topLoser: WatchlistEntry | null = null;
    let topGainerChange = -Infinity;
    let topLoserChange = Infinity;

    for (const e of entries) {
      if (e.card.latestPriceJpy != null) totalValueJpy += e.card.latestPriceJpy;
      if (e.hasActiveAlert) alerts += 1;
      if (e.pinnedAt) pinned += 1;
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

    const showMovement = entries.length >= 3;

    return {
      count: entries.length,
      totalValueJpy,
      alerts,
      pinned,
      topGainer:
        showMovement && topGainer && topGainerChange > 0
          ? { entry: topGainer, change: topGainerChange }
          : null,
      topLoser:
        showMovement && topLoser && topLoserChange < 0
          ? { entry: topLoser, change: topLoserChange }
          : null,
    };
  }, [entries, period]);

  const segments: React.ReactNode[] = [];

  segments.push(
    <span key="count" className="tabular-nums">
      {stats.count.toLocaleString()} {t(lang, "watchlistSummaryCards").toLowerCase()}
    </span>
  );

  if (stats.totalValueJpy > 0) {
    segments.push(
      <span key="value" className="tabular-nums">
        {formatJpyAmount(stats.totalValueJpy, currency)}
      </span>
    );
  }

  if (stats.alerts > 0) {
    segments.push(
      <span key="alerts" className="tabular-nums">
        {stats.alerts} {t(lang, "watchlistSummaryAlerts").toLowerCase()}
      </span>
    );
  }

  if (stats.pinned > 0) {
    segments.push(
      <span key="pinned" className="tabular-nums">
        {stats.pinned} {t(lang, "watchlistFilterPinned").toLowerCase()}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-meta">
      {segments.map((node, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="text-muted-foreground/40">·</span>}
          {node}
        </Fragment>
      ))}

      {stats.topGainer && (
        <MovementChip
          tone="up"
          label={getCardLabel(stats.topGainer.entry)}
          change={stats.topGainer.change}
        />
      )}
      {stats.topLoser && (
        <MovementChip
          tone="down"
          label={getCardLabel(stats.topLoser.entry)}
          change={stats.topLoser.change}
        />
      )}
    </div>
  );
}

function MovementChip({
  tone,
  label,
  change,
}: {
  tone: "up" | "down";
  label: string;
  change: number;
}) {
  const Icon = tone === "up" ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 tabular-nums",
        tone === "up"
          ? "bg-price-up/10 text-price-up"
          : "bg-price-down/10 text-price-down"
      )}
      title={`${label} ${formatSignedPct(change)}`}
    >
      <Icon className="size-3" />
      <span className="max-w-[10rem] truncate">{truncate(label, 16)}</span>
      <span>{formatSignedPct(change)}</span>
    </span>
  );
}

function getCardLabel(entry: WatchlistEntry): string {
  return entry.card.nameEn ?? entry.card.nameJp ?? entry.card.cardCode;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}
