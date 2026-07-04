"use client";

import { usePathname } from "next/navigation";

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
  return patterns.some((p) => (typeof p === "string" ? pathname === p : p.test(pathname)));
}

function resolveWidth(pathname: string): PageWidth {
  for (const [pattern, width] of ROUTE_WIDTH) {
    if (typeof pattern === "string" ? pathname === pattern : pattern.test(pathname)) {
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

export function PageContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chromeless = matches(pathname, CHROMELESS_ROUTES);
  const fullWidth = matches(pathname, FULL_WIDTH_ROUTES);

  if (chromeless || fullWidth) {
    return <>{children}</>;
  }

  const width = resolveWidth(pathname);

  return (
    <main className="relative flex-1 pt-8 pb-32 md:pt-10 md:pb-24">
      {/* ONE warm overhead light for every page (consistent) — spills from the
          top of the screen, BEHIND the transparent nav, and fades down. Replaces
          the old per-page glows so the ambient is identical app-wide. */}
      <div
        aria-hidden
        className="hero-search-glow pointer-events-none absolute left-1/2 -top-28 -z-10 h-[34rem] w-screen -translate-x-1/2 blur-2xl"
      />
      <PageContainer width={width}>{children}</PageContainer>
    </main>
  );
}
