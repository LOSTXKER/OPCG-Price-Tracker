import { Crown, Sparkles } from "lucide-react";
import { TIER_LIMITS } from "./limits";
import type { CheckoutPlanKey } from "./schemas";
import { t, type Language, type TranslationKey } from "@/lib/i18n";

/**
 * Pricing-table & plan-card metadata. Numeric values come from `TIER_LIMITS`
 * via `tierValues` so /pricing and /settings/subscription never disagree
 * with the runtime gate logic.
 *
 * `buildFeatureSections()` is the public pricing surface. It deliberately
 * excludes rows whose tier entitlements are not enforced end-to-end yet.
 */

export const TIERS = ["FREE", "PRO", "PRO_PLUS"] as const;
export type TierKey = (typeof TIERS)[number];

/** Map subscription and lifetime tiers onto the three plans shown in billing UI. */
export function toPlanTier(tier: string | null | undefined): TierKey {
  if (tier === "PRO_PLUS" || tier === "LIFETIME_PRO_PLUS") return "PRO_PLUS";
  if (tier === "PRO" || tier === "LIFETIME_PRO") return "PRO";
  return "FREE";
}

export function isPlanCurrent(
  planKey: TierKey,
  userTier: string | null | undefined,
): boolean {
  return planKey === toPlanTier(userTier);
}

function num(v: number): string | boolean {
  if (v === Infinity) return "∞";
  if (v === 0) return false as unknown as string;
  return String(v);
}

function tierValues<T extends string | boolean>(
  fn: (limits: (typeof TIER_LIMITS)[TierKey]) => T,
): Record<string, T> {
  return Object.fromEntries(TIERS.map((k) => [k, fn(TIER_LIMITS[k])]));
}

function formatHistoryDays(days: number): string {
  if (days === Infinity) return "All-time";
  if (days >= 365) return `${Math.round(days / 365)} year`;
  return `${days} days`;
}

/** Localize the semantic price-history values kept in the shared plan table. */
export function formatPlanFeatureValue(value: string, lang: Language): string {
  if (value === "All-time") return t(lang, "pricingAllTime");
  if (value === "1 year") return t(lang, "pricingOneYear");
  const days = value.match(/^(\d+) days$/)?.[1];
  if (days) return t(lang, "pricingHistoryDaysValue").replace("{n}", days);
  return value;
}

/** Runtime marketplace fee values kept for admin/config consumers. */
export type MarketplaceFeeOverrides = Partial<Record<TierKey, number>>;

export type FeatureRow = {
  key: string;
  labelKey: TranslationKey;
  values: Record<string, string | boolean>;
};

export type FeatureSection = {
  titleKey: TranslationKey;
  rows: FeatureRow[];
};

/**
 * Build the pricing/comparison feature table from benefits that work today.
 * The marketplace block remains in `FEATURE_SECTIONS` for its internal row
 * metadata, but is hidden until fee/boost/bulk/auto-pricing gates are wired.
 */
export function buildFeatureSections(): FeatureSection[] {
  return FEATURE_SECTIONS.filter(
    (section) => section.titleKey !== "featSectionMarketplace",
  );
}

