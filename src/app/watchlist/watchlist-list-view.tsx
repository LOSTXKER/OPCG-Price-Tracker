"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Pin, StickyNote } from "lucide-react";

import { MiniSparkline } from "@/components/portfolio/portfolio-hero";
import { PriceDisplay } from "@/components/shared/price-display";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { changeToneClass, formatSignedPct } from "@/lib/utils/currency";

import { WatchlistRowActions } from "./watchlist-row-actions";
import {
  type ChangePeriod,
  type WatchlistEntry,
  getEntryChange,
} from "./watchlist-types";

export function WatchlistListView({
  entries,
  period,
  selected,
  onToggleSelect,
  onToggleAll,
  sparklines,
  onTogglePin,
  onEdit,
  onSetAlert,
  onRemove,
  removingIds,
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
  selected: Set<number>;
  onToggleSelect: (cardId: number) => void;
  onToggleAll: () => void;
  sparklines: Record<number, number[]>;
  onTogglePin: (entry: WatchlistEntry) => void;
  onEdit: (entry: WatchlistEntry) => void;
  onSetAlert: (entry: WatchlistEntry) => void;
  onRemove: (entry: WatchlistEntry) => void;
  removingIds: Set<number>;
}) {
  const lang = useUIStore((s) => s.language);
  const allSelected = entries.length > 0 && entries.every((e) => selected.has(e.cardId));
  const someSelected = !allSelected && entries.some((e) => selected.has(e.cardId));

  if (entries.length === 0) return null;

  return (
    <div className="panel overflow-hidden">
      {/* Mobile rows */}
      <div className="divide-y divide-border/40 sm:hidden">
        {entries.map((entry) => (
          <MobileRow
            key={entry.id}
            entry={entry}
            period={period}
            selected={selected.has(entry.cardId)}
            onToggleSelect={() => onToggleSelect(entry.cardId)}
            onTogglePin={() => onTogglePin(entry)}
            onEdit={() => onEdit(entry)}
            onSetAlert={() => onSetAlert(entry)}
            onRemove={() => onRemove(entry)}
            removing={removingIds.has(entry.cardId)}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-9" />
            <col className="w-7" />
            <col />
            <col className="hidden w-[80px] md:table-column" />
            <col className="w-[120px]" />
            <col className="w-[80px]" />
            <col className="hidden w-[140px] lg:table-column" />
            <col className="hidden w-[120px] xl:table-column" />
            <col className="w-12" />
          </colgroup>
          <thead className="bg-card">
            <tr className="border-b border-border text-eyebrow text-muted-foreground">
              <th className="py-2.5 pl-3 pr-1">
                <input
                  type="checkbox"
                  className="size-3.5 cursor-pointer accent-primary"
                  aria-label={t(lang, "watchlistSelectAll")}
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleAll}
                />
              </th>
              <th className="py-2.5 pr-1 text-center">
                <Pin className="inline size-3 text-muted-foreground/60" />
              </th>
              <th className="py-2.5 pr-3 font-medium">{t(lang, "card")}</th>
              <th className="hidden py-2.5 pr-3 font-medium md:table-cell">{t(lang, "set")}</th>
              <th className="py-2.5 pr-3 text-right font-medium">{t(lang, "price")}</th>
              <th className="py-2.5 pr-3 text-right font-medium">{period}</th>
              <th className="hidden py-2.5 pr-3 font-medium lg:table-cell">
                {t(lang, "watchlistTargetPriceShort")}
              </th>
              <th className="hidden py-2.5 pr-3 font-medium xl:table-cell">
                {t(lang, "sparkline7d")}
              </th>
              <th className="py-2.5 pr-3" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <DesktopRow
                key={entry.id}
                entry={entry}
                period={period}
                selected={selected.has(entry.cardId)}
                onToggleSelect={() => onToggleSelect(entry.cardId)}
                sparklineData={sparklines[entry.cardId]}
                onTogglePin={() => onTogglePin(entry)}
                onEdit={() => onEdit(entry)}
                onSetAlert={() => onSetAlert(entry)}
                onRemove={() => onRemove(entry)}
                removing={removingIds.has(entry.cardId)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DesktopRow({
  entry,
  period,
  selected,
  onToggleSelect,
  sparklineData,
  onTogglePin,
  onEdit,
  onSetAlert,
  onRemove,
  removing,
}: {
  entry: WatchlistEntry;
  period: ChangePeriod;
  selected: boolean;
  onToggleSelect: () => void;
  sparklineData?: number[];
  onTogglePin: () => void;
  onEdit: () => void;
  onSetAlert: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const lang = useUIStore((s) => s.language);
  const change = getEntryChange(entry, period);
  const displayName = getCardName(lang, entry.card);
  const pinned = entry.pinnedAt != null;
  const change7d = entry.card.priceChange7d;

  return (
    <tr
      className={cn(
        "group/row border-b border-border/40 transition-all hover:bg-muted/30",
        pinned && "bg-primary/5",
        removing && "opacity-40"
      )}
    >
      <td className="py-3 pl-3 pr-1">
        <input
          type="checkbox"
          className="size-3.5 cursor-pointer accent-primary"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={displayName}
        />
      </td>
      <td className="py-3 pr-1 text-center">
        <button
          type="button"
          onClick={onTogglePin}
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-md transition-colors",
            pinned
              ? "text-primary"
              : "text-muted-foreground/40 opacity-0 hover:text-foreground group-hover/row:opacity-100"
          )}
          aria-label={pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
          title={pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
        >
          <Pin className={cn("size-3.5", pinned && "fill-current")} />
        </button>
      </td>
      <td className="py-3 pr-3">
        <Link
          href={`/cards/${entry.card.cardCode}`}
          className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <div className="relative size-10 shrink-0 overflow-hidden rounded bg-muted">
            {entry.card.imageUrl && (
              <Image
                src={entry.card.imageUrl}
                alt={displayName}
                fill
                sizes="40px"
                className="object-cover"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <RarityBadge rarity={entry.card.rarity} size="sm" />
              <span className="font-mono text-xs text-muted-foreground">
                {entry.card.cardCode}
              </span>
              {entry.hasActiveAlert && (
                <span
                  className="inline-flex size-4 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  aria-label={t(lang, "watchlistHasAlert")}
                  title={t(lang, "watchlistHasAlert")}
                >
                  <Bell className="size-2.5" />
                </span>
              )}
              {entry.note && (
                <span
                  className="inline-flex size-4 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  aria-label={t(lang, "watchlistNote")}
                  title={entry.note}
                >
                  <StickyNote className="size-2.5" />
                </span>
              )}
            </div>
            <p className="truncate text-sm font-medium" title={displayName}>
              {displayName}
            </p>
          </div>
        </Link>
      </td>
      <td className="hidden py-3 pr-3 text-sm text-muted-foreground md:table-cell">
        <span className="font-mono uppercase">{entry.card.set.code}</span>
      </td>
      <td className="py-3 pr-3 text-right">
        <PriceDisplay
          priceJpy={entry.card.latestPriceJpy}
          priceThb={entry.card.latestPriceThb}
          size="sm"
          showChange={false}
        />
      </td>
      <td className={cn("py-3 pr-3 text-right tabular-nums", changeToneClass(change))}>
        {formatSignedPct(change)}
      </td>
      <td className="hidden py-3 pr-3 lg:table-cell">
        <TargetProgress entry={entry} />
      </td>
      <td className="hidden py-3 pr-3 xl:table-cell">
        {sparklineData && sparklineData.length >= 2 ? (
          <MiniSparkline data={sparklineData} width={120} height={28} />
        ) : (
          <span className="text-meta text-muted-foreground/50">—</span>
        )}
        {change7d == null && (
          <span className="sr-only">{t(lang, "noData")}</span>
        )}
      </td>
      <td className="py-3 pr-2 text-right">
        <WatchlistRowActions
          entry={entry}
          onTogglePin={onTogglePin}
          onEdit={onEdit}
          onSetAlert={onSetAlert}
          onRemove={onRemove}
        />
      </td>
    </tr>
  );
}

function MobileRow({
  entry,
  period,
  selected,
  onToggleSelect,
  onTogglePin,
  onEdit,
  onSetAlert,
  onRemove,
  removing,
}: {
  entry: WatchlistEntry;
  period: ChangePeriod;
  selected: boolean;
  onToggleSelect: () => void;
  onTogglePin: () => void;
  onEdit: () => void;
  onSetAlert: () => void;
  onRemove: () => void;
  removing: boolean;
}) {
  const lang = useUIStore((s) => s.language);
  const change = getEntryChange(entry, period);
  const displayName = getCardName(lang, entry.card);
  const pinned = entry.pinnedAt != null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-3 transition-all",
        pinned && "bg-primary/5",
        removing && "opacity-40"
      )}
    >
      <input
        type="checkbox"
        className="size-3.5 shrink-0 cursor-pointer accent-primary"
        checked={selected}
        onChange={onToggleSelect}
        aria-label={displayName}
      />
      <Link
        href={`/cards/${entry.card.cardCode}`}
        className="flex flex-1 items-center gap-3 focus-visible:outline-none"
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
          {entry.card.imageUrl && (
            <Image
              src={entry.card.imageUrl}
              alt={displayName}
              fill
              sizes="48px"
              className="object-cover"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          )}
          {pinned && (
            <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Pin className="size-2.5 fill-current" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <RarityBadge rarity={entry.card.rarity} size="sm" />
            <span className="font-mono text-xs text-muted-foreground">
              {entry.card.cardCode}
            </span>
            {entry.hasActiveAlert && (
              <Bell className="size-3 text-amber-500" />
            )}
          </div>
          <p className="truncate text-sm font-medium">{displayName}</p>
          <div className="flex items-center justify-between gap-3 pt-0.5">
            <PriceDisplay
              priceJpy={entry.card.latestPriceJpy}
              priceThb={entry.card.latestPriceThb}
              size="sm"
              showChange={false}
            />
            <span
              className={cn(
                "text-xs tabular-nums",
                changeToneClass(change)
              )}
            >
              {formatSignedPct(change)}
            </span>
          </div>
          {entry.targetPriceJpy != null && (
            <div className="pt-1">
              <TargetProgress entry={entry} compact />
            </div>
          )}
        </div>
      </Link>
      <WatchlistRowActions
        entry={entry}
        onTogglePin={onTogglePin}
        onEdit={onEdit}
        onSetAlert={onSetAlert}
        onRemove={onRemove}
      />
    </div>
  );
}

function TargetProgress({
  entry,
  compact,
}: {
  entry: WatchlistEntry;
  compact?: boolean;
}) {
  const lang = useUIStore((s) => s.language);
  const target = entry.targetPriceJpy;
  const current = entry.card.latestPriceJpy;

  if (target == null) {
    return <span className="text-meta text-muted-foreground/50">—</span>;
  }

  if (current == null) {
    return (
      <span className="text-meta tabular-nums text-muted-foreground">
        ¥{target.toLocaleString()}
      </span>
    );
  }

  // Direction: if current > target → user is waiting for price to drop (target is below)
  // If current < target → user wants price to climb (target is above)
  const targetAbove = target > current;
  const ratio = targetAbove ? current / target : target / current;
  const pct = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  const reached = targetAbove ? current >= target : current <= target;

  return (
    <div className={cn("space-y-0.5", compact && "space-y-0")}>
      <div className="flex items-center justify-between gap-2 text-meta tabular-nums">
        <span className={cn(reached && "font-semibold text-price-up")}>
          {reached ? t(lang, "watchlistTargetReached") : `¥${target.toLocaleString()}`}
        </span>
        {!reached && (
          <span className="text-muted-foreground/70">{pct}%</span>
        )}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            reached ? "bg-price-up" : targetAbove ? "bg-primary" : "bg-amber-500"
          )}
          style={{ width: `${reached ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}
