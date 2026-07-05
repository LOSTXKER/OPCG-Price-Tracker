"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Pin } from "lucide-react";

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
  hasAnySparkline,
  onTogglePin,
  onSetAlert,
  onRemove,
  removingIds,
  showGameBadge = false,
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
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
      {entries.length > 1 && (
        <div className="flex items-center gap-3 border-b border-[var(--p-hair)] bg-muted/20 px-3 py-2 text-meta">
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
              : `${entries.length} ${t(lang, "watchlistSummaryCards").toLowerCase()}`}
          </span>
        </div>
      )}

      <div className="divide-y divide-[var(--p-hair)]">
        {entries.map((entry) => (
          <ListRow
            key={entry.id}
            entry={entry}
            period={period}
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

function ListRow({
  entry,
  period,
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

  return (
    <div
      className={cn(
        "group/row ease-chrome flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/70",
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

      <button
        type="button"
        onClick={onTogglePin}
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-lg ease-chrome transition-colors hover:bg-muted",
          pinned
            ? "text-primary"
            : "text-muted-foreground/40 hover:text-foreground"
        )}
        aria-label={pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
        title={pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
      >
        <Pin className={cn("size-3.5", pinned && "fill-current")} />
      </button>

      {entry.card.imageUrl ? (
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
          className="relative aspect-[63/88] h-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-[var(--p-hair)]"
        >
          <Image
            src={entry.card.imageUrl}
            alt={displayName}
            fill
            sizes="46px"
            className="object-cover"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
          />
        </CardImageButton>
      ) : (
        <div className="relative aspect-[63/88] h-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-[var(--p-hair)]" />
      )}

      <Link
        href={`/cards/${entry.card.cardCode}`}
        className="flex min-w-0 flex-1 items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={displayName}>
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
      </Link>

      {showSparklineSlot && (
        <div className="hidden w-[120px] shrink-0 xl:block">
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

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onSetAlert}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-lg ease-chrome transition-colors",
            entry.hasActiveAlert
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground/40 hover:bg-muted hover:text-foreground"
          )}
          aria-label={
            entry.hasActiveAlert
              ? t(lang, "watchlistHasAlert")
              : t(lang, "setPriceAlert")
          }
          title={
            entry.hasActiveAlert
              ? t(lang, "watchlistHasAlert")
              : t(lang, "setPriceAlert")
          }
        >
          <Bell
            className={cn("size-4", entry.hasActiveAlert && "fill-current")}
          />
        </button>
        <WatchlistRowActions entry={entry} onRemove={onRemove} />
      </div>
    </div>
  );
}
