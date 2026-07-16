"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { PriceAlertItem } from "@/components/alerts/alert-types";
import { GameCrest } from "@/components/shared/game-crest";
import { getGameConfig } from "@/lib/game-config";
import { DEFAULT_GAME } from "@/lib/game/constants";
import type { GameRef } from "@/lib/types/portfolio";
import { cn } from "@/lib/utils";

export type AlertGroup = { slug: string; game: GameRef | null; alerts: PriceAlertItem[] };

/** Group alerts by owning game (via card.set.game, default-game fallback),
 *  sorted by descending count. Used only when the list spans ≥2 games and the
 *  filter is on "all" — a single-game or scoped list stays flat. */
export function groupAlertsByGame(alerts: PriceAlertItem[]): AlertGroup[] {
  const map = new Map<string, AlertGroup>();
  for (const a of alerts) {
    const game = a.card.set?.game ?? null;
    const slug = game?.slug ?? DEFAULT_GAME;
    let g = map.get(slug);
    if (!g) {
      g = { slug, game, alerts: [] };
      map.set(slug, g);
    } else if (!g.game && game) {
      g.game = game;
    }
    g.alerts.push(a);
  }
  return [...map.values()].sort((a, b) => b.alerts.length - a.alerts.length);
}

export function AlertGameGroup({
  group,
  defaultOpen = true,
  children,
}: {
  group: AlertGroup;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const name =
    getGameConfig(group.slug)?.shortName ?? group.game?.nameEn ?? group.slug.toUpperCase();
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-11 w-full items-center gap-2 rounded-lg px-1 py-1 text-left ease-chrome transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-auto"
      >
        <GameCrest game={group.game} size={18} />
        <span className="text-body-sm font-semibold">{name}</span>
        <span className="text-meta tabular-nums text-muted-foreground">
          {group.alerts.length}
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "ml-auto size-4 text-muted-foreground/60 transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  );
}
