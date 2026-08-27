"use client";

import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Info } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GameCrest } from "@/components/shared/game-crest";
import {
  getAllGameConfigs,
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
type GameSwitcherProps = {
  className?: string;
  /** Route-derived catalog scope when the switcher is embedded in global chrome. */
  game?: string;
  /** Removes the standalone pill surface when embedded in a compound control. */
  appearance?: "standalone" | "context";
  /** Keeps the 44px pill but shows only its crest below 360px. */
  compactOnNarrow?: boolean;
  /**
   * Desktop ladder: crest only until `lg`. The header's primary row carries the
   * game pill AND the set control now, and at `md` the two labels together push
   * the row past the viewport — the crest still says which game, so the word is
   * what yields first.
   */
  compactBelowLg?: boolean;
};

export function GameSwitcher({
  className,
  game,
  appearance = "standalone",
  compactOnNarrow = false,
  compactBelowLg = false,
}: GameSwitcherProps) {
  if (GAMES.length === 0) return null;
  return (
    <ActiveGameSwitcher
      className={className}
      game={game}
      appearance={appearance}
      compactOnNarrow={compactOnNarrow}
      compactBelowLg={compactBelowLg}
    />
  );
}

function ActiveGameSwitcher({
  className,
  game,
  appearance,
  compactOnNarrow,
  compactBelowLg,
}: Required<Pick<GameSwitcherProps, "appearance" | "compactOnNarrow" | "compactBelowLg">> &
  Pick<GameSwitcherProps, "className" | "game">) {
  const lang = useUIStore((s) => s.language);
  const storedGame = useUIStore((s) => s.currentGame);
  const setCurrentGame = useUIStore((s) => s.setCurrentGame);
  const { active, options } = getGameSwitcherState(game ?? storedGame);
  const router = useRouter();
  const pathname = usePathname();
  const dismissedHint = useUIStore((s) => s.dismissedSwitcherHint);
  const dismissHint = useUIStore((s) => s.dismissSwitcherHint);
  // On a MINE route the pill does nothing to the list. Once multiple catalogs
  // are genuinely live, surface a one-time hint toward the in-page filter.
  const seg0 = pathname.split("/").filter(Boolean)[0] ?? "";
  const isMineRoute = GAME_AGNOSTIC_FEATURES.has(seg0);
  const activeLabel = active!.nameEn ?? active!.name;
  const activeShortLabel = active!.shortName ?? active!.slug.toUpperCase();

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
          "inline-flex min-h-11 shrink-0 items-center text-xs font-semibold text-foreground",
          compactOnNarrow
            ? "size-11 justify-center gap-0 px-0 min-[360px]:w-auto min-[360px]:gap-1.5 min-[360px]:px-3 min-[360px]:py-1.5"
            : compactBelowLg
              ? "gap-0 px-2 py-1.5 lg:gap-1.5 lg:px-3"
              : "gap-1.5 px-3 py-1.5",
          appearance === "standalone" &&
            "surface-2 hairline rounded-full lg:min-h-0",
          className,
        )}
      >
        <GameCrest game={active!} size={20} variant="selector" decorative />
        <span
          className={cn(
            compactOnNarrow && "hidden min-[360px]:inline",
            compactBelowLg && "hidden lg:inline",
          )}
        >
          {activeShortLabel}
        </span>
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${t(lang, "chooseGame")}: ${activeLabel}`}
        className={cn(
          "ease-chrome ring-inset inline-flex min-h-11 shrink-0 items-center text-xs font-semibold text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          compactOnNarrow
            ? "size-11 justify-center gap-0 px-0 min-[360px]:w-auto min-[360px]:gap-1.5 min-[360px]:px-3 min-[360px]:py-1.5"
            : compactBelowLg
              ? "gap-0 px-2 py-1.5 lg:gap-1.5 lg:px-3"
              : "gap-1.5 px-3 py-1.5",
          appearance === "standalone"
            ? "surface-2 rounded-full ring-1 ring-hair lg:min-h-0"
            : "rounded-lg transition-colors hover:bg-muted/70",
          className,
        )}
      >
        <GameCrest game={active!} size={20} variant="selector" decorative />
        <span
          className={cn(
            compactOnNarrow && "hidden min-[360px]:inline",
            compactBelowLg && "hidden lg:inline",
          )}
        >
          {activeShortLabel}
        </span>
        <ChevronDown
          className={cn(
            "size-3 text-muted-foreground",
            compactOnNarrow && "hidden min-[360px]:block",
            compactBelowLg && "hidden lg:block",
          )}
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-[248px]">
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
              <GameCrest game={game} size={22} variant="selector" decorative />
              <span className="flex-1 whitespace-nowrap">{game.nameEn}</span>
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
