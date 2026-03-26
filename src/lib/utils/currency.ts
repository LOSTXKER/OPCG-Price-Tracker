const DEFAULT_JPY_THB = 0.21;
const DEFAULT_JPY_USD = 0.0067;

export function jpyToThb(jpy: number, rate?: number): number {
  return Math.round(jpy * (rate ?? DEFAULT_JPY_THB) * 100) / 100;
}

export function jpyToUsd(jpy: number, rate?: number): number {
  return Math.round(jpy * (rate ?? DEFAULT_JPY_USD) * 100) / 100;
}

export function thbToJpy(thb: number, rate?: number): number {
  const r = rate ?? DEFAULT_JPY_THB;
  if (r === 0) return 0;
  return Math.round(thb / r);
}

export function formatJpy(amount: number): string {
  return `¥${amount.toLocaleString()}`;
}

export function formatThb(amount: number): string {
  return `${amount.toLocaleString()} ฿`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPrice(jpy: number, rate?: number): { jpy: string; thb: string } {
  return {
    jpy: formatJpy(jpy),
    thb: formatThb(jpyToThb(jpy, rate)),
  };
}

export type Currency = "JPY" | "THB" | "USD";

/**
 * Formats a JPY price into { primary, secondary } strings
 * based on the active currency. When `thbExplicit` is provided
 * it is used instead of the conversion estimate.
 */
export function formatByCurrency(
  jpy: number,
  currency: Currency,
  thbExplicit?: number | null
): { primary: string; secondary: string } {
  const thb = thbExplicit != null ? Number(thbExplicit) : jpyToThb(jpy);
  const usd = jpyToUsd(jpy);
  const approx = thbExplicit == null;

  switch (currency) {
    case "THB":
      return {
        primary: approx ? `~${formatThb(Math.round(thb))}` : formatThb(Math.round(thb)),
        secondary: formatJpy(jpy),
      };
    case "USD":
      return { primary: formatUsd(usd), secondary: formatJpy(jpy) };
    case "JPY":
    default:
      return {
        primary: formatJpy(jpy),
        secondary: approx ? `~${formatThb(Math.round(thb))}` : formatThb(Math.round(thb)),
      };
  }
}
