"use client";

import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllGameConfigs } from "@/lib/game-config";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const GAMES = getAllGameConfigs();

/**
 * Game-switcher pill (REDESIGN.md §3.3). Shows the active game; opens a menu of
 * registered games. `comingSoon` games (Pokémon for now) render disabled, so the
 * slot is reserved and Pokémon becomes a real toggle the day its data lands —
 * no nav rebuild. `currentGame` lives in ui-store (persisted).
 */
export function GameSwitcher({ className }: { className?: string }) {
  const lang = useUIStore((s) => s.language);
  const currentGame = useUIStore((s) => s.currentGame);
  const setCurrentGame = useUIStore((s) => s.setCurrentGame);
  const active = GAMES.find((g) => g.slug === currentGame) ?? GAMES[0];

  // Single registered game → nothing to switch; render a static badge.
  if (GAMES.length < 2) {
    return (
      <span
        className={cn(
          "surface-2 hairline inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground",
          className,
        )}
      >
        <span className="size-2 rounded-full" style={{ background: "var(--primary)" }} aria-hidden />
        {active.shortName ?? active.slug.toUpperCase()}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t(lang, "chooseGame")}
        className={cn(
          "ease-chrome surface-2 ring-inset inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-[var(--p-hair)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          className,
        )}
      >
        <span className="size-2 rounded-full" style={{ background: "var(--primary)" }} aria-hidden />
        {active.shortName ?? active.slug.toUpperCase()}
        <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-[220px]">
        <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/70">
          {t(lang, "chooseGame")}
        </p>
        {GAMES.map((g) => {
          const isActive = g.slug === currentGame;
          const disabled = Boolean(g.comingSoon);
          return (
            <DropdownMenuItem
              key={g.slug}
              disabled={disabled}
              onClick={() => {
                if (!disabled) setCurrentGame(g.slug);
              }}
              className={cn("flex items-center gap-2", isActive && "font-semibold text-foreground")}
            >
              <span className="flex-1">{g.nameEn}</span>
              {isActive && <Check className="size-4 text-primary" aria-hidden />}
              {disabled && (
                <span className="text-micro text-muted-foreground">{t(lang, "comingSoon")}</span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
