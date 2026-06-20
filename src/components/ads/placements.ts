/**
 * Ad placement registry. Adding an ad zone = one entry here + one <AdSlot>.
 * See REDESIGN.md §3.6. Sizing is applied per-call via `className`; this
 * registry owns the placement vocabulary and the global no-ad route list.
 */
export type AdPlacement =
  | "chrome-banner"
  | "home-in-feed"
  | "browse-in-feed"
  | "card-detail-mid"
  | "card-detail-chart-side"
  | "card-detail-info-below"
  | "decks-footer"
  | "content-in-feed"
  | "profile-below-hero";

/**
 * Routes where ads NEVER render — commerce-critical paths, auth, admin, and
 * other distraction-free shells. Superset of CHROMELESS_ROUTES (main-chrome).
 */
export const AD_EXCLUDED_ROUTES: ReadonlyArray<RegExp> = [
  /^\/admin(\/|$)/,
  /^\/seller(\/|$)/,
  /^\/messages(\/|$)/,
  /^\/orders(\/|$)/,
  /^\/checkout(\/|$)/,
  /^\/marketplace\/create(\/|$)/,
  /^\/login$/,
  /^\/register$/,
  /^\/forgot-password$/,
  /^\/reset-password$/,
  /^\/admin-login$/,
];

export function isAdExcludedRoute(pathname: string): boolean {
  return AD_EXCLUDED_ROUTES.some((re) => re.test(pathname));
}

/** AdSense client id, set when ads go live. Absent ⇒ house ads only, no consent banner. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";
