"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, MoreHorizontal, Pin, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CardImageButton } from "@/components/shared/card-image-button";
import { GameBadge } from "@/components/shared/game-badge";
import { MiniSparkline } from "@/components/ui/mini-sparkline";
import { PriceTag } from "@/components/ui/price-tag";
import { RarityBadge } from "@/components/shared/rarity-badge";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { changeToneClass, formatSignedPct } from "@/lib/utils/currency";

import {
  type ChangePeriod,
  type WatchlistEntry,
  getEntryChange,
} from "./watchlist-types";

export function WatchlistListView({
  entries,
  period,
  editMode,
  selected,
  onToggleSelect,
  onToggleAll,
  sparklines,
  hasAnySparkline,
  onTogglePin,
  onSetAlert,
  onRemove,
  removingIds,
  showGameBadge = false,
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
  editMode: boolean;
  selected: Set<number>;
  onToggleSelect: (cardId: number) => void;
  onToggleAll: () => void;
  sparklines: Record<number, number[]>;
  hasAnySparkline: boolean;
  onTogglePin: (entry: WatchlistEntry) => void;
  onSetAlert: (entry: WatchlistEntry) => void;
  onRemove: (entry: WatchlistEntry) => void;
  removingIds: Set<number>;
  showGameBadge?: boolean;
}) {
  const lang = useUIStore((s) => s.language);
  const allSelected = entries.length > 0 && entries.every((e) => selected.has(e.cardId));
  const someSelected = !allSelected && entries.some((e) => selected.has(e.cardId));

  if (entries.length === 0) return null;

  return (
    <div className="panel overflow-hidden">
      {/* Select-all header — only in edit mode */}
      {editMode && entries.length > 1 && (
        <div className="flex items-center gap-3 border-b border-hair bg-muted/20 px-3 py-2 text-meta">
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
          <span className="text-muted-foreground">
            {allSelected || someSelected
              ? `${selected.size} / ${entries.length}`
              : t(lang, "watchlistSelectAll")}
          </span>
        </div>
      )}

      <div className="divide-y divide-hair">
        {entries.map((entry) => (
          <WatchlistRow
            key={entry.id}
            entry={entry}
            period={period}
            editMode={editMode}
            selected={selected.has(entry.cardId)}
            onToggleSelect={() => onToggleSelect(entry.cardId)}
            sparklineData={sparklines[entry.cardId]}
            showSparklineSlot={hasAnySparkline}
            onTogglePin={() => onTogglePin(entry)}
            onSetAlert={() => onSetAlert(entry)}
            onRemove={() => onRemove(entry)}
            removing={removingIds.has(entry.cardId)}
            showGameBadge={showGameBadge}
          />
        ))}
      </div>
    </div>
  );
}

