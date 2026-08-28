"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { useScrolled } from "@/hooks/use-scrolled";
import {
  Briefcase,
  Crown,
  Heart,
} from "lucide-react";
import {
  CommandSearchModal,
  CommandSearchTrigger,
} from "@/components/shared/command-search";
import { resolveHeaderGame } from "@/components/layout/header-catalog-control";
import { HeaderGuestPreferencesMenu } from "@/components/layout/header-preferences-menu";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils/currency";
import { t } from "@/lib/i18n";
import { useHeaderData } from "@/hooks/use-header-data";
import { useHeaderSets } from "@/hooks/use-header-sets";
import { usePublicConfig } from "@/hooks/use-public-config";
import { isNavActive } from "@/lib/game/constants";
import { NAV_LINKS, MARKETPLACE_LINK } from "./header-constants";
import { HeaderMarketTicker } from "./header-market-ticker";
import { HeaderUserMenu } from "./header-user-menu";
import { HeaderMobile } from "./header-mobile";

export function Header() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const language = useUIStore((s) => s.language);
  const currentGame = useUIStore((s) => s.currentGame);
  const searchOpen = useUIStore((s) => s.searchOpen);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

  const {
    authUser,
    authLoaded,
    stats,
    userTier,
    honeyPoints,
    honeyLifetime,
    honeyPendingActions,
    unreadMessages,
    userId,
    userName,
    userAvatar,
    handleLogout,
  } = useHeaderData();
  const headerGame = resolveHeaderGame(pathname, currentGame);
  const headerSets = useHeaderSets(headerGame);

  // Transparent at the very top (lets the page's hero/overhead glow flow through
  // the chrome uninterrupted), opaque once scrolled (so nav text stays legible
  // over content). Apple/Vercel pattern. Shared with the mobile header + ticker.
  const scrolled = useScrolled();

  const { config: publicConfig } = usePublicConfig();
  // Hubs are stable; Marketplace is appended (never swaps a hub) when enabled.
  const navLinks = publicConfig.marketplaceEnabled
    ? [...NAV_LINKS, MARKETPLACE_LINK]
    : NAV_LINKS;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setSearchOpen]);

  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]);
  const openSearch = useCallback(() => setSearchOpen(true), [setSearchOpen]);

  const canUpgrade = userTier === "FREE" || userTier === "PRO";

  const doLogout = useCallback(async () => {
    await handleLogout();
    router.push("/login");
    router.refresh();
  }, [handleLogout, router]);

  return (
    <>
    <div
      className={cn(
        "ease-chrome sticky top-0 z-chrome hidden transition-colors md:block",
        scrolled ? "bg-background" : "bg-transparent",
      )}
    >
      <HeaderMarketTicker
        stats={stats}
        game={headerGame}
        sets={headerSets.sets}
        setsLoading={headerSets.loading}
        setsError={headerSets.error}
        onSetsRetry={headerSets.retry}
        authLoaded={authLoaded}
        authUser={authUser}
        canUpgrade={canUpgrade}
        scrolled={scrolled}
      >
        {authLoaded && authUser ? (
          <HeaderUserMenu
            authUser={authUser}
            authLoaded={authLoaded}
            userTier={userTier}
            userName={userName}
            userAvatar={userAvatar}
            userId={userId}
            honeyPoints={honeyPoints}
            honeyLifetime={honeyLifetime}
            honeyPendingActions={honeyPendingActions}
            unreadMessages={unreadMessages}
            pathname={pathname}
            marketplaceEnabled={publicConfig.marketplaceEnabled}
            onLogout={doLogout}
          />
        ) : authLoaded ? (
          <div className="flex items-center gap-2">
            {/* Language, currency and theme moved into the account menu, which
                guests do not have — this gear is their door to the same
                controls, the way CoinGecko keeps a settings icon in its top
                strip for signed-out visitors. */}
            <HeaderGuestPreferencesMenu />
            <Link
              href="/pricing"
              className="ease-chrome flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Crown className="size-3 text-primary" />
              {t(language, "pricing")}
            </Link>
            <Link
              href="/login"
              className="ease-chrome rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t(language, "login")}
            </Link>
            <Link
              href="/register"
              className="ease-chrome rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t(language, "register")}
            </Link>
          </div>
        ) : null}
      </HeaderMarketTicker>

      <header
        style={{
          boxShadow: scrolled ? "inset 0 -1px 0 0 var(--p-hair)" : "none",
        }}
      >
        <div className="flex h-14 items-center gap-3 px-4 lg:px-8">
          <nav className="flex shrink-0 items-center">
            {navLinks.map((link) => {
              const active = isNavActive(pathname, link.href, link.owns);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "ease-chrome inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2 py-2 text-sm lg:h-9 lg:min-h-0 lg:py-0 lg:px-3.5",
                    active
                      ? "bg-[var(--p-honey-soft)] font-semibold text-primary"
                      : "font-medium text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(language, link.key)}
                </Link>
              );
            })}
          </nav>

          <div className="min-w-0 flex-1" />

          <div className="flex shrink-0 items-center gap-0.5 lg:gap-1.5">
            <Link
              href="/portfolio"
              aria-label={t(language, "portfolioNav")}
              aria-current={isNavActive(pathname, "/portfolio") ? "page" : undefined}
              className={cn(
                "ease-chrome flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors xl:h-9 xl:w-auto xl:gap-1.5 xl:px-3",
                isNavActive(pathname, "/portfolio")
                  ? "bg-[var(--p-honey-soft)] font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Briefcase
                className={cn(
                  "size-3.5",
                  isNavActive(pathname, "/portfolio")
                    ? "text-amber-500 dark:text-amber-400"
                    : "text-muted-foreground/60"
                )}
              />
              <span className="hidden xl:inline">{t(language, "portfolioNav")}</span>
            </Link>

            <Link
              href="/watchlist"
              aria-label={t(language, "watchlistNav")}
              aria-current={isNavActive(pathname, "/watchlist") ? "page" : undefined}
              className={cn(
                "ease-chrome flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors xl:h-9 xl:w-auto xl:gap-1.5 xl:px-3",
                isNavActive(pathname, "/watchlist")
                  ? "bg-[var(--p-honey-soft)] font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Heart className="size-3.5 text-primary" />
              <span className="hidden xl:inline">{t(language, "watchlistNav")}</span>
            </Link>

            <Link
              href="/honey"
              aria-label="Honey"
              aria-current={isNavActive(pathname, "/honey") ? "page" : undefined}
              className={cn(
                "ease-chrome relative flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors xl:h-9 xl:w-auto xl:gap-1.5 xl:px-3",
                isNavActive(pathname, "/honey")
                  ? "bg-[var(--p-honey-soft)] font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {honeyPendingActions && (
                <span className="absolute -right-1 -top-1 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-danger" />
                </span>
              )}
              <span className="text-sm leading-none">🍯</span>
              <span className="hidden xl:inline">Honey</span>
              {authLoaded && authUser && honeyPoints > 0 && (
                <span className="hidden font-bold tabular-nums text-amber-600 dark:text-amber-400 xl:inline">
                  {formatCount(honeyPoints)}
                </span>
              )}
            </Link>

          </div>

          {/* Owner call 2026-08-28 (navbar แบบ C): search closes the row at its
              far right, after Honey — the nav reads uninterrupted from the left
              and the field sits in the tools corner, the way CoinMarketCap ends
              its main row. Still the page's only search entry, still painted as
              a real field with the visible "/" hint. */}
          <div className="w-52 shrink-0 lg:w-80">
            <CommandSearchTrigger onClick={openSearch} />
          </div>
        </div>
      </header>
    </div>

    <HeaderMobile
      isAuthenticated={authLoaded && Boolean(authUser)}
      authLoaded={authLoaded}
      game={headerGame}
      sets={headerSets.sets}
      setsLoading={headerSets.loading}
      setsError={headerSets.error}
      onSetsRetry={headerSets.retry}
    />

    {/* The palette answers set queries too, so it needs the catalog the header
        already fetched — invisible in the bar, but dropping it would silently
        kill set results in search. */}
    <CommandSearchModal
      open={searchOpen}
      onClose={closeSearch}
      sets={headerSets.sets}
    />
    </>
  );
}
