"use client";

import { Bell, MoreVertical, Pencil, Pin, PinOff, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "@/lib/i18n";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

import type { WatchlistEntry } from "./watchlist-types";

export function WatchlistRowActions({
  entry,
  onTogglePin,
  onEdit,
  onSetAlert,
  onRemove,
  className,
  buttonClassName,
}: {
  entry: WatchlistEntry;
  onTogglePin: () => void;
  onEdit: () => void;
  onSetAlert: () => void;
  onRemove: () => void;
  className?: string;
  buttonClassName?: string;
}) {
  const lang = useUIStore((s) => s.language);
  const pinned = entry.pinnedAt != null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          buttonClassName
        )}
        aria-label={t(lang, "watchlistEditDetails")}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <MoreVertical className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className={className}>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onTogglePin();
          }}
        >
          {pinned ? (
            <>
              <PinOff className="size-4" />
              {t(lang, "watchlistUnpin")}
            </>
          ) : (
            <>
              <Pin className="size-4" />
              {t(lang, "watchlistPin")}
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="size-4" />
          {entry.note || entry.targetPriceJpy != null
            ? t(lang, "watchlistEditNote")
            : t(lang, "watchlistAddNote")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSetAlert();
          }}
        >
          <Bell className="size-4" />
          {t(lang, "setPriceAlert")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="size-4" />
          {t(lang, "removeFromWatchlist")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
