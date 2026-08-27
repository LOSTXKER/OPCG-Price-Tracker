"use client";

import Link from "next/link";
import Image from "next/image";
import { LogIn, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { NotificationBell } from "@/components/layout/notification-bell";
import { HeaderCatalogControl } from "@/components/layout/header-catalog-control";
import { Button } from "@/components/ui/button";
import type { SetPickerItem } from "@/components/shared/set-picker";
import { useHydrated } from "@/hooks/use-hydrated";
import { useScrolled } from "@/hooks/use-scrolled";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Phone chrome: brand, the global Game → Set catalog control, and route-aware
 * utilities share one 56px top row. Every utility remains reachable; only
 * labels and separators yield as space tightens. The bear is the stable,
 * compact home affordance at every phone width.
 *
 * Search remains a global phone action on every route, including Home. It
 * opens the shared `CommandSearchModal`; the Home hero search stays as the
 * larger in-content entry point.
 */
export function HeaderMobile({
  isAuthenticated,
  authLoaded = true,
  game,
  sets,
  setsLoading,
  setsError,
  onSetsRetry,
}: {
  isAuthenticated: boolean;
  /** Keeps the guest CTA from flashing before the session resolves. */
  authLoaded?: boolean;
  game: string;
  sets: readonly SetPickerItem[];
  setsLoading: boolean;
  setsError: boolean;
  onSetsRetry: () => void;
}) {
  const language = useUIStore((s) => s.language);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);

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
      data-mobile-header
      className={cn(
        "ease-chrome sticky top-0 z-chrome transition-colors md:hidden",
        scrolled ? "hairline-b bg-background" : "bg-transparent",
      )}
    >
      <div
        data-mobile-header-row="primary"
        className="flex h-14 min-w-0 items-center px-2 sm:px-4"
      >
        <Link
          href="/"
          aria-label="Meecard"
          className="mr-1 flex size-11 shrink-0 items-center justify-center"
        >
          <Image
            src="/meecard.png"
            alt=""
            width={754}
            height={694}
            className="h-auto w-7 shrink-0 select-none min-[360px]:w-8"
          />
        </Link>

        <HeaderCatalogControl
          game={game}
          sets={sets}
          loading={setsLoading}
          error={setsError}
          onRetry={onSetsRetry}
          presentation="mobile"
          className="min-w-0 flex-1"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t(language, "search")}
          onClick={() => setSearchOpen(true)}
          className="min-h-11 min-w-11 text-muted-foreground"
        >
          <Search className="size-[18px]" />
        </Button>

        {isAuthenticated && <NotificationBell />}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t(language, isDark ? "lightMode" : "darkMode")}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="min-h-11 min-w-11 text-muted-foreground"
        >
          {isDark ? (
            <Sun className="size-[18px]" />
          ) : (
            <Moon className="size-[18px]" />
          )}
        </Button>

        {authLoaded && !isAuthenticated && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t(language, "login")}
            className="min-h-11 min-w-11 text-muted-foreground"
            render={<Link href="/login" />}
          >
            <LogIn className="size-[18px]" />
          </Button>
        )}
      </div>
    </div>
  );
}
