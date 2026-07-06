"use client";

import Link from "next/link";
import { Bell, ExternalLink, Pin } from "lucide-react";

import { CardItem } from "@/components/cards/card-item";
import { CardGrid } from "@/components/cards/card-grid";
import { CompareButton } from "@/components/compare/compare-button";
import { GameBadge } from "@/components/shared/game-badge";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import { WatchlistRowActions } from "./watchlist-row-actions";
import type { ChangePeriod, WatchlistEntry } from "./watchlist-types";

export function WatchlistGridView({
  entries,
  period,
  selected,
  onToggleSelect,
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
  onTogglePin: (entry: WatchlistEntry) => void;
  onSetAlert: (entry: WatchlistEntry) => void;
  onRemove: (entry: WatchlistEntry) => void;
  removingIds: Set<number>;
  showGameBadge?: boolean;
}) {
  const lang = useUIStore((s) => s.language);

  if (entries.length === 0) return null;

  return (
    <CardGrid>
      {entries.map((entry) => {
        const pinned = entry.pinnedAt != null;
        const isSelected = selected.has(entry.cardId);
        const isRemoving = removingIds.has(entry.cardId);
        const displayName = getCardName(lang, entry.card);

        return (
          <div
            key={entry.id}
            className={cn(
              "group/wishitem relative motion-base",
              isRemoving && "opacity-40"
            )}
          >
            {pinned && (
              <div
                className="pointer-events-none absolute right-2 top-2 z-10 inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-1 ring-primary/20"
                title={t(lang, "watchlistPinned")}
                aria-hidden
              >
                <Pin className="size-3 fill-current" />
              </div>
            )}
            {showGameBadge && (
              <div className="pointer-events-none absolute left-2 top-2 z-10">
                <GameBadge game={entry.card.set.game} />
              </div>
            )}
            <CardItem
              cardCode={entry.card.cardCode}
              cardId={entry.cardId}
              nameJp={entry.card.nameJp}
              nameEn={entry.card.nameEn}
              nameTh={entry.card.nameTh}
              rarity={entry.card.rarity}
              imageUrl={entry.card.imageUrl}
              priceJpy={entry.card.latestPriceJpy}
              priceThb={entry.card.latestPriceThb}
              priceChange24h={entry.card.priceChange24h}
              priceChange7d={entry.card.priceChange7d}
              priceChange30d={entry.card.priceChange30d}
              changePeriod={period}
              setCode={entry.card.set.code}
              actionRow={
                <div
                  className="flex items-center justify-between gap-1 border-t border-[var(--p-hair)] px-2 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-0.5">
                    <label
                      className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg ease-chrome transition-colors hover:bg-muted"
                      title={t(lang, "selectAll")}
                    >
                      <input
                        type="checkbox"
                        className="size-3.5 cursor-pointer accent-primary"
                        checked={isSelected}
                        onChange={() => onToggleSelect(entry.cardId)}
                        aria-label={displayName}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onSetAlert(entry);
                      }}
                      title={
                        entry.hasActiveAlert
                          ? t(lang, "watchlistHasAlert")
                          : t(lang, "setPriceAlert")
                      }
                      aria-label={
                        entry.hasActiveAlert
                          ? t(lang, "watchlistHasAlert")
                          : t(lang, "setPriceAlert")
                      }
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-lg ease-chrome transition-colors hover:bg-muted",
                        entry.hasActiveAlert
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Bell
                        className={cn(
                          "size-3.5",
                          entry.hasActiveAlert && "fill-current"
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onTogglePin(entry);
                      }}
                      title={
                        pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")
                      }
                      aria-label={
                        pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")
                      }
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-lg ease-chrome transition-colors hover:bg-muted",
                        pinned
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Pin className={cn("size-3.5", pinned && "fill-current")} />
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <CompareButton
                      item={{
                        cardCode: entry.card.cardCode,
                        name: displayName,
                        imageUrl: entry.card.imageUrl ?? null,
                        rarity: entry.card.rarity,
                      }}
                      size="sm"
                    />
                    <Link
                      href={`/cards/${entry.card.cardCode}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={t(lang, "viewDetails")}
                      title={t(lang, "viewDetails")}
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground ease-chrome transition-colors hover:bg-muted hover:text-primary"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                    <WatchlistRowActions
                      entry={entry}
                      onRemove={() => onRemove(entry)}
                      size="sm"
                    />
                  </div>
                </div>
              }
            />
          </div>
        );
      })}
    </CardGrid>
  );
}
