"use client";

import { Bell, Pin } from "lucide-react";

import { CardItem } from "@/components/cards/card-item";
import { CardGrid } from "@/components/cards/card-grid";
import { t } from "@/lib/i18n";
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
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
  selected: Set<number>;
  onToggleSelect: (cardId: number) => void;
  onTogglePin: (entry: WatchlistEntry) => void;
  onSetAlert: (entry: WatchlistEntry) => void;
  onRemove: (entry: WatchlistEntry) => void;
  removingIds: Set<number>;
}) {
  const lang = useUIStore((s) => s.language);

  if (entries.length === 0) return null;

  return (
    <CardGrid>
      {entries.map((entry) => {
        const pinned = entry.pinnedAt != null;
        const isSelected = selected.has(entry.cardId);
        const isRemoving = removingIds.has(entry.cardId);

        return (
          <div
            key={entry.id}
            className={cn(
              "group/wishitem relative transition-all",
              pinned && "ring-2 ring-primary/40 rounded-xl",
              isRemoving && "opacity-40"
            )}
          >
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
            />

            {/* Selection toolbar — sits below the card, never overlays the art */}
            <div
              className="mt-1.5 flex items-center justify-between gap-1 px-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-0.5">
                <label
                  className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-muted"
                  title={t(lang, "selectAll")}
                >
                  <input
                    type="checkbox"
                    className="size-3.5 cursor-pointer accent-primary"
                    checked={isSelected}
                    onChange={() => onToggleSelect(entry.cardId)}
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
                    "inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted",
                    entry.hasActiveAlert
                      ? "text-amber-500"
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
                  title={pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
                  aria-label={pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-muted",
                    pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Pin className={cn("size-3.5", pinned && "fill-current")} />
                </button>
              </div>
              <WatchlistRowActions entry={entry} onRemove={() => onRemove(entry)} size="sm" />
            </div>
          </div>
        );
      })}
    </CardGrid>
  );
}
