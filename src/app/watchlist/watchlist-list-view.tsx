"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";

import { GameBadge } from "@/components/shared/game-badge";
import { SortableHeader } from "@/components/shared/sortable-header";
import { IconButton } from "@/components/ui/icon-button";
import { MiniSparkline } from "@/components/ui/mini-sparkline";
import { PriceTag } from "@/components/ui/price-tag";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { DEFAULT_GAME } from "@/lib/game/constants";
import { getCardName, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

import { useLongPress } from "./use-long-press";
import { WatchlistRowActionsDialog } from "./watchlist-row-actions";
import { WatchlistPeriodControl } from "./watchlist-summary";
import {
  formatEntryThb,
  getEntryChange,
  type ChangePeriod,
  type SortKey,
  type WatchlistEntry,
} from "./watchlist-types";

/** Columns the desktop header (and the mobile list header) can sort by. */
export type WatchlistHeaderCol = "name" | "price" | ChangePeriod;

export function WatchlistListView({
  entries,
  period,
  onPeriodChange,
  editMode,
  selected,
  onToggleSelect,
  sparklines,
  hasAnySparkline,
  onSetAlert,
  onRemove,
  removingIds,
  showGameBadge = false,
  sortKey = "default",
  onHeaderSort,
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
  /** Mobile only — the period pill sits on the list header row. */
  onPeriodChange?: (period: ChangePeriod) => void;
  editMode: boolean;
  selected: Set<number>;
  onToggleSelect: (cardId: number) => void;
  sparklines: Record<number, number[]>;
  hasAnySparkline: boolean;
  onSetAlert: (entry: WatchlistEntry) => void;
  onRemove: (entry: WatchlistEntry) => void;
  removingIds: Set<number>;
  showGameBadge?: boolean;
  sortKey?: SortKey;
  /** Desktop column headers + the mobile list header both act as sort buttons
   *  (canonical SortableHeader) — cols: name · price · 24h/7d/30d. */
  onHeaderSort?: (col: WatchlistHeaderCol) => void;
}) {
  const lang = useUIStore((s) => s.language);
  const router = useRouter();
  const [actionEntry, setActionEntry] = useState<WatchlistEntry | null>(null);
  const [actionOpen, setActionOpen] = useState(false);

  // Map the page's sortKey (+active period) onto the header columns so the
  // canonical SortableHeader can show the active column + direction.
  const headerSort = ((): { activeCol: WatchlistHeaderCol | null; dir: "asc" | "desc" } => {
    switch (sortKey) {
      case "nameAz":
        return { activeCol: "name", dir: "asc" };
      case "nameZa":
        return { activeCol: "name", dir: "desc" };
      case "priceHigh":
        return { activeCol: "price", dir: "desc" };
      case "priceLow":
        return { activeCol: "price", dir: "asc" };
      case "gain":
        return { activeCol: period, dir: "desc" };
      case "loss":
        return { activeCol: period, dir: "asc" };
      default:
        return { activeCol: null, dir: "desc" };
    }
  })();

  if (entries.length === 0) return null;

  const openRowActions = (entry: WatchlistEntry) => {
    setActionEntry(entry);
    setActionOpen(true);
  };

  return (
    <>
      {/* Mobile (<sm) — Apple-Stocks anatomy: a thin list header (period pill +
          tap-sort) above a flat panel of rows. Single-card actions are a
          long-press sheet — there's no trailing ⋯ on the row. */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between gap-2 border-b border-hair px-1 pb-2">
          {onPeriodChange ? (
            <WatchlistPeriodControl period={period} onPeriodChange={onPeriodChange} />
          ) : (
            <span aria-hidden />
          )}
          <div className="flex items-center gap-3">
            <SortableHeader<WatchlistHeaderCol>
              as="button"
              label={t(lang, "price")}
              column="price"
              activeCol={headerSort.activeCol}
              dir={headerSort.dir}
              onClick={(col) => onHeaderSort?.(col)}
            />
            <SortableHeader<WatchlistHeaderCol>
              as="button"
              label={t(lang, "change")}
              column={period}
              activeCol={headerSort.activeCol}
              dir={headerSort.dir}
              onClick={() => onHeaderSort?.(period)}
            />
          </div>
        </div>

        <div className="panel mt-2 overflow-hidden">
          <div className="divide-y divide-hair">
            {entries.map((entry) => (
              <WatchlistMobileRow
                key={entry.id}
                entry={entry}
                period={period}
                editMode={editMode}
                selected={selected.has(entry.cardId)}
                onToggleSelect={() => onToggleSelect(entry.cardId)}
                sparkline={sparklines[entry.cardId]}
                removing={removingIds.has(entry.cardId)}
                showGameBadge={showGameBadge}
                onLongPress={() => openRowActions(entry)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Dense price-check table (>=sm): flat canvas, matching Home market data.
          No table-fixed/colgroup — the 30D column only appears from `xl:` and
          keeping widths on th/td (not <col>) is the simple way to hide a
          column without the colgroup falling out of sync. */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse text-left text-body-sm">
          <thead>
            <tr className="border-b border-hair text-eyebrow">
              <SortableHeader<WatchlistHeaderCol>
                label={t(lang, "card")}
                column="name"
                activeCol={headerSort.activeCol}
                dir={headerSort.dir}
                onClick={(col) => onHeaderSort?.(col)}
                className="pl-3"
              />
              <SortableHeader<WatchlistHeaderCol>
                label={t(lang, "price")}
                column="price"
                activeCol={headerSort.activeCol}
                dir={headerSort.dir}
                onClick={(col) => onHeaderSort?.(col)}
                align="right"
                className="w-28 px-3"
              />
              <SortableHeader<WatchlistHeaderCol>
                label="24H"
                column="24h"
                activeCol={headerSort.activeCol}
                dir={headerSort.dir}
                onClick={(col) => onHeaderSort?.(col)}
                align="right"
                className="w-20 px-3"
              />
              <SortableHeader<WatchlistHeaderCol>
                label="7D"
                column="7d"
                activeCol={headerSort.activeCol}
                dir={headerSort.dir}
                onClick={(col) => onHeaderSort?.(col)}
                align="right"
                className="w-20 px-3"
              />
              <SortableHeader<WatchlistHeaderCol>
                label="30D"
                column="30d"
                activeCol={headerSort.activeCol}
                dir={headerSort.dir}
                onClick={(col) => onHeaderSort?.(col)}
                align="right"
                className="hidden w-20 px-3 xl:table-cell"
              />
              {hasAnySparkline && (
                <th scope="col" className="hidden px-3 py-2.5 text-center lg:table-cell">
                  {t(lang, "priceHistory")}
                </th>
              )}
              <th scope="col" className="w-24 px-2 py-2.5">
                <span className="sr-only">{t(lang, "moreActions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const displayName = getCardName(lang, entry.card);
              const removing = removingIds.has(entry.cardId);
              const sparklineData = sparklines[entry.cardId];
              const href = `/${entry.card.set.game?.slug ?? DEFAULT_GAME}/cards/${entry.card.cardCode}`;

              return (
                <tr
                  key={entry.id}
                  className={cn(
                    "group ease-chrome transition-colors",
                    removing && "pointer-events-none opacity-40",
                    editMode
                      ? cn(
                          "cursor-pointer select-none",
                          selected.has(entry.cardId)
                            ? "bg-primary/10"
                            : "hover:bg-muted/60",
                        )
                      : "cursor-pointer hover:bg-muted/50",
                  )}
                  onClick={() =>
                    editMode ? onToggleSelect(entry.cardId) : router.push(href)
                  }
                >
                  <td className="min-w-0 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      {editMode && (
                        <label
                          className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center md:size-9"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="size-4 cursor-pointer accent-primary"
                            checked={selected.has(entry.cardId)}
                            onChange={() => onToggleSelect(entry.cardId)}
                            aria-label={displayName}
                          />
                        </label>
                      )}
                      {editMode ? (
                        <DesktopCardIdentity
                          entry={entry}
                          displayName={displayName}
                          showGameBadge={showGameBadge}
                        />
                      ) : (
                        <Link
                          href={href}
                          className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <DesktopCardIdentity
                            entry={entry}
                            displayName={displayName}
                            showGameBadge={showGameBadge}
                          />
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="w-28 px-3 py-2.5 text-right">
                    <div className="flex flex-col items-end tabular-nums">
                      <span className="text-code font-semibold">
                        {formatEntryThb(entry.card)}
                      </span>
                    </div>
                  </td>
                  <td className="w-20 px-3 py-2.5 text-right">
                    <PriceTag
                      change={getEntryChange(entry, "24h")}
                      changeOnly
                      changeStyle="plain"
                      size="sm"
                    />
                  </td>
                  <td className="w-20 px-3 py-2.5 text-right">
                    <PriceTag
                      change={getEntryChange(entry, "7d")}
                      changeOnly
                      changeStyle="plain"
                      size="sm"
                    />
                  </td>
                  <td className="hidden w-20 px-3 py-2.5 text-right xl:table-cell">
                    <PriceTag
                      change={getEntryChange(entry, "30d")}
                      changeOnly
                      changeStyle="plain"
                      size="sm"
                    />
                  </td>
                  {hasAnySparkline && (
                    <td className="hidden px-3 py-2.5 lg:table-cell">
                      <div className="flex justify-center">
                        {sparklineData?.length >= 2 ? (
                          <MiniSparkline data={sparklineData} width={104} height={28} />
                        ) : (
                          <span className="text-meta" aria-hidden>
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  )}
                  <td
                    className="w-24 px-2 py-2.5 text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {!editMode && (
                        <WatchlistRowActions
                          entry={entry}
                          onSetAlert={() => onSetAlert(entry)}
                          onRemove={() => onRemove(entry)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {actionEntry && (
        <WatchlistRowActionsDialog
          entry={actionEntry}
          open={actionOpen}
          onOpenChange={setActionOpen}
          onSetAlert={() => onSetAlert(actionEntry)}
          onRemove={() => onRemove(actionEntry)}
        />
      )}
    </>
  );
}

function WatchlistMobileRow({
  entry,
  period,
  editMode,
  selected,
  onToggleSelect,
  sparkline,
  removing,
  showGameBadge,
  onLongPress,
}: {
  entry: WatchlistEntry;
  period: ChangePeriod;
  editMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  sparkline?: number[];
  removing: boolean;
  showGameBadge: boolean;
  onLongPress: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const displayName = getCardName(lang, entry.card);
  const change = getEntryChange(entry, period);
  const longPress = useLongPress(onLongPress);

  const identity = (
    <>
      <div className="relative aspect-[63/88] h-[72px] shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-hair">
        {entry.card.imageUrl && (
          <Image
            src={entry.card.imageUrl}
            alt={displayName}
            fill
            sizes="52px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-sm font-medium">{displayName}</p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
          <span className="truncate font-mono text-muted-foreground">
            {entry.card.cardCode}
          </span>
          {entry.hasActiveAlert && (
            <span
              role="img"
              aria-label={t(lang, "watchlistHasAlert")}
              className="inline-flex shrink-0 text-primary"
            >
              <Bell className="size-3 fill-current" aria-hidden />
            </span>
          )}
          {showGameBadge && <GameBadge game={entry.card.set.game} />}
        </div>
        {sparkline && sparkline.length >= 2 && (
          <div className="mt-1">
            <MiniSparkline data={sparkline} width={80} height={24} className="h-6 w-20" />
          </div>
        )}
      </div>
    </>
  );

  const price = (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <PriceTag
        jpy={entry.card.latestPriceJpy}
        thb={entry.card.latestPriceThb}
        size="sm"
        showChange={false}
        className="flex-nowrap whitespace-nowrap"
      />
      <PriceTag
        change={change}
        changeOnly
        changeStyle="chip"
        size="sm"
        className="min-w-[72px] justify-end"
      />
    </div>
  );

  const rowClass = cn(
    "ease-chrome flex min-w-0 items-center gap-3 px-3 py-2.5 transition-colors",
    removing && "pointer-events-none opacity-40",
  );

  if (editMode) {
    return (
      <label
        className={cn(
          rowClass,
          "cursor-pointer select-none",
          selected ? "bg-primary/10" : "hover:bg-muted/60",
        )}
      >
        <span className="inline-flex size-11 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            className="size-4 cursor-pointer accent-primary"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={displayName}
          />
        </span>
        {identity}
        {price}
      </label>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-stretch", removing && "pointer-events-none opacity-40")}>
      <Link
        href={`/${entry.card.set.game?.slug ?? DEFAULT_GAME}/cards/${entry.card.cardCode}`}
        aria-label={displayName}
        className={cn(
          "ease-chrome flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3 pr-1 transition-colors",
          "hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        )}
        onTouchStart={longPress.onTouchStart}
        onTouchMove={longPress.onTouchMove}
        onTouchEnd={longPress.onTouchEnd}
        onContextMenu={longPress.onContextMenu}
        onClickCapture={longPress.onClickCapture}
      >
        {identity}
        {price}
      </Link>
      {/* Visible per-row entry into the action sheet (owner: long-press alone
          is undiscoverable) — long-press still opens the same sheet. */}
      <span className="flex shrink-0 items-center pr-2">
        <IconButton
          aria-label={t(lang, "moreActions")}
          size="md"
          className="text-muted-foreground"
          onClick={onLongPress}
        >
          <MoreHorizontal className="size-4" />
        </IconButton>
      </span>
    </div>
  );
}

function DesktopCardIdentity({
  entry,
  displayName,
  showGameBadge,
}: {
  entry: WatchlistEntry;
  displayName: string;
  showGameBadge: boolean;
}) {
  return (
    <>
      <div className="relative aspect-[63/88] h-12 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-hair">
        {entry.card.imageUrl && (
          <Image
            src={entry.card.imageUrl}
            alt={displayName}
            fill
            sizes="35px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 break-words text-body-sm" title={displayName}>
          {displayName}
        </p>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-meta">
          <span className="truncate font-mono text-muted-foreground">
            {entry.card.cardCode}
          </span>
          {showGameBadge && <GameBadge game={entry.card.set.game} />}
        </div>
      </div>
    </>
  );
}


/** Desktop action cluster — always visible (owner: CTA ไม่ต้องซ่อนตรงตาราง).
 *  The bell doubles as the alert-status indicator via its fill/tone. */
function WatchlistRowActions({
  entry,
  onSetAlert,
  onRemove,
}: {
  entry: WatchlistEntry;
  onSetAlert: () => void;
  onRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);

  return (
    <div className="flex items-center gap-1">
      <IconButton
        aria-label={entry.hasActiveAlert ? t(lang, "watchlistHasAlert") : t(lang, "setPriceAlert")}
        size="sm"
        className={cn("size-8", entry.hasActiveAlert && "text-primary")}
        onClick={onSetAlert}
      >
        <Bell className={cn("size-4", entry.hasActiveAlert && "fill-current")} />
      </IconButton>
      <IconButton
        aria-label={t(lang, "removeFromWatchlist")}
        size="sm"
        className="size-8 hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );
}
