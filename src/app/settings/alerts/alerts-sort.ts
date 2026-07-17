import { getCardName } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";
import type { PriceAlertItem } from "@/components/alerts/alert-types";

/**
 * Distance from today's price to the alert's target, as a signed percentage —
 * mirrors the "gapPct" alert-row.tsx shows under each active alert. Negative
 * (or zero) means the alert has already passed its target; `null` means there
 * is no current price to compare against.
 */
export function getAlertGapToTargetPct(alert: PriceAlertItem): number | null {
  const current = alert.card.latestPriceJpy;
  if (current == null || current <= 0) return null;
  return alert.direction === "ABOVE"
    ? ((alert.targetPrice - current) / current) * 100
    : ((current - alert.targetPrice) / current) * 100;
}

/**
 * Sort ACTIVE alerts by urgency (closest to firing first). Alerts already
 * past their target (gap <= 0) sort first among themselves by how far past;
 * alerts with no current price (nothing to compare) sort last. Does not
 * mutate the input.
 */
export function sortAlertsByUrgency(
  alerts: readonly PriceAlertItem[],
): PriceAlertItem[] {
  return [...alerts].sort((a, b) => {
    const gapA = getAlertGapToTargetPct(a);
    const gapB = getAlertGapToTargetPct(b);
    if (gapA == null && gapB == null) return 0;
    if (gapA == null) return 1;
    if (gapB == null) return -1;
    return gapA - gapB;
  });
}

/** Client-side search across both alert sections — card name (all langs) + code. */
export function filterAlertsBySearch(
  alerts: readonly PriceAlertItem[],
  lang: Language,
  query: string,
): PriceAlertItem[] {
  const q = query.trim().toLocaleLowerCase();
  if (!q) return [...alerts];
  return alerts.filter((alert) => {
    const haystack = [
      getCardName(lang, alert.card),
      alert.card.nameEn,
      alert.card.nameJp,
      alert.card.nameTh,
      alert.card.cardCode,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .toLocaleLowerCase();
    return haystack.includes(q);
  });
}
