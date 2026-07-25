"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { useScrolled } from "@/hooks/use-scrolled";
import {
  Briefcase,
  Crown,
  Heart,
} from "lucide-react";
import { CommandSearchModal } from "@/components/shared/command-search";
import { GameSwitcher } from "@/components/layout/game-switcher";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils/currency";
import { t } from "@/lib/i18n";
import { useHeaderData } from "@/hooks/use-header-data";
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
    mounted,
    handleLogout,
  } = useHeaderData();

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
        "ease-chrome sticky top-0 z-50 hidden transition-colors md:block",
        scrolled ? "bg-background" : "bg-transparent",
      )}
    >
      <HeaderMarketTicker
        stats={stats}
        authLoaded={authLoaded}
        authUser={authUser}
        canUpgrade={canUpgrade}
        mounted={mounted}
        onSearchOpen={openSearch}
        scrolled={scrolled}
      />

      <header
        style={{
          boxShadow: scrolled ? "inset 0 -1px 0 0 var(--p-hair)" : "none",
        }}
      >
        <div className="flex h-14 items-center px-4 lg:px-8">
          <Link
            href="/"
            aria-label="Meecard"
            className="mr-2 flex min-h-11 shrink-0 items-center gap-2 lg:mr-3 lg:min-h-0 lg:gap-2.5"
          >
            <Image
              src="/meecard.png"
              alt="Meecard"
              width={754}
              height={694}
              className="h-auto shrink-0 select-none"
              style={{ width: 28, height: "auto" }}
            />
            <span className="hidden text-base font-bold tracking-tight lg:inline">Meecard</span>
          </Link>

          <GameSwitcher className="mr-2 min-h-11 px-2.5 lg:mr-5 lg:min-h-0 lg:px-3" />

          <nav className="flex items-center">
            {navLinks.map((link) => {
              const active = isNavActive(pathname, link.href, link.owns);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "ease-chrome inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-2 py-2 text-sm lg:min-h-0 lg:px-3",
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

          <div className="flex-1" />

          <div className="flex items-center gap-0.5 lg:gap-1.5">
            <Link
              href="/portfolio"
              aria-label={t(language, "portfolioNav")}
              aria-current={isNavActive(pathname, "/portfolio") ? "page" : undefined}
              className={cn(
                "ease-chrome flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors xl:size-auto xl:gap-1.5 xl:px-3 xl:py-1.5",
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
                "ease-chrome flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors xl:size-auto xl:gap-1.5 xl:px-3 xl:py-1.5",
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
                "ease-chrome relative flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors xl:size-auto xl:gap-1.5 xl:px-3 xl:py-1.5",
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

            <div className="mx-0.5 h-5 w-px bg-border/40 lg:mx-1.5" />

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
          </div>
        </div>
      </header>
    </div>

    <HeaderMobile isAuthenticated={authLoaded && Boolean(authUser)} />

    <CommandSearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
