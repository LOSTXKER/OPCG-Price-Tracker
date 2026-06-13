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
];

/**
 * Routes that should NOT be wrapped in the default `<main>` container — they
 * render their own full-bleed layout (e.g. public profile cover image).
 */
const FULL_WIDTH_ROUTES: ReadonlyArray<RegExp> = [
  /^\/profile\/.+/,
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

function useIsFullWidthPage() {
  const pathname = usePathname();
  return matches(pathname, FULL_WIDTH_ROUTES);
}

export function MainChrome({ children }: { children: React.ReactNode }) {
  const chromeless = useIsChromeless();
  if (chromeless) return null;
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
    <main className="flex-1 pt-8 pb-32 md:pt-10 md:pb-24">
      <PageContainer width={width}>{children}</PageContainer>
    </main>
  );
}
