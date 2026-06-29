import { Crown, Sparkles } from "lucide-react";
import { TIER_LIMITS } from "./limits";
import type { TranslationKey } from "@/lib/i18n";

/**
 * Pricing-table & plan-card metadata. Numeric values come from `TIER_LIMITS`
 * via `tierValues` so /pricing and /settings/subscription never disagree
 * with the runtime gate logic.
 *
 * For fields that admins can override at runtime (currently the marketplace
 * fee per tier), call `buildFeatureSections({ marketplaceFees })` instead of
 * importing the static `FEATURE_SECTIONS`.
 */

const TIERS = ["FREE", "PRO", "PRO_PLUS"] as const;
type TierKey = (typeof TIERS)[number];

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

/** Admin-overridable fee values keyed by tier. */
export type MarketplaceFeeOverrides = Partial<Record<TierKey, number>>;

export interface BuildFeatureSectionsOptions {
  marketplaceFees?: MarketplaceFeeOverrides;
}

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
 * Build the pricing/comparison feature table. Admin-controlled values (e.g.
 * marketplace fee) are sourced from `options.marketplaceFees`; fall back to
 * compile-time defaults from `TIER_LIMITS` when not provided.
 */
export function buildFeatureSections(
  options: BuildFeatureSectionsOptions = {},
): FeatureSection[] {
  const { marketplaceFees } = options;
  const feeForTier = (tier: TierKey): number => {
    const override = marketplaceFees?.[tier];
    if (typeof override === "number" && Number.isFinite(override)) return override;
    return TIER_LIMITS[tier].marketplaceFeePercent;
  };

  return FEATURE_SECTIONS.map((section) =>
    section.rows.some((r) => r.key === "marketplaceFee")
      ? {
          ...section,
          rows: section.rows.map((row) =>
            row.key === "marketplaceFee"
              ? {
                  ...row,
                  values: Object.fromEntries(
                    TIERS.map((k) => [k, `${feeForTier(k)}%`]),
                  ),
                }
              : row,
          ),
        }
      : section,
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

export const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  FREE: ["priceHistory", "portfolioCards", "priceAlerts", "compareCards"],
  PRO: ["priceHistory", "csvExport", "portfolioCount", "priceAlerts"],
  PRO_PLUS: ["priceHistory", "portfolioCards", "priceAlerts", "autoPricing"],
};

export type PlanDef = {
  key: string;
  icon: typeof Crown | null;
  iconClass: string;
  cardClass: string;
  popular?: boolean;
  badge?: TranslationKey;
  badgeClass?: string;
  subtitleKey: TranslationKey;
  monthlyPlan?: string;
  yearlyPlan?: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
  yearlyPerMonth?: string;
  ctaClass?: string;
};

export const PLANS: PlanDef[] = [
  {
    key: "FREE",
    icon: null,
    iconClass: "",
    cardClass: "bg-card shadow-[var(--panel-shadow)]",
    subtitleKey: "freeSubtitle",
  },
  {
    key: "PRO",
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
