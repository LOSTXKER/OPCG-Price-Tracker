"use client";

import { Bell, Pin, StickyNote } from "lucide-react";

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
  onEdit,
  onSetAlert,
  onRemove,
  removingIds,
}: {
  entries: WatchlistEntry[];
  period: ChangePeriod;
  selected: Set<number>;
  onToggleSelect: (cardId: number) => void;
  onTogglePin: (entry: WatchlistEntry) => void;
  onEdit: (entry: WatchlistEntry) => void;
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

            {/* Top-left: select checkbox */}
            <label
              className={cn(
                "absolute left-2 top-2 z-10 inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm transition-opacity",
                !isSelected && "opacity-0 group-hover/wishitem:opacity-100",
                isSelected && "opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                className="size-3.5 cursor-pointer accent-primary"
                checked={isSelected}
                onChange={() => onToggleSelect(entry.cardId)}
              />
            </label>

            {/* Top-right: pin + actions */}
            <div
              className="absolute right-2 top-2 z-10 flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onTogglePin(entry);
                }}
                title={pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
                aria-label={pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full bg-background/80 shadow-sm backdrop-blur-sm transition-colors hover:bg-background",
                  pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Pin className={cn("size-3.5", pinned && "fill-current")} />
              </button>
              <WatchlistRowActions
                entry={entry}
                onTogglePin={() => onTogglePin(entry)}
                onEdit={() => onEdit(entry)}
                onSetAlert={() => onSetAlert(entry)}
                onRemove={() => onRemove(entry)}
                buttonClassName="size-7 rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background"
              />
            </div>

            {/* Bottom-left badges */}
            <div className="pointer-events-none absolute bottom-12 left-2 z-10 flex flex-col gap-1">
              {entry.hasActiveAlert && (
                <span
                  className="inline-flex size-5 items-center justify-center rounded-full bg-amber-500/90 text-white shadow-sm"
                  title={t(lang, "watchlistHasAlert")}
                >
                  <Bell className="size-3" />
                </span>
              )}
              {entry.note && (
                <span
                  className="inline-flex size-5 items-center justify-center rounded-full bg-popover text-foreground shadow-sm ring-1 ring-border/50"
                  title={entry.note}
                >
                  <StickyNote className="size-3" />
                </span>
              )}
            </div>
          </div>
        );
      })}
    </CardGrid>
  );
}
