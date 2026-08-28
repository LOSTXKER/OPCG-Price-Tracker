"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, LogIn } from "lucide-react";

import { usePathname } from "next/navigation";

import { NotificationBell } from "@/components/layout/notification-bell";
import { HeaderCatalogControl } from "@/components/layout/header-catalog-control";
import { Button } from "@/components/ui/button";
import type { SetPickerItem } from "@/components/shared/set-picker";
import { useScrolled } from "@/hooks/use-scrolled";
import { useUIStore } from "@/stores/ui-store";
import { isNavActive } from "@/lib/game/constants";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Phone chrome: brand, the global Game → Set catalog control, and route-aware
 * utilities share one 56px top row. Every utility remains reachable; only
 * labels and separators yield as space tightens. The bear is the stable,
 * compact home affordance at every phone width.
 *
 * Search is NOT here (owner selection 2026-08-29): it is the raised round
 * button in the middle of the bottom nav, where the thumb already rests. Its
 * old slot carries รายการโปรด instead — the tab that gave up its place in the
 * bar for that button — so the row keeps exactly the width it had and the
 * watchlist stays one tap from every route.
 *
 * The theme toggle deliberately does NOT live here: it already ships in
 * "ดูเพิ่มเติม", and its 44px slot was the width the set control needed for the
 * set name to survive at phone widths. Set selection is the primary axis; a
 * theme switch is a once-a-month preference.
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
  const pathname = usePathname() ?? "/";

  // Same collapsing chrome as the desktop header — starts false (hydration- and
  // scroll-restoration-safe), corrects on mount. CHROME-11: one shared hook.
  const scrolled = useScrolled();

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
          data-mobile-watchlist-trigger
          variant="ghost"
          size="icon-sm"
          aria-label={t(language, "watchlistNav")}
          aria-current={
            isNavActive(pathname, "/watchlist") ? "page" : undefined
          }
          className={cn(
            "surface-2 hairline min-h-11 min-w-11 rounded-full",
            isNavActive(pathname, "/watchlist")
              ? "text-primary"
              : "text-foreground",
          )}
          render={<Link href="/watchlist" />}
        >
          <Heart className="size-[18px]" />
        </Button>

        {isAuthenticated && <NotificationBell />}

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