export const FEATURE_SECTIONS: FeatureSection[] = [
  {
    titleKey: "featSectionCore",
    rows: [
      {
        key: "priceHistory",
        labelKey: "featPriceHistory",
        values: tierValues((l) => formatHistoryDays(l.priceHistoryDays)),
      },
      {
        key: "compareCards",
        labelKey: "featCardCompare",
        values: tierValues((l) => num(l.compareCards) as string),
      },
      {
        key: "csvExport",
        labelKey: "featCsvExport",
        values: tierValues((l) => l.csvExport),
      },
      {
        key: "honeyMultiplier",
        labelKey: "featHoneyMultiplier",
        values: tierValues((l) => `${l.honeyMultiplier}x`),
      },
    ],
  },
  {
    titleKey: "featSectionPortfolio",
    rows: [
      {
        key: "portfolioCards",
        labelKey: "featPortfolioCards",
        values: tierValues((l) => num(l.portfolioCards) as string),
      },
      {
        key: "portfolioCount",
        labelKey: "featPortfolioCount",
        values: tierValues((l) => num(l.portfolioCount) as string),
      },
      {
        key: "watchlistCards",
        labelKey: "featWatchlistCards",
        values: tierValues((l) => num(l.watchlistCards) as string),
      },
      {
        key: "decks",
        labelKey: "featDecks",
        values: tierValues((l) => num(l.deckCount) as string),
      },
    ],
  },
  {
    titleKey: "featSectionAlerts",
    rows: [
      {
        key: "priceAlerts",
        labelKey: "featPriceAlerts",
        values: tierValues((l) => num(l.priceAlerts) as string),
      },
      {
        key: "lineAlerts",
        labelKey: "featLineAlerts",
        values: tierValues((l) => l.lineAlerts),
      },
      {
        key: "weeklyDigest",
        labelKey: "featWeeklyDigest",
        values: tierValues((l) => l.weeklyDigest),
      },
    ],
  },
  {
    titleKey: "featSectionMarketplace",
    rows: [
      {
        key: "marketplaceFee",
        labelKey: "featMarketplaceFee",
        values: tierValues((l) => `${l.marketplaceFeePercent}%`),
      },
      {
        key: "listingBoost",
        labelKey: "featListingBoost",
        values: tierValues((l) =>
          l.listingBoostFree === 0 ? false : String(l.listingBoostFree),
        ),
      },
      {
        key: "autoPricing",
        labelKey: "featAutoPricing",
        values: tierValues((l) => l.autoPricing),
      },
      {
        key: "bulkPriceLookup",
        labelKey: "featBulkPriceLookup",
        values: tierValues((l) =>
          l.bulkPriceLookup === 0 ? false : `${l.bulkPriceLookup}/day`,
        ),
      },
    ],
  },
];

export const ALL_ROWS = FEATURE_SECTIONS.flatMap((s) => s.rows);

export function findRow(key: string) {
  return ALL_ROWS.find((r) => r.key === key);
}

export const PLAN_HIGHLIGHTS: Record<TierKey, string[]> = {
  FREE: ["priceHistory", "portfolioCards", "priceAlerts", "compareCards"],
  PRO: ["priceHistory", "csvExport", "portfolioCount", "priceAlerts"],
  PRO_PLUS: ["priceHistory", "portfolioCards", "portfolioCount", "priceAlerts"],
};

export type PlanDef = {
  key: TierKey;
  nameKey: TranslationKey;
  icon: typeof Crown | null;
  iconClass: string;
  cardClass: string;
  popular?: boolean;
  badge?: TranslationKey;
  badgeClass?: string;
  subtitleKey: TranslationKey;
  monthlyPlan?: CheckoutPlanKey;
  yearlyPlan?: CheckoutPlanKey;
  monthlyPrice?: string;
  yearlyPrice?: string;
  yearlyPerMonth?: string;
  ctaClass?: string;
};

export const PLANS: PlanDef[] = [
  {
    key: "FREE",
    nameKey: "freePlan",
    icon: null,
    iconClass: "",
    cardClass: "bg-card shadow-[var(--panel-shadow)]",
    subtitleKey: "freeSubtitle",
  },
  {
    key: "PRO",
    nameKey: "proPlan",
    icon: Crown,
    iconClass: "text-foreground",
    cardClass: "bg-card shadow-[var(--panel-shadow)] ring-1 ring-primary/25",
    popular: true,
    subtitleKey: "proSubtitle",
    monthlyPlan: "PRO_MONTHLY",
    yearlyPlan: "PRO_YEARLY",
    monthlyPrice: "฿129",
    yearlyPrice: "฿990",
    yearlyPerMonth: "฿83",
    ctaClass: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    key: "PRO_PLUS",
    nameKey: "proPlusPlan",
    icon: Sparkles,
    iconClass: "text-foreground",
    cardClass: "bg-card shadow-[var(--panel-shadow)]",
    badge: "bestForTraders",
    badgeClass: "bg-foreground text-background border-0",
    subtitleKey: "proPlusSubtitle",
    monthlyPlan: "PRO_PLUS_MONTHLY",
    yearlyPlan: "PRO_PLUS_YEARLY",
    monthlyPrice: "฿249",
    yearlyPrice: "฿1,990",
    yearlyPerMonth: "฿166",
    ctaClass: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
];
