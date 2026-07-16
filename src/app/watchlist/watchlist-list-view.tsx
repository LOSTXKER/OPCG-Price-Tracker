"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, MoreHorizontal, Pin, Trash2 } from "lucide-react";

import { GameBadge } from "@/components/shared/game-badge";
import { RarityBadge } from "@/components/shared/rarity-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MiniSparkline } from "@/components/ui/mini-sparkline";
import { PriceTag } from "@/components/ui/price-tag";
import { BLUR_DATA_URL } from "@/lib/constants/ui";
import { DEFAULT_GAME } from "@/lib/game/constants";
import { getCardName, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

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
  sparklines,
  hasAnySparkline,
  onTogglePin,
  onSetAlert,
  onRemove,
  removingIds,
  showGameBadge = false,
  onPeriodSort,
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
  editMode: boolean;
  selected: Set<number>;
  onToggleSelect: (cardId: number) => void;
  sparklines: Record<number, number[]>;
  hasAnySparkline: boolean;
  onTogglePin: (entry: WatchlistEntry) => void;
  onSetAlert: (entry: WatchlistEntry) => void;
  onRemove: (entry: WatchlistEntry) => void;
  removingIds: Set<number>;
  showGameBadge?: boolean;
  /** Desktop 24H/7D/30D column headers act as sort buttons — list view only. */
  onPeriodSort?: (period: ChangePeriod) => void;
}) {
  const lang = useUIStore((s) => s.language);

  if (entries.length === 0) return null;

  return (
    <>
      {/* Mobile list fallback (<sm): the whole primary row opens card detail. */}
      <div className="panel overflow-hidden sm:hidden">
        <div className="divide-y divide-hair">
          {entries.map((entry) => {
            const displayName = getCardName(lang, entry.card);
            const change = getEntryChange(entry, period);
            const removing = removingIds.has(entry.cardId);

            return (
              <div
                key={entry.id}
                className={cn(
                  "ease-chrome flex min-w-0 items-stretch transition-colors",
                  removing && "pointer-events-none opacity-40",
                  editMode
                    ? selected.has(entry.cardId)
                      ? "bg-primary/10"
                      : "hover:bg-muted/60"
                    : "hover:bg-muted/70",
                )}
              >
                {editMode ? (
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-3 select-none">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        className="size-4 cursor-pointer accent-primary"
                        checked={selected.has(entry.cardId)}
                        onChange={() => onToggleSelect(entry.cardId)}
                        aria-label={displayName}
                      />
                    </span>
                    <WatchlistThumbnail entry={entry} displayName={displayName} />
                    <CardIdentity
                      entry={entry}
                      displayName={displayName}
                      showGameBadge={showGameBadge}
                      showStatusIcons
                    />
                    <MobilePrice entry={entry} change={change} />
                  </label>
                ) : (
                  <Link
                    href={`/${entry.card.set.game?.slug ?? DEFAULT_GAME}/cards/${entry.card.cardCode}`}
                    aria-label={displayName}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-sm px-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <WatchlistThumbnail entry={entry} displayName={displayName} />
                    <CardIdentity
                      entry={entry}
                      displayName={displayName}
                      showGameBadge={showGameBadge}
                      showStatusIcons
                    />
                    <MobilePrice entry={entry} change={change} />
                  </Link>
                )}

                {!editMode && (
                  <div className="flex shrink-0 items-center pr-2">
                    <WatchlistActionsMenu
                      entry={entry}
                      onTogglePin={() => onTogglePin(entry)}
                      onSetAlert={() => onSetAlert(entry)}
                      onRemove={() => onRemove(entry)}
                    />
                  </div>
                )}
              </div>
            );
          })}
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
              <th scope="col" className="px-3 py-2.5">
                {t(lang, "card")}
              </th>
              <th scope="col" className="w-28 px-3 py-2.5 text-right">
                {t(lang, "price")}
              </th>
              <th scope="col" className="w-20 px-3 py-2.5 text-right">
                <PeriodSortHeaderButton
                  label="24H"
                  active={period === "24h"}
                  onClick={() => onPeriodSort?.("24h")}
                />
              </th>
              <th scope="col" className="w-20 px-3 py-2.5 text-right">
                <PeriodSortHeaderButton
                  label="7D"
                  active={period === "7d"}
                  onClick={() => onPeriodSort?.("7d")}
                />
              </th>
              <th scope="col" className="hidden w-20 px-3 py-2.5 text-right xl:table-cell">
                <PeriodSortHeaderButton
                  label="30D"
                  active={period === "30d"}
                  onClick={() => onPeriodSort?.("30d")}
                />
              </th>
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

              return (
                <tr
                  key={entry.id}
                  className={cn(
                    "ease-chrome transition-colors",
                    removing && "pointer-events-none opacity-40",
                    editMode
                      ? cn(
                          "cursor-pointer select-none",
                          selected.has(entry.cardId)
                            ? "bg-primary/10"
                            : "hover:bg-muted/60",
                        )
                      : "hover:bg-muted/50",
                  )}
                  onClick={editMode ? () => onToggleSelect(entry.cardId) : undefined}
                >
                  <td className="min-w-0 px-3 py-2">
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
                          href={`/${entry.card.set.game?.slug ?? DEFAULT_GAME}/cards/${entry.card.cardCode}`}
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
                  <td className="w-28 px-3 py-2 text-right">
                    <PriceTag
                      jpy={entry.card.latestPriceJpy}
                      thb={entry.card.latestPriceThb}
                      size="sm"
                      showChange={false}
                      className="flex-nowrap justify-end whitespace-nowrap"
                    />
                  </td>
                  <td className="w-20 px-3 py-2 text-right">
                    <PriceTag
                      change={getEntryChange(entry, "24h")}
                      changeOnly
                      changeStyle="plain"
                      size="sm"
                    />
                  </td>
                  <td className="w-20 px-3 py-2 text-right">
                    <PriceTag
                      change={getEntryChange(entry, "7d")}
                      changeOnly
                      changeStyle="plain"
                      size="sm"
                    />
                  </td>
                  <td className="hidden w-20 px-3 py-2 text-right xl:table-cell">
                    <PriceTag
                      change={getEntryChange(entry, "30d")}
                      changeOnly
                      changeStyle="plain"
                      size="sm"
                    />
                  </td>
                  {hasAnySparkline && (
                    <td className="hidden px-3 py-2 lg:table-cell">
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
                  <td className="w-24 px-2 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <WatchlistStatus entry={entry} />
                      {!editMode && (
                        <WatchlistActionsMenu
                          entry={entry}
                          onTogglePin={() => onTogglePin(entry)}
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
    </>
  );
}

/** 24H/7D/30D desktop column header — click toggles the active sort period. */
function PeriodSortHeaderButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "block w-full text-right text-eyebrow transition-colors",
        active ? "text-foreground font-semibold" : "hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function WatchlistThumbnail({
  entry,
  displayName,
}: {
  entry: WatchlistEntry;
  displayName: string;
}) {
  return (
    <div className="relative aspect-[63/88] h-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-1 ring-hair">
      {entry.card.imageUrl && (
        <Image
          src={entry.card.imageUrl}
          alt={displayName}
          fill
          sizes="46px"
          className="object-cover"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      )}
    </div>
  );
}

function CardIdentity({
  entry,
  displayName,
  showGameBadge,
  showStatusIcons = false,
}: {
  entry: WatchlistEntry;
  displayName: string;
  showGameBadge: boolean;
  /** Mobile rows only — pin/alert live inline here instead of overlapping the artwork. */
  showStatusIcons?: boolean;
}) {
  const lang = useUIStore((s) => s.language);
  const pinned = entry.pinnedAt != null;

  return (
    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 break-words text-body-sm" title={displayName}>
        {displayName}
      </p>
      <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-meta">
        <RarityBadge rarity={entry.card.rarity} size="sm" />
        <span className="truncate font-mono text-muted-foreground">
          {entry.card.cardCode}
        </span>
        {showStatusIcons && pinned && (
          <span
            role="img"
            aria-label={t(lang, "watchlistPinned")}
            title={t(lang, "watchlistPinned")}
            className="inline-flex shrink-0 text-primary"
          >
            <Pin className="size-3 fill-current" aria-hidden />
          </span>
        )}
        {showStatusIcons && entry.hasActiveAlert && (
          <span
            role="img"
            aria-label={t(lang, "watchlistHasAlert")}
            title={t(lang, "watchlistHasAlert")}
            className="inline-flex shrink-0 text-primary"
          >
            <Bell className="size-3 fill-current" aria-hidden />
          </span>
        )}
        {showGameBadge && <GameBadge game={entry.card.set.game} />}
      </div>
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
      <CardIdentity
        entry={entry}
        displayName={displayName}
        showGameBadge={showGameBadge}
      />
    </>
  );
}

function MobilePrice({
  entry,
  change,
}: {
  entry: WatchlistEntry;
  change: number | null;
}) {
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right tabular-nums">
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
        changeStyle="plain"
        size="sm"
      />
    </div>
  );
}

function WatchlistStatus({ entry }: { entry: WatchlistEntry }) {
  const lang = useUIStore((s) => s.language);
  const pinned = entry.pinnedAt != null;

  if (!pinned && !entry.hasActiveAlert) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {pinned && (
        <span
          className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary"
          role="img"
          aria-label={t(lang, "watchlistPinned")}
          title={t(lang, "watchlistPinned")}
        >
          <Pin className="size-3.5 fill-current" aria-hidden />
        </span>
      )}
      {entry.hasActiveAlert && (
        <span
          className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary"
          role="img"
          aria-label={t(lang, "watchlistHasAlert")}
          title={t(lang, "watchlistHasAlert")}
        >
          <Bell className="size-3.5 fill-current" aria-hidden />
        </span>
      )}
    </div>
  );
}

function WatchlistActionsMenu({
  entry,
  onTogglePin,
  onSetAlert,
  onRemove,
}: {
  entry: WatchlistEntry;
  onTogglePin: () => void;
  onSetAlert: () => void;
  onRemove: () => void;
}) {
  const lang = useUIStore((s) => s.language);
  const pinned = entry.pinnedAt != null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t(lang, "moreActions")}
        className="ease-chrome inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-9"
      >
        <MoreHorizontal className="size-5 md:size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="min-h-11 md:min-h-0" onClick={onTogglePin}>
          <Pin className={cn("size-4", pinned && "fill-current text-primary")} />
          {pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11 md:min-h-0" onClick={onSetAlert}>
          <Bell
            className={cn(
              "size-4",
              entry.hasActiveAlert && "fill-current text-primary",
            )}
          />
          {entry.hasActiveAlert
            ? t(lang, "watchlistHasAlert")
            : t(lang, "setPriceAlert")}
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
  );
}
