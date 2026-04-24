"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import {
  Bookmark,
  ChevronDown,
  Crown,
  Star,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandSearchModal } from "@/components/shared/command-search";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useHeaderData } from "@/hooks/use-header-data";
import { NAV_LINKS, TOOL_LINKS, isActive } from "./header-constants";
import { HeaderMarketTicker } from "./header-market-ticker";
import { HeaderUserMenu } from "./header-user-menu";
import { HeaderMobile } from "./header-mobile";
import { MobileMenuSheet } from "./mobile-menu-sheet";

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
    <div className="sticky top-0 z-50 hidden md:block">
      <HeaderMarketTicker
        stats={stats}
        authLoaded={authLoaded}
        authUser={authUser}
        canUpgrade={canUpgrade}
        mounted={mounted}
        onSearchOpen={openSearch}
      />

      <header className="border-b border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-6 lg:px-8">
          <Link href="/" className="mr-8 flex shrink-0 items-center gap-2.5">
            <Image src="/meecard.png" alt="Meecard" width={28} height={28} className="shrink-0 select-none" priority />
            <span className="text-base font-bold tracking-tight">Meecard</span>
          </Link>

          <nav className="flex items-center">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
                    active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(language, link.key)}
                  {active && <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-primary" />}
                </Link>
              );
            })}

            {(() => {
              const toolActive = TOOL_LINKS.some((l) => isActive(pathname, l.href));
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      "relative flex items-center gap-1 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors focus:outline-none",
                      toolActive ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t(language, "tools")}
                    <ChevronDown className="size-3" />
                    {toolActive && <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-primary" />}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={8} className="min-w-[180px]">
                    {TOOL_LINKS.map((link) => {
                      const Icon = link.icon;
                      return (
                        <DropdownMenuItem
                          key={link.href}
                          onClick={() => router.push(link.href)}
                          className={cn(isActive(pathname, link.href) && "font-semibold text-foreground")}
                        >
                          <Icon className="size-4" />
                          {t(language, link.key)}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <Link
              href="/portfolio"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(pathname, "/portfolio")
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Star className="size-3.5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
              {t(language, "portfolioNav")}
            </Link>

            <Link
              href="/watchlist"
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(pathname, "/watchlist")
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <Bookmark className="size-3.5 text-blue-500 dark:text-blue-400" />
              {t(language, "watchlistNav")}
            </Link>

            <Link
              href="/honey"
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive(pathname, "/honey")
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {honeyPendingActions && (
                <span className="absolute -right-1 -top-1 flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                </span>
              )}
              <span className="text-sm leading-none">🍯</span>
              <span>Honey</span>
              {authLoaded && authUser && honeyPoints > 0 && (
                <span className="font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {honeyPoints.toLocaleString()}
                </span>
              )}
            </Link>

            <div className="mx-1.5 h-5 w-px bg-border/40" />

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
                onLogout={doLogout}
              />
            ) : authLoaded ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/pricing"
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <Crown className="size-3 text-amber-600 dark:text-amber-400" />
                  {language === "TH" ? "แพ็กเกจ" : language === "JP" ? "プラン" : "Plans"}
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-border/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  {t(language, "login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {t(language, "register")}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </div>

    <HeaderMobile />

    <MobileMenuSheet
      authUser={authUser}
      authLoaded={authLoaded}
      userName={userName}
      userAvatar={userAvatar}
      userId={userId}
      userTier={userTier}
      honeyPoints={honeyPoints}
      honeyPendingActions={honeyPendingActions}
      unreadMessages={unreadMessages}
      mounted={mounted}
      onLogout={doLogout}
    />

    <CommandSearchModal open={searchOpen} onClose={closeSearch} />
    </>
  );
}
