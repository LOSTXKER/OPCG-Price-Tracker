"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Info } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getAllGameConfigs,
  getGameAccentTint,
  hasMultipleActiveGames,
  isGameLaunchReady,
  type GameConfig,
} from "@/lib/game-config";
import {
  GAME_AGNOSTIC_FEATURES,
  GAME_COOKIE,
  GAME_COOKIE_MAX_AGE,
  isGamePrefix,
  isGameScopedSegment,
} from "@/lib/game/constants";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const GAMES = getAllGameConfigs();

/** @internal Pure state builder for launch-gate regression coverage. */
export function getGameSwitcherState(
  currentGame: string,
  games: readonly GameConfig[] = GAMES,
) {
  const launchReadyGames = games.filter(isGameLaunchReady);
  const active =
    launchReadyGames.find((game) => game.slug === currentGame) ??
    launchReadyGames[0] ??
    games[0];

  return {
    active,
    options: games.map((game) => ({
      game,
      isActive: game.slug === active?.slug,
      launchReady: isGameLaunchReady(game),
    })),
  };
}

/** Persist the chosen game client-side so middleware redirects un-prefixed URLs
 *  to it. Module-scoped so the cookie write isn't inside component/hook code. */
function persistGameCookie(slug: string) {
  document.cookie = `${GAME_COOKIE}=${slug}; path=/; max-age=${GAME_COOKIE_MAX_AGE}; samesite=lax`;
}

/**
 * Canonical catalog switcher. Registered roadmap games remain visible here as
 * coming-soon entries, while only launch-ready games may change the active
 * catalog, cookie or URL. In-page MINE filters remain data-driven and separate.
 */
export function GameSwitcher({ className }: { className?: string }) {
  if (GAMES.length === 0) return null;
  return <ActiveGameSwitcher className={className} />;
}

function ActiveGameSwitcher({ className }: { className?: string }) {
  const lang = useUIStore((s) => s.language);
  const currentGame = useUIStore((s) => s.currentGame);
  const setCurrentGame = useUIStore((s) => s.setCurrentGame);
  const { active, options } = getGameSwitcherState(currentGame);
  const router = useRouter();
  const pathname = usePathname();
  const dismissedHint = useUIStore((s) => s.dismissedSwitcherHint);
  const dismissHint = useUIStore((s) => s.dismissSwitcherHint);
  // On a MINE route the pill does nothing to the list. Once multiple catalogs
  // are genuinely live, surface a one-time hint toward the in-page filter.
  const seg0 = pathname.split("/").filter(Boolean)[0] ?? "";
  const isMineRoute = GAME_AGNOSTIC_FEATURES.has(seg0);
  const activeTint = getGameAccentTint(active!.slug);

  // Switch game = stay on the same feature, swap the `/[game]` segment. Persist
  // the cookie so middleware redirects un-prefixed URLs to the chosen game too.
  // This control has ONE job — pick which game's catalog you're browsing. It
  // does NOT touch the MINE pages (portfolio/watchlist/alerts): those are one
  // unified list and filter themselves via their own in-page chips, so the
  // header pill never silently means "filter" on one page and "navigate" on
  // another.
  const switchGame = (slug: string) => {
    setCurrentGame(slug);
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

  // A blocked/roadmap game has no public catalog yet. Show the roadmap page
  // without mutating the current game, cookie or namespace.
  const goComingSoon = (slug: string) => {
    router.push(`/coming-soon?game=${slug}`);
  };

  if (GAMES.length < 2) {
    return (
      <span
        className={cn(
          "surface-2 hairline inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground lg:min-h-0",
          className,
        )}
      >
        <span className="size-2 rounded-full" style={{ background: activeTint }} aria-hidden />
        {active!.shortName ?? active!.slug.toUpperCase()}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t(lang, "chooseGame")}
        className={cn(
          "ease-chrome surface-2 ring-inset inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-hair focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 lg:min-h-0",
          className,
        )}
      >
        <span className="size-2 rounded-full" style={{ background: activeTint }} aria-hidden />
        {active!.shortName ?? active!.slug.toUpperCase()}
        <ChevronDown className="size-3 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-[220px]">
        {/* Navigate-framed eyebrow — this control browses the catalog; it never
            filters the MINE lists (that's the in-page chips). */}
        <p className="px-2 py-1.5 text-eyebrow text-muted-foreground/70">
          {t(lang, "browseCatalog")}
        </p>
        {options.map(({ game, isActive, launchReady }) => {
          return (
            <DropdownMenuItem
              key={game.slug}
              onClick={() => (launchReady ? switchGame(game.slug) : goComingSoon(game.slug))}
              className={cn("flex items-center gap-2", isActive && "font-semibold text-foreground")}
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{
                  background: `color-mix(in srgb, ${getGameAccentTint(game.slug)} 70%, transparent)`,
                }}
              />
              <span className="flex-1">{game.nameEn}</span>
              {isActive && <Check className="size-4 text-primary" aria-hidden />}
              {!launchReady && (
                <span className="text-micro text-muted-foreground">{t(lang, "comingSoon")}</span>
              )}
            </DropdownMenuItem>
          );
        })}
        {isMineRoute && hasMultipleActiveGames() && !dismissedHint && (
          <button
            type="button"
            onClick={dismissHint}
            className="mt-1 flex w-full items-center gap-1.5 border-t border-hair px-2 pb-1 pt-2 text-left text-micro text-muted-foreground/80 ease-chrome transition-colors hover:text-foreground"
          >
            <Info className="size-3 shrink-0" aria-hidden />
            {t(lang, "switcherMineHint")}
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
