"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MoreHorizontal, Trash2 } from "lucide-react";

import { GameBadge } from "@/components/shared/game-badge";
import { Price } from "@/components/shared/price-inline";
import { PriceUsd } from "@/components/shared/price-usd";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { SortableHeader } from "@/components/shared/sortable-header";
import {
  buildMarketColumns,
  getMarketColumnLabel,
} from "@/components/market/market-columns";
import {
  MarketTableLayout,
  marketTableCellClass,
  marketTableHeaderClass,
  type MarketTableLayoutColumn,
} from "@/components/market/market-table-layout";
import { IconButton } from "@/components/ui/icon-button";
import { MiniSparkline } from "@/components/ui/mini-sparkline";
import { PriceTag } from "@/components/ui/price-tag";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { DEFAULT_GAME } from "@/lib/game/constants";
import { getCardName, t } from "@/lib/i18n";
import {
  getGradePriceUsd,
  isRawGrade,
  type GradeKey,
} from "@/lib/pricing/grade-tiers";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WatchlistPeriodControl } from "./watchlist-summary";
import {
  getEntryChange,
  type ChangePeriod,
  type SortKey,
  type WatchlistEntry,
} from "./watchlist-types";

/** Columns the desktop header (and the mobile list header) can sort by. */
export type WatchlistHeaderCol = "name" | "price" | ChangePeriod;

const WATCHLIST_TABLE_COLUMNS: MarketTableLayoutColumn[] = [
  ...buildMarketColumns({ showViews: false }).filter(
    (column) => column.key !== "star" && column.key !== "rank",
  ),
  { key: "actions", col: "w-[100px]", cell: "", align: "right" },
];

