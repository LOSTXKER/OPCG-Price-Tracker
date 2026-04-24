/**
 * Subtle gradient applied behind the locked / private profile banner.
 * Tier-derived colour is intentionally restrained — visitors should never
 * see a literal "PRO" badge, but paid sellers get a slightly richer banner
 * so their profile feels a touch more polished.
 */
export const TIER_BANNER: Record<string, string> = {
  FREE: "from-slate-600 via-slate-500 to-slate-400 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600",
  PRO: "from-amber-700 via-orange-500 to-yellow-400 dark:from-amber-900 dark:via-orange-700 dark:to-yellow-600",
  LIFETIME_PRO: "from-amber-700 via-orange-500 to-yellow-400 dark:from-amber-900 dark:via-orange-700 dark:to-yellow-600",
  PRO_PLUS: "from-yellow-600 via-amber-400 to-orange-300 dark:from-yellow-800 dark:via-amber-600 dark:to-orange-500",
  LIFETIME_PRO_PLUS: "from-yellow-600 via-amber-400 to-orange-300 dark:from-yellow-800 dark:via-amber-600 dark:to-orange-500",
};

export function tierBanner(tier: string): string {
  return TIER_BANNER[tier] ?? TIER_BANNER.FREE;
}

/** Format a tab badge count compactly: 100 → "99+" (Instagram convention). */
export function formatTabBadge(n: number): string {
  if (n <= 99) return String(n);
  return "99+";
}
