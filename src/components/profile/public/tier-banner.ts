/**
 * Flat colour applied behind the locked / private profile banner.
 * Tier-derived colour is intentionally restrained — visitors should never
 * see a literal "PRO" badge, but paid sellers get a slightly richer banner
 * so their profile feels a touch more polished.
 */
export const TIER_BANNER: Record<string, string> = {
  FREE: "bg-slate-600 dark:bg-slate-800",
  PRO: "bg-amber-700 dark:bg-amber-900",
  LIFETIME_PRO: "bg-amber-700 dark:bg-amber-900",
  PRO_PLUS: "bg-yellow-600 dark:bg-yellow-800",
  LIFETIME_PRO_PLUS: "bg-yellow-600 dark:bg-yellow-800",
};

export function tierBanner(tier: string): string {
  return TIER_BANNER[tier] ?? TIER_BANNER.FREE;
}

/** Format a tab badge count compactly: 100 → "99+" (Instagram convention). */
export function formatTabBadge(n: number): string {
  if (n <= 99) return String(n);
  return "99+";
}