export function WatchlistListView({
  entries,
  grade = "raw",
  period,
  onPeriodChange,
  editMode,
  selected,
  onToggleSelect,
  sparklines,
  onSetAlert,
  onRemove,
  removingIds,
  showGameBadge = false,
  sortKey = "default",
  onHeaderSort,
}: {
  entries: WatchlistEntry[];
  grade?: GradeKey;
  period: ChangePeriod;
  /** Mobile only — the period pill sits on the list header row. */
  onPeriodChange?: (period: ChangePeriod) => void;
  editMode: boolean;
  selected: Set<number>;
  onToggleSelect: (cardId: number) => void;
  sparklines: Record<number, number[]>;
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
  const rawGrade = isRawGrade(grade);
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

  return (
    <>
      {/* Mobile (<sm): the same compact market-list density as Home. */}
      <div className="sm:hidden">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b border-hair px-1 pb-2">
          {onPeriodChange ? (
            <WatchlistPeriodControl period={period} onPeriodChange={onPeriodChange} />
          ) : (
            <span aria-hidden />
          )}
          <div className="ml-auto flex items-center gap-3">
            <SortableHeader<WatchlistHeaderCol>
              as="button"
              label={t(lang, "price")}
              column="price"
              activeCol={headerSort.activeCol}
              dir={headerSort.dir}
              onClick={(col) => onHeaderSort?.(col)}
            />
            {rawGrade ? (
              <SortableHeader<WatchlistHeaderCol>
                as="button"
                label={t(lang, "change")}
                column={period}
                activeCol={headerSort.activeCol}
                dir={headerSort.dir}
                onClick={() => onHeaderSort?.(period)}
              />
            ) : (
              <span className="text-label text-muted-foreground">
                {t(lang, "change")}
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-hair">
          {entries.map((entry) => (
            <WatchlistMobileRow
              key={entry.id}
              entry={entry}
              grade={grade}
              period={period}
              editMode={editMode}
              selected={selected.has(entry.cardId)}
              onToggleSelect={() => onToggleSelect(entry.cardId)}
              sparkline={sparklines[entry.cardId]}
              removing={removingIds.has(entry.cardId)}
              showGameBadge={showGameBadge}
              onSetAlert={() => onSetAlert(entry)}
              onRemove={() => onRemove(entry)}
            />
          ))}
        </div>
      </div>

      <MarketTableLayout
        columns={WATCHLIST_TABLE_COLUMNS}
        surface="canvas"
        header={WATCHLIST_TABLE_COLUMNS.map((column) => {
          const periodColumn =
            column.key === "change24h"
              ? "24h"
              : column.key === "change7d"
                ? "7d"
                : column.key === "change30d"
                  ? "30d"
                  : null;
          const sortableColumn =
            column.key === "card"
              ? "name"
              : column.key === "price"
                ? "price"
                : rawGrade
                  ? periodColumn
                  : null;

          if (sortableColumn) {
            return (
              <SortableHeader<WatchlistHeaderCol>
                key={column.key}
                label={
                  sortableColumn === "name"
                    ? t(lang, "card")
                    : getMarketColumnLabel(column, lang)
                }
                column={sortableColumn}
                activeCol={headerSort.activeCol}
                dir={headerSort.dir}
                onClick={(col) => onHeaderSort?.(col)}
                align={column.align === "right" ? "right" : "left"}
                className={column.cell || undefined}
              />
            );
          }

          const label = getMarketColumnLabel(column, lang);

          return (
            <th key={column.key} className={marketTableHeaderClass(column)}>
              {column.key === "actions" ? (
                <span className="sr-only">{t(lang, "moreActions")}</span>
              ) : (
                label
              )}
            </th>
          );
        })}
      >
        {entries.map((entry) => (
          <WatchlistDesktopRow
            key={entry.id}
            entry={entry}
            grade={grade}
            editMode={editMode}
            selected={selected.has(entry.cardId)}
            onToggleSelect={() => onToggleSelect(entry.cardId)}
            sparkline={sparklines[entry.cardId]}
            removing={removingIds.has(entry.cardId)}
            showGameBadge={showGameBadge}
            onSetAlert={() => onSetAlert(entry)}
            onRemove={() => onRemove(entry)}
          />
        ))}
      </MarketTableLayout>
    </>
  );
}

function WatchlistDesktopRow({
  entry,
  grade,
  editMode,
  selected,
  onToggleSelect,
  sparkline,
  removing,
  showGameBadge,
  onSetAlert,
  onRemove,
}: {
  entry: WatchlistEntry;
  grade: GradeKey;
  editMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  sparkline?: number[];
  removing: boolean;
  showGameBadge: boolean;
  onSetAlert: () => void;
  onRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const router = useRouter();
  const displayName = getCardName(lang, entry.card);
  const rawGrade = isRawGrade(grade);
  const gradePriceUsd = getGradePriceUsd(entry.card.psa10PriceUsd, grade);
  const gameSlug = entry.card.set.game?.slug ?? DEFAULT_GAME;
  const cardHref = `/${gameSlug}/cards/${entry.card.cardCode}`;
  const setHref = `/${gameSlug}/sets/${entry.card.set.code.toLowerCase()}`;

  function renderCell(column: MarketTableLayoutColumn) {
    switch (column.key) {
      case "card":
        return (
          <div className="flex min-w-0 items-center gap-2">
            {editMode && (
              <label
                className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center md:size-9"
                onClick={(event) => event.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="size-4 cursor-pointer accent-primary"
                  checked={selected}
                  onChange={onToggleSelect}
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
                href={cardHref}
                onClick={(event) => event.stopPropagation()}
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
        );
      case "set":
        return editMode ? (
          <span className="font-mono text-xs text-muted-foreground">
            {entry.card.set.code.toUpperCase()}
          </span>
        ) : (
          <Link
            href={setHref}
            onClick={(event) => event.stopPropagation()}
            className="ease-chrome font-mono text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-foreground hover:decoration-solid"
          >
            {entry.card.set.code.toUpperCase()}
          </Link>
        );
      case "rarity":
        return <RarityBadge rarity={entry.card.rarity} size="sm" />;
      case "price":
        return (
          <span className="text-price">
            {rawGrade ? (
              entry.card.latestPriceJpy != null ? (
                <Price
                  jpy={entry.card.latestPriceJpy}
                  thb={entry.card.latestPriceThb}
                />
              ) : (
                <DataDash />
              )
            ) : gradePriceUsd != null ? (
              <PriceUsd usd={gradePriceUsd} />
            ) : (
              <DataDash />
            )}
          </span>
        );
      case "change24h":
      case "change7d":
      case "change30d": {
        const changePeriod =
          column.key === "change24h"
            ? "24h"
            : column.key === "change7d"
              ? "7d"
              : "30d";
        return rawGrade ? (
          <PriceTag
            change={getEntryChange(entry, changePeriod)}
            changeOnly
            changeStyle="plain"
            showArrow={false}
            size="sm"
          />
        ) : (
          <DataDash />
        );
      }
      case "sparkline":
        return rawGrade && sparkline && sparkline.length >= 2 ? (
          <MiniSparkline
            data={sparkline}
            width={88}
            height={28}
            className="ml-auto block"
          />
        ) : (
          <DataDash />
        );
      case "actions":
        return !editMode ? (
          <WatchlistRowActions
            entry={entry}
            onSetAlert={onSetAlert}
            onRemove={onRemove}
          />
        ) : null;
      default:
        return null;
    }
  }

  return (
    <tr
      className={cn(
        "group ease-chrome transition-colors",
        removing && "pointer-events-none opacity-40",
        editMode
          ? cn(
              "cursor-pointer select-none",
              selected ? "bg-primary/10" : "hover:bg-muted/60",
            )
          : "cursor-pointer hover:bg-muted/70",
      )}
      onClick={() => (editMode ? onToggleSelect() : router.push(cardHref))}
    >
      {WATCHLIST_TABLE_COLUMNS.map((column) => (
        <td
          key={column.key}
          className={marketTableCellClass(column)}
          onClick={
            column.key === "actions" && !editMode
              ? (event) => event.stopPropagation()
              : undefined
          }
        >
          {renderCell(column)}
        </td>
      ))}
    </tr>
  );
}

function DataDash() {
  return <span className="font-price text-xs text-muted-foreground/40">—</span>;
}

function WatchlistMobileRow({
  entry,
  grade,
  period,
  editMode,
  selected,
  onToggleSelect,
  sparkline,
  removing,
  showGameBadge,
  onSetAlert,
  onRemove,
}: {
  entry: WatchlistEntry;
  grade: GradeKey;
  period: ChangePeriod;
  editMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  sparkline?: number[];
  removing: boolean;
  showGameBadge: boolean;
  onSetAlert: () => void;
  onRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const displayName = getCardName(lang, entry.card);
  const change = getEntryChange(entry, period);
  const rawGrade = isRawGrade(grade);
  const gradePriceUsd = getGradePriceUsd(entry.card.psa10PriceUsd, grade);
  const activeAlertLabel = `${t(lang, "watchlistHasAlert")} · Raw`;
  const alertActionLabel = `${entry.hasActiveAlert
    ? t(lang, "watchlistHasAlert")
    : t(lang, "setPriceAlert")} · Raw`;

  const identity = (
    <>
      <div className="hairline relative aspect-[63/88] w-11 shrink-0 overflow-hidden rounded-md bg-muted">
        {entry.card.imageUrl && (
          <Image
            src={entry.card.imageUrl}
            alt={displayName}
            fill
            sizes="44px"
            className="object-contain"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
          <span className="truncate font-mono text-muted-foreground">
            {entry.card.baseCode ?? entry.card.cardCode}
          </span>
          <RarityBadge rarity={entry.card.rarity} size="sm" />
          {entry.hasActiveAlert && (
            <span
              role="img"
              aria-label={activeAlertLabel}
              title={activeAlertLabel}
              className="inline-flex shrink-0 text-primary"
            >
              <Bell className="size-3 fill-current" aria-hidden />
            </span>
          )}
          {showGameBadge && <GameBadge game={entry.card.set.game} />}
          {rawGrade && sparkline && sparkline.length >= 2 ? (
            <MiniSparkline
              data={sparkline}
              width={48}
              height={20}
              className="ml-auto shrink-0"
            />
          ) : !rawGrade ? (
            <span aria-hidden className="ml-auto shrink-0 text-meta">—</span>
          ) : null}
        </div>
      </div>
    </>
  );

  const price = (
    <div className="flex shrink-0 flex-col items-end text-right">
      {!rawGrade ? (
        <>
          {gradePriceUsd != null ? (
            <PriceUsd usd={gradePriceUsd} className="text-sm font-semibold" />
          ) : (
            <span className="font-price text-sm text-muted-foreground/50">—</span>
          )}
          <span className="mt-0.5 block min-h-4 text-meta" aria-label={t(lang, "change")}>
            —
          </span>
        </>
      ) : (
        <>
          <p className="font-price inline-flex items-baseline justify-end gap-1 text-sm font-semibold">
            {entry.card.latestPriceJpy != null ? (
              <Price
                jpy={entry.card.latestPriceJpy}
                thb={entry.card.latestPriceThb}
              />
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </p>
          {change != null ? (
            <PriceTag
              change={change}
              changeOnly
              changeStyle="plain"
              showArrow={false}
              size="sm"
              className="mt-0.5"
            />
          ) : (
            <span className="mt-0.5 block min-h-4 text-meta">—</span>
          )}
        </>
      )}
    </div>
  );

  const rowClass = cn(
    "ease-chrome flex min-w-0 items-center gap-3 px-4 py-2.5 transition-colors",
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
    // Hover highlight lives on the WHOLE row (link + ⋯ zone), not just the link.
    <div
      className={cn(
        "ease-chrome flex min-w-0 items-stretch transition-colors hover:bg-muted/70",
        removing && "pointer-events-none opacity-40",
      )}
    >
      <Link
        href={`/${entry.card.set.game?.slug ?? DEFAULT_GAME}/cards/${entry.card.cardCode}`}
        aria-label={displayName}
        className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 pr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        {identity}
        {price}
      </Link>
      {/* Plain dropdown per row (owner: no centered popup). */}
      <span className="flex shrink-0 items-center pr-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t(lang, "moreActions")}
            className="ease-chrome inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="min-h-11 md:min-h-0"
              onClick={onSetAlert}
              title={alertActionLabel}
              aria-label={alertActionLabel}
            >
              <Bell
                className={cn(
                  "size-4",
                  entry.hasActiveAlert && "fill-current text-primary",
                )}
              />
              {alertActionLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="min-h-11 md:min-h-0"
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
              {t(lang, "removeFromWatchlist")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {entry.card.imageUrl && (
          <Image
            src={entry.card.imageUrl}
            alt={displayName}
            fill
            sizes="40px"
            className="object-contain"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight" title={displayName}>
          {displayName}
        </p>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
          <span className="truncate font-mono text-muted-foreground">
            {entry.card.baseCode ?? entry.card.cardCode}
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
  const alertLabel = `${entry.hasActiveAlert
    ? t(lang, "watchlistHasAlert")
    : t(lang, "setPriceAlert")} · Raw`;

  return (
    <div className="flex items-center justify-end gap-2">
      <IconButton
        aria-label={alertLabel}
        title={alertLabel}
        size="sm"
        className={cn(entry.hasActiveAlert && "text-primary")}
        onClick={onSetAlert}
      >
        <Bell className={cn("size-4", entry.hasActiveAlert && "fill-current")} />
      </IconButton>
      <IconButton
        aria-label={t(lang, "removeFromWatchlist")}
        size="sm"
        className="hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );
}
