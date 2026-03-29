const DEFAULT_JPY_THB = 0.21;
const DEFAULT_JPY_USD = 0.0067;

export function jpyToThb(jpy: number, rate?: number): number {
  return Math.round(jpy * (rate ?? DEFAULT_JPY_THB) * 100) / 100;
}

export function jpyToUsd(jpy: number, rate?: number): number {
  return Math.round(jpy * (rate ?? DEFAULT_JPY_USD) * 100) / 100;
}

export function usdToJpy(usd: number, rate?: number): number {
  const r = rate ?? DEFAULT_JPY_USD;
  if (r === 0) return 0;
  return Math.round(usd / r);
}

export function usdToThb(usd: number): number {
  return Math.round(jpyToThb(usdToJpy(usd)));
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
 * Formats a raw JPY amount (e.g. PnL, cost) according to the active currency.
 * Unlike formatByCurrency, this returns a single string with no secondary.
 */
export function formatJpyAmount(jpy: number, currency: Currency): string {
  switch (currency) {
    case "THB":
      return formatThb(Math.round(jpyToThb(jpy)));
    case "USD":
      return formatUsd(jpyToUsd(jpy));
    default:
      return formatJpy(jpy);
  }
}

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

  switch (currency) {
    case "THB":
      return {
        primary: formatThb(Math.round(thb)),
        secondary: formatJpy(jpy),
      };
    case "USD":
      return { primary: formatUsd(usd), secondary: formatJpy(jpy) };
    case "JPY":
    default:
      return {
        primary: formatJpy(jpy),
        secondary: formatThb(Math.round(thb)),
      };
  }
}

/**
 * Formats a USD-denominated price according to the active display currency.
 * When currency = USD, shows the USD amount directly (no conversion).
 * Otherwise converts USD → JPY or THB first.
 */
export function formatUsdByCurrency(
  usd: number,
  currency: Currency,
): { primary: string; secondary: string } {
  switch (currency) {
    case "JPY":
      return { primary: formatJpy(usdToJpy(usd)), secondary: formatUsd(usd) };
    case "THB":
      return { primary: formatThb(usdToThb(usd)), secondary: formatUsd(usd) };
    case "USD":
    default:
      return { primary: formatUsd(usd), secondary: formatJpy(usdToJpy(usd)) };
  }
}

/** Convert JPY to a numeric value in the user's display currency. */
export function jpyToDisplayValue(jpy: number, currency: Currency): number {
  switch (currency) {
    case "THB":
      return jpyToThb(jpy);
    case "USD":
      return jpyToUsd(jpy);
    default:
      return jpy;
  }
}

/** Convert USD to a numeric value in the user's display currency. */
export function usdToDisplayValue(usd: number, currency: Currency): number {
  switch (currency) {
    case "JPY":
      return usdToJpy(usd);
    case "THB":
      return usdToThb(usd);
    default:
      return usd;
  }
}

/** Format an already-converted display-currency value as a full string. */
export function formatDisplayValue(value: number, currency: Currency): string {
  switch (currency) {
    case "THB":
      return formatThb(Math.round(value));
    case "USD":
      return formatUsd(value);
    default:
      return formatJpy(Math.round(value));
  }
}

/** Convert a value in the user's display currency back to JPY. */
export function displayValueToJpy(value: number, currency: Currency): number {
  switch (currency) {
    case "THB":
      return thbToJpy(value);
    case "USD":
      return usdToJpy(value);
    default:
      return value;
  }
}

/** Return the currency prefix symbol for use in input fields. */
export function currencySymbol(currency: Currency): string {
  switch (currency) {
    case "THB":
      return "฿";
    case "USD":
      return "$";
    default:
      return "¥";
  }
}

/** Format a percentage value with commas and fixed decimals. */
export function formatPct(value: number, decimals = 1): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a display-currency value in compact form for chart axes. */
export function compactDisplayValue(value: number, currency: Currency): string {
  let prefix: string;
  let suffix: string;

  switch (currency) {
    case "THB":
      prefix = "";
      suffix = " ฿";
      break;
    case "USD":
      prefix = "$";
      suffix = "";
      break;
    default:
      prefix = "¥";
      suffix = "";
  }

  if (value >= 1_000_000) return `${prefix}${(value / 1_000_000).toFixed(1)}M${suffix}`;
  if (value >= 1_000) return `${prefix}${Math.round(value / 1_000)}K${suffix}`;
  return `${prefix}${Math.round(value)}${suffix}`;
}
