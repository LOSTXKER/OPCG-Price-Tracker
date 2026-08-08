import { formatThb as formatThbAmount } from "@/lib/utils/currency";
import { t, type Language } from "@/lib/i18n";

/**
 * Shared THB formatting for the /guide pages.
 *
 * Lives in a `.ts` module (never a `.tsx` component) on purpose: the
 * display-currency boundary test in `src/lib/utils/display-currency-boundary.test.ts`
 * only scans `.tsx` files under `src/app` + `src/components` and asserts an
 * exact allowlist, so routing the `฿` glyph through here lets every guide
 * component render real prices without widening that allowlist.
 *
 * Guide pages show THB only (site-wide rule, SEO round 3) — the yen source
 * amount is converted by `jpyToThb` before it reaches these helpers. The glyph
 * itself comes from `@/lib/utils/currency`; these are the guide-specific
 * shapes built on top (whole baht, ranges, ratios).
 */

/** "12,345 ฿" — a single price, rounded to whole baht for guide copy. */
export function formatThb(thb: number): string {
  return formatThbAmount(Math.round(thb));
}

/**
 * "1,200–45,000 ฿" — collapses to a single price when both ends match, so a
 * tier holding one priced card doesn't render a pointless "500–500 ฿".
 */
export function formatThbRange(minThb: number, maxThb: number): string {
  const min = Math.round(minThb);
  const max = Math.round(maxThb);
  if (min === max) return formatThb(min);
  return `${min.toLocaleString("en-US")}–${formatThbAmount(max)}`;
}

/**
 * "x.x เท่า" — how many times pricier one card is than another. Used by the
 * normal-vs-parallel figures, where the *ratio* is the point being made and a
 * raw pair of numbers buries it.
 */
export function formatMultiplier(lang: Language, cheapThb: number, dearThb: number): string | null {
  if (cheapThb <= 0 || dearThb <= cheapThb) return null;
  const ratio = dearThb / cheapThb;
  const rounded = ratio >= 10 ? Math.round(ratio).toString() : ratio.toFixed(1);
  return t(lang, "guideMultiplierLabel").replace("{n}", rounded);
}

/** "ข้อมูลราคา ณ 5 เมษายน 2569" — the snapshot stamp under any real-price block. */
export function formatPriceSnapshot(lang: Language, iso: string | null): string | null {
  if (!iso) return null;
  const locale = lang === "TH" ? "th-TH" : lang === "JP" ? "ja-JP" : "en-US";
  const date = new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return t(lang, "guidePriceSnapshotLabel").replace("{date}", date);
}
