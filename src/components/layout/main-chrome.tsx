"use client";

import { usePathname } from "next/navigation";

import { t } from "@/lib/i18n";
import { stripGamePrefix } from "@/lib/game/constants";
import { useUIStore } from "@/stores/ui-store";

import { PageContainer, type PageWidth } from "./page-container";

/**
 * Routes that render their own shell (admin/seller/messages/auth) and skip
 * the global Header / Footer / BottomNav rendered by the root layout.
 */
const CHROMELESS_ROUTES: ReadonlyArray<string | RegExp> = [
  /^\/admin(\/|$)/,
  "/admin-login",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  /^\/messages(\/|$)/,
  /^\/seller(\/|$)/,
  /^\/proto(\/|$)/, // redesign visual reference — owns its own warm-premium shell
];

/**
 * Routes that keep the mobile BottomNav (still a real tab destination) but
 * drop the persistent site Header and the marketing Footer. `/more` already
 * lists every nav destination itself (Browse/Track/Account/…) and its own
 * `PageHeader` large-title, so the global chrome above/below it is pure
 * duplication — owner call (2026-07-03).
 */
const NO_HEADER_FOOTER_ROUTES: ReadonlyArray<string | RegExp> = ["/more"];

/**
 * App / utility routes where the marketing Footer is redundant on MOBILE — the
 * BottomNav + "More" menu already cover navigation, so a full marketing footer
 * stacked above a fixed bottom bar is just heavy chrome. The footer stays on
 * `md+` (desktop has no bottom-nav) and on content/marketing routes at every
 * width (home, sets, cards, guide, blog, pricing, market pages…) where it
 * carries discovery links + SEO (mobile-first indexing reads the mobile DOM).
 */
const NO_MOBILE_FOOTER_ROUTES: ReadonlyArray<string | RegExp> = [
  "/portfolio",
  /^\/watchlist(\/|$)/,
  /^\/honey(\/|$)/,
  /^\/decks(\/|$)/,
  "/drop-calculator",
  "/compare",
  "/search",
  /^\/settings(\/|$)/,
  /^\/orders(\/|$)/,
  "/saved",
];

/**
 * Routes that should NOT be wrapped in the default `<main>` container — they
 * render their own full-bleed layout (e.g. public profile cover image).
 * Public profile is reachable three ways that all resolve to the SAME client:
 *   `/profile/<id>`, `/u/<handle>`, and `/@<handle>` (the canonical URL the
 * Share menu hands out). middleware rewrites `/@handle` → `/u/handle` but the
 * browser URL (what `usePathname()` sees) keeps the original, so all three
 * patterns must be listed or the scaffold double-wraps (gutter + pt/pb + glow).
 */
const FULL_WIDTH_ROUTES: ReadonlyArray<RegExp> = [
  /^\/profile\/.+/,
  /^\/u\/.+/,
  /^\/@.+/,
];

/**
 * Per-route width override. Pages absent from this map use `default` (7xl).
 * Add entries here when a route needs a narrower or wider container so
 * widths stay declarative instead of hand-rolling `mx-auto max-w-...`.
 */
const ROUTE_WIDTH: ReadonlyArray<readonly [RegExp | string, PageWidth]> = [
  // Reading-optimised pages (long-form text, single column)
  [/^\/blog\/.+/, "reading"],
  [/^\/guide\/.+/, "reading"],
  // Narrow product pages (single-record forms / detail)
  [/^\/orders\/[^/]+$/, "narrow"],
];

function matches(pathname: string, patterns: ReadonlyArray<string | RegExp>): boolean {
  const routePath = stripGamePrefix(pathname);
  return patterns.some((p) => (typeof p === "string" ? routePath === p : p.test(routePath)));
}

function resolveWidth(pathname: string): PageWidth {
  const routePath = stripGamePrefix(pathname);
  for (const [pattern, width] of ROUTE_WIDTH) {
    if (typeof pattern === "string" ? routePath === pattern : pattern.test(routePath)) {
      return width;
    }
  }
  return "default";
}

function useIsChromeless() {
  const pathname = usePathname();
  return matches(pathname, CHROMELESS_ROUTES);
}

/**
 * Wraps the mobile BottomNav — hidden only on fully chromeless routes (it's
 * still a real tab destination everywhere else, including `/more`).
 */
export function MainChrome({ children }: { children: React.ReactNode }) {
  const chromeless = useIsChromeless();
  if (chromeless) return null;
  return <>{children}</>;
}

/**
 * Wraps the site Header / Footer — hidden on chromeless routes AND on
 * `NO_HEADER_FOOTER_ROUTES` (see above). Kept separate from `MainChrome` so
 * the BottomNav can stay visible on routes that drop the rest of the chrome.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hidden = matches(pathname, CHROMELESS_ROUTES) || matches(pathname, NO_HEADER_FOOTER_ROUTES);
  if (hidden) return null;
  return <>{children}</>;
}

/** First keyboard stop on pages with the global site header. */
export function SkipToContent() {
  const lang = useUIStore((state) => state.language);

  return (
    <a
      href="#main-content"
      className="fixed top-4 left-4 z-[100] -translate-y-24 rounded-lg bg-background px-4 py-2 text-sm font-medium text-foreground shadow-[var(--elev-overlay)] motion-base focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {t(lang, "skipToContent")}
    </a>
  );
}

/**
 * Wraps the marketing Footer. Same hide rules as `SiteChrome`, plus: on
 * app/utility routes the footer is dropped on mobile (`<md`) and only shown on
 * desktop — see `NO_MOBILE_FOOTER_ROUTES`. Content/marketing routes keep it at
 * every width.
 */
export function FooterChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (matches(pathname, CHROMELESS_ROUTES) || matches(pathname, NO_HEADER_FOOTER_ROUTES)) {
    return null;
  }
  if (matches(pathname, NO_MOBILE_FOOTER_ROUTES)) {
    return <div className="hidden md:block">{children}</div>;
  }
  return <>{children}</>;
}

export function PageContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chromeless = matches(pathname, CHROMELESS_ROUTES);
  const fullWidth = matches(pathname, FULL_WIDTH_ROUTES);

  if (chromeless) {
    return <>{children}</>;
  }

  if (fullWidth) {
    return (
      <main id="main-content" tabIndex={-1} className="flex-1">
        {children}
      </main>
    );
  }

  const width = resolveWidth(pathname);

  // CHROME-09: clear the fixed mobile bottom-nav in ONE place. When this route
  // shows a mobile footer, the footer's own bottom padding clears the nav — so
  // <main> only needs normal breathing room (pb-12), killing the ~128px dead
  // scroll gap. Routes with no mobile footer keep pb-32 so content still clears.
  const hasMobileFooter =
    !matches(pathname, NO_MOBILE_FOOTER_ROUTES) &&
    !matches(pathname, NO_HEADER_FOOTER_ROUTES);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`relative flex-1 pt-8 md:pt-10 md:pb-24 ${hasMobileFooter ? "pb-12" : "pb-32"}`}
    >
      {/* ONE warm overhead light for every page (consistent) — spills from the
          top of the screen, BEHIND the transparent nav, and fades down. Replaces
          the old per-page glows so the ambient is identical app-wide. */}
      <div
        aria-hidden
        className="hero-search-glow pointer-events-none absolute inset-x-0 -top-28 -z-10 h-[34rem] w-full blur-2xl"
      />
      <PageContainer width={width}>{children}</PageContainer>
    </main>
  );
}
