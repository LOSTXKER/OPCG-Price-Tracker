"use client";

import { ArrowUpRight, Bell, Check, MoreHorizontal, Pin, Trash2 } from "lucide-react";
import Link from "next/link";

import { CardItem } from "@/components/cards/card-item";
import { CardGrid } from "@/components/cards/card-grid";
import { CompareButton } from "@/components/compare/compare-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GameBadge } from "@/components/shared/game-badge";
import { getCardName, t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import type { ChangePeriod, WatchlistEntry } from "./watchlist-types";

export function WatchlistGridView({
  entries,
  period,
  editMode,
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
  editMode: boolean;
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
              isRemoving && "opacity-40",
              editMode && isSelected && "rounded-xl ring-2 ring-primary"
            )}
          >
            {/* Edit mode — full-card select overlay above CardItem's link/action layers */}
            {editMode && (
              <button
                type="button"
                onClick={() => onToggleSelect(entry.cardId)}
                aria-label={displayName}
                aria-pressed={isSelected}
                className="absolute inset-0 z-30 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "absolute left-2 top-2 inline-flex size-6 items-center justify-center rounded-md border-2 bg-background/90 motion-base",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40"
                  )}
                >
                  {isSelected && <Check className="size-4" />}
                </span>
              </button>
            )}

            {/* State indicators (normal mode): game (left) + pin/alert stack (right) */}
            {!editMode && showGameBadge && (
              <div className="pointer-events-none absolute left-2 top-2 z-10">
                <GameBadge game={entry.card.set.game} />
              </div>
            )}
            {!editMode && (pinned || entry.hasActiveAlert) && (
              <div className="pointer-events-none absolute right-2 top-2 z-10 flex flex-col gap-1">
                {pinned && (
                  <span
                    className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-1 ring-primary/20"
                    title={t(lang, "watchlistPinned")}
                    aria-hidden
                  >
                    <Pin className="size-3 fill-current" />
                  </span>
                )}
                {entry.hasActiveAlert && (
                  <span
                    className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-1 ring-primary/20"
                    title={t(lang, "watchlistHasAlert")}
                    aria-hidden
                  >
                    <Bell className="size-3 fill-current" />
                  </span>
                )}
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
                editMode ? null : (
                  <div
                    className="relative z-20 flex items-center gap-1.5 border-t border-hair p-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CompareButton
                      item={{
                        cardCode: entry.card.cardCode,
                        name: displayName,
                        imageUrl: entry.card.imageUrl ?? null,
                        rarity: entry.card.rarity,
                      }}
                      size="sm"
                      variant="chip"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={t(lang, "moreActions")}
                        className="ease-chrome inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-transparent bg-muted/30 text-muted-foreground transition-colors hover:border-hair hover:bg-muted/70 hover:text-primary dark:border-hair sm:size-9"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onTogglePin(entry)}>
                          <Pin
                            className={cn(
                              "size-4",
                              pinned && "fill-current text-primary"
                            )}
                          />
                          {pinned ? t(lang, "watchlistUnpin") : t(lang, "watchlistPin")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSetAlert(entry)}>
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
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onRemove(entry)}
                        >
                          <Trash2 className="size-4" />
                          {t(lang, "removeFromWatchlist")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {/* detail link fills the row like the home/search action row */}
                    <Link
                      href={`/opcg/cards/${entry.card.cardCode}`}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={t(lang, "viewDetails")}
                      className="ml-auto inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground motion-base hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] sm:min-h-9"
                    >
                      <span className="truncate">{t(lang, "viewDetails")}</span>
                      <ArrowUpRight className="size-3.5 shrink-0" />
                    </Link>
                  </div>
                )
              }
            />
          </div>
        );
      })}
    </CardGrid>
  );
}