// Local, bespoke row — NOT the `ui/list-row` primitive. Watchlist rows carry
// per-row state indicators (pin, alert) + an overflow menu, plus an edit-mode
// select affordance the single-Link `ListRow` primitive can't express.
function WatchlistRow({
  entry,
  period,
  editMode,
  selected,
  onToggleSelect,
  sparklineData,
  showSparklineSlot,
  onTogglePin,
  onSetAlert,
  onRemove,
  removing,
  showGameBadge,
}: {
  entry: WatchlistEntry;
  period: ChangePeriod;
  editMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  sparklineData?: number[];
  showSparklineSlot: boolean;
  onTogglePin: () => void;
  onSetAlert: () => void;
  onRemove: () => void;
  removing: boolean;
  showGameBadge: boolean;
}) {
  const lang = useUIStore((s) => s.language);
  const change = getEntryChange(entry, period);
  const displayName = getCardName(lang, entry.card);
  const pinned = entry.pinnedAt != null;

  const imageEl = entry.card.imageUrl ? (
    <Image
      src={entry.card.imageUrl}
      alt={displayName}
      fill
      sizes="46px"
      className="object-cover"
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
    />
  ) : null;

  const thumbClass =
    "relative block aspect-[63/88] h-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-hair";

  const nameBlock = (
    <div className="min-w-0 flex-1">
      <p
        className="line-clamp-2 break-words text-sm font-medium sm:truncate"
        title={displayName}
      >
        {displayName}
      </p>
      <div className="mt-0.5 flex items-center gap-1.5 text-meta">
        <RarityBadge rarity={entry.card.rarity} size="sm" />
        <span className="truncate font-mono text-muted-foreground">
          {entry.card.cardCode}
        </span>
        {showGameBadge && <GameBadge game={entry.card.set.game} />}
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "group/row ease-chrome flex items-center gap-3 px-3 py-3 transition-colors",
        removing && "opacity-40",
        editMode
          ? cn("cursor-pointer select-none", selected ? "bg-primary/10" : "hover:bg-muted/60")
          : "hover:bg-muted/70"
      )}
      onClick={editMode ? onToggleSelect : undefined}
    >
      {editMode && (
        <input
          type="checkbox"
          className="size-4 shrink-0 cursor-pointer accent-primary"
          checked={selected}
          onChange={onToggleSelect}
          onClick={(e) => e.stopPropagation()}
          aria-label={displayName}
        />
      )}

      {/* Thumbnail + quiet state indicators (pin top-left, alert top-right) */}
      <div className="relative shrink-0">
        {editMode ? (
          <div className={thumbClass}>{imageEl}</div>
        ) : entry.card.imageUrl ? (
          <CardImageButton
            card={{
              cardCode: entry.card.cardCode,
              cardId: entry.cardId,
              nameJp: entry.card.nameJp,
              nameEn: entry.card.nameEn,
              nameTh: entry.card.nameTh,
              rarity: entry.card.rarity,
              imageUrl: entry.card.imageUrl,
              setCode: entry.card.set.code,
              priceJpy: entry.card.latestPriceJpy,
              priceThb: entry.card.latestPriceThb,
              priceChange24h: entry.card.priceChange24h,
              priceChange7d: entry.card.priceChange7d,
              priceChange30d: entry.card.priceChange30d,
            }}
            className={thumbClass}
          >
            {imageEl}
          </CardImageButton>
        ) : (
          <div className={thumbClass} />
        )}

        {pinned && (
          <span
            className="pointer-events-none absolute left-0.5 top-0.5 z-10 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background"
            title={t(lang, "watchlistPinned")}
            aria-hidden
          >
            <Pin className="size-2.5 fill-current" />
          </span>
        )}
        {entry.hasActiveAlert && (
          <span
            className="pointer-events-none absolute right-0.5 top-0.5 z-10 inline-flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background"
            title={t(lang, "watchlistHasAlert")}
            aria-hidden
          >
            <Bell className="size-2.5 fill-current" />
          </span>
        )}
      </div>

      {/* Name — links to detail in normal mode, plain in edit mode */}
      {editMode ? (
        nameBlock
      ) : (
        <Link
          href={`/opcg/cards/${entry.card.cardCode}`}
          className="flex min-w-0 flex-1 items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {nameBlock}
        </Link>
      )}

      {showSparklineSlot && (
        <div className="hidden w-[120px] shrink-0 lg:block">
          {sparklineData && sparklineData.length >= 2 ? (
            <MiniSparkline data={sparklineData} width={120} height={28} />
          ) : null}
        </div>
      )}

      <div className="flex shrink-0 flex-col items-end gap-0.5 text-right leading-tight tabular-nums">
        <PriceTag
          jpy={entry.card.latestPriceJpy}
          thb={entry.card.latestPriceThb}
          size="sm"
          showChange={false}
          className="flex-nowrap whitespace-nowrap"
        />
        <span className={cn("text-xs", changeToneClass(change))}>
          {formatSignedPct(change)}
        </span>
      </div>

      {/* Single overflow menu — pin / alert / remove (normal mode only) */}
      {!editMode && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={t(lang, "moreActions")}
            className="ease-chrome inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-9"
          >
            <MoreHorizontal className="size-5 sm:size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onTogglePin}>
              <Pin className={cn("size-4", pinned && "fill-current text-primary")} />
              {pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSetAlert}>
              <Bell
                className={cn(
                  "size-4",
                  entry.hasActiveAlert && "fill-current text-primary"
                )}
              />
              {entry.hasActiveAlert
                ? t(lang, "watchlistHasAlert")
                : t(lang, "setPriceAlert")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 className="size-4" />
              {t(lang, "removeFromWatchlist")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
