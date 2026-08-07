import { t, type Language } from "@/lib/i18n";

/**
 * Pure formatting helpers for the real per-tier price data on
 * `/guide/rarities` (see `getRarityPriceStats` in `page.tsx`). Kept in their
 * own module — with no `@/lib/db` import — so they can be unit tested without
 * needing a live database connection.
 */

export type TierPriceStats = { count: number; minThb: number; medianThb: number; maxThb: number };

/**
 * "¥100,000-1,000,000+" style ranges used to be typed in by hand and went
 * stale silently. This formats the real min/median/max computed by
 * `getRarityPriceStats` (THB, matching the site-wide "no yen on page" rule —
 * SEO round 3) with graceful "no data yet" text for tiers nothing is priced
 * in yet (TR / DON in the current catalogue).
 */
export function formatTierPriceLabel(lang: Language, stats: TierPriceStats | null): string {
  if (!stats) return t(lang, "guideRarityNoPriceData");
  const min = stats.minThb.toLocaleString("en-US");
  const max = stats.maxThb.toLocaleString("en-US");
  if (stats.minThb === stats.maxThb) return `${min} ฿`;
  const median = stats.medianThb.toLocaleString("en-US");
  return `${min}–${max} ฿ (${t(lang, "guideRarityMedianLabel")} ${median} ฿)`;
}

export function formatSnapshotDate(lang: Language, iso: string | null): string | null {
  if (!iso) return null;
  const locale = lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US";
  const date = new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return t(lang, "guideRaritySnapshotLabel").replace("{date}", date);
}
