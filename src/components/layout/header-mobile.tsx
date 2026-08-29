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
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * What row 1's middle says. Keyed off the same routes the bottom nav owns, so
 * the two always agree on what the current place is called; anything deeper
 * (a card, a set, settings…) falls back to the site name rather than guessing.
 */
function resolvePageTitle(pathname: string, language: Language): string {
  if (pathname === "/") return t(language, "home");
  if (isNavActive(pathname, "/opcg/sets", ["/cards", "/search", "/trending", "/market-overview"]))
    return t(language, "sets");
  if (isNavActive(pathname, "/watchlist")) return t(language, "watchlistNav");
  if (isNavActive(pathname, "/portfolio")) return t(language, "portfolioNav");
  if (isNavActive(pathname, "/more")) return t(language, "more");
  return "Meecard";
}

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
  userName,
}: {
  isAuthenticated: boolean;
  /** Keeps the guest CTA from flashing before the session resolves. */
  authLoaded?: boolean;
  /** First character seeds the account button, mirroring the desktop menu. */
  userName?: string | null;
  game: string;
  sets: readonly SetPickerItem[];
  setsLoading: boolean;
  setsError: boolean;
  onSetsRetry: () => void;
}) {
  const language = useUIStore((s) => s.language);
  const pathname = usePathname() ?? "/";
  const accountInitial = userName?.trim()?.[0]?.toUpperCase() ?? "?";

  // Same collapsing chrome as the desktop header — starts false (hydration- and
  // scroll-restoration-safe), corrects on mount. CHROME-11: one shared hook.
  const scrolled = useScrolled();

  return (
    <>
      {/* Only row 1 is sticky, and the two rows are SIBLINGS — not wrapped in a
          shared box. A `sticky` child can only travel inside its parent, so a
          wrapper sized to both rows would let row 1 scroll away with them.
          The context row below therefore scrolls off on its own (owner call
          2026-08-29: "เลื่อนลงแล้วเลือกการ์ดกับชุดไม่ต้องตามมา") — done by
          LAYOUT, not by hiding it on a scroll flag: a JS-hidden row would leave
          `--chrome-h` describing a height the bar no longer has, and every
          sticky sub-bar on the site (the phone list header included) reads that
          var for its offset. Letting it scroll keeps the var honest at 56px. */}
      <div
        data-mobile-header
        className={cn(
          "ease-chrome sticky top-0 z-chrome transition-colors md:hidden",
          scrolled ? "hairline-b bg-background" : "bg-transparent",
        )}
      >
      {/* Row 1 — identity + account. The middle carries the PAGE NAME, not the
          wordmark: the bear already says which site this is, so the space is
          better spent saying where you are (iOS toolbar grammar). */}
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

        <span className="text-h5 min-w-0 flex-1 truncate text-foreground">
          {resolvePageTitle(pathname, language)}
        </span>

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

        {/* Tools (watchlist, alerts) end here; the account begins after the
            rule. Four undifferentiated icons read as one blur without it. */}
        {authLoaded && (
          <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-hair" />
        )}

        {authLoaded && isAuthenticated && (
          <Button
            data-mobile-account-trigger
            variant="ghost"
            size="icon-sm"
            aria-label={t(language, "more")}
            className="min-h-11 min-w-11 rounded-full bg-primary/15 text-sm font-semibold text-primary"
            render={<Link href="/more" />}
          >
            {accountInitial}
          </Button>
        )}

        {authLoaded && !isAuthenticated && (
          // Spelled out, not a lone glyph: signing in is the one thing a
          // visitor might be looking for up here, and the row has the width
          // for it now that sign-out lives inside "ดูเพิ่มเติม".
          <Button
            size="sm"
            aria-label={t(language, "login")}
            className="min-h-11 shrink-0 gap-1.5 rounded-full px-3.5 text-sm font-semibold"
            render={<Link href="/login" />}
          >
            <LogIn className="size-4" />
            {t(language, "login")}
          </Button>
        )}
        </div>
      </div>

      {/* Row 2 — the context bar: which game, which set. Faintly tinted so it
          reads as "where you are" rather than a second row of chrome, and wide
          enough for the set's box art and full name (owner selection
          2026-08-29 — at phone widths the old inline control was squeezed to
          ~123px and truncated every real set name).

          It rides along at the top of the page and then STEPS ASIDE once the
          visitor scrolls (owner call 2026-08-29: "เลื่อนลงแล้วเลือกการ์ดกับชุด
          ไม่ต้องตามมา"). By then they have already picked what they are looking
          at, and on a phone the sticky bar's height is worth more to the
          content than to a control they are done with. Row 1 stays: page name,
          watchlist, alerts and account are what a scrolled reader still needs.
          The whole row goes, not just its contents — a 48px tinted band with
          nothing in it would be worse than no band at all. */}
      <div
        data-mobile-header-row="context"
        className="flex h-12 min-w-0 items-center bg-muted/30 px-2 sm:px-4 md:hidden"
      >
        <HeaderCatalogControl
          game={game}
          sets={sets}
          loading={setsLoading}
          error={setsError}
          onRetry={onSetsRetry}
          presentation="mobile"
          className="min-w-0 flex-1"
        />
      </div>
    </>
  );
}
