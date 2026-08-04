"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { NotificationBell } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";
import { GameSwitcher } from "@/components/layout/game-switcher";
import { useHydrated } from "@/hooks/use-hydrated";
import { useScrolled } from "@/hooks/use-scrolled";
import { useUIStore } from "@/stores/ui-store";
import { stripGamePrefix } from "@/lib/game/constants";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Phone chrome: identity (logo + game) on the left, account/appearance on the
 * right.
 *
 * Search is route-aware (เบส): the home hero owns search there, so the icon
 * would only duplicate it — but it is the ONLY phone trigger for
 * `CommandSearchModal` everywhere else (the desktop trigger lives in the
 * md-only ticker), so it renders on every other route.
 */
export function HeaderMobile({
  isAuthenticated,
  authLoaded = true,
}: {
  isAuthenticated: boolean;
  /** Keeps the guest CTA from flashing before the session resolves. */
  authLoaded?: boolean;
}) {
  const language = useUIStore((s) => s.language);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const pathname = usePathname() ?? "/";
  const isHome = stripGamePrefix(pathname) === "/";

  // Transparent at the top (the page's ambient glow flows through uninterrupted),
  // frosted + hairline once scrolled — same collapsing pattern as the desktop
  // header (header.tsx) and the /proto/ios showcase's nav bar.
  //
  // Same collapsing chrome as the desktop header — starts false (hydration- and
  // scroll-restoration-safe), corrects on mount. CHROME-11: one shared hook.
  const scrolled = useScrolled();

  // next-themes resolves on the client only, so the icon waits for hydration
  // rather than guessing and flipping (`useHydrated` = the shared guard).
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = hydrated && resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "ease-chrome sticky top-0 z-chrome transition-colors md:hidden",
        scrolled ? "hairline-b bg-background" : "bg-transparent",
      )}
    >
      <div className="flex h-14 items-center gap-0.5 px-4">
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2">
          <Image
            src="/meecard.png"
            alt="Meecard"
            width={754}
            height={694}
            className="h-auto shrink-0 select-none"
            style={{ width: 26, height: "auto" }}
          />
          <span className="text-base font-bold tracking-tight">Meecard</span>
        </Link>

        <GameSwitcher className="ml-1.5" />

        <div className="flex-1" />

        {!isHome && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t(language, "search")}
            onClick={() => setSearchOpen(true)}
            className="text-muted-foreground"
          >
            <Search className="size-[18px]" />
          </Button>
        )}

        {isAuthenticated && <NotificationBell />}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t(language, isDark ? "lightMode" : "darkMode")}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="text-muted-foreground"
        >
          {isDark ? (
            <Sun className="size-[18px]" />
          ) : (
            <Moon className="size-[18px]" />
          )}
        </Button>

        {authLoaded && !isAuthenticated && (
          <Button size="sm" className="ml-1" render={<Link href="/login" />}>
            {t(language, "login")}
          </Button>
        )}
      </div>
    </div>
  );
}
