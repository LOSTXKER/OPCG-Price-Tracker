"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllGameConfigs } from "@/lib/game-config";
import {
  GAME_COOKIE,
  GAME_COOKIE_MAX_AGE,
  isGamePrefix,
  isGameScopedSegment,
} from "@/lib/game/constants";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const GAMES = getAllGameConfigs();

/** Persist the chosen game client-side so middleware redirects un-prefixed URLs
 *  to it. Module-scoped so the cookie write isn't inside component/hook code. */
function persistGameCookie(slug: string) {
  document.cookie = `${GAME_COOKIE}=${slug}; path=/; max-age=${GAME_COOKIE_MAX_AGE}; samesite=lax`;
}

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
  const setMineGameFilter = useUIStore((s) => s.setMineGameFilter);
  const active = GAMES.find((g) => g.slug === currentGame) ?? GAMES[0];
  const router = useRouter();
  const pathname = usePathname();

  // Switch game = stay on the same feature, swap the `/[game]` segment. Persist
  // the cookie so middleware redirects un-prefixed URLs to the chosen game too.
  // Also drive the MINE-page filter so the switcher is never a dead control on
  // the unified personal pages (portfolio/watchlist/alerts).
  const switchGame = (slug: string) => {
    setCurrentGame(slug);
    setMineGameFilter(slug);
    persistGameCookie(slug);
    const segs = pathname.split("/").filter(Boolean);
    if (isGamePrefix(segs[0])) {
      segs[0] = slug;
      router.push("/" + segs.join("/"));
    } else if (isGameScopedSegment(segs[0])) {
      router.push(`/${slug}${pathname}`);
    }
    // On a non-namespaced page (settings, profile, …) just persist the choice;
    // the next browse navigation picks it up.
  };

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
                if (!disabled) switchGame(g.slug);
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
