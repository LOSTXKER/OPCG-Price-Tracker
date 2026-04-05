"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Crown, Sparkles, X, Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";

type Settings = {
  tier: string;
  tierExpiresAt: string | null;
  trialUsed: boolean;
  trialStartedAt: string | null;
  stripeSubscriptionId: boolean;
};

type PlanDef = {
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

const PLANS: PlanDef[] = [
  {
    key: "FREE",
    icon: null,
    iconClass: "",
    cardClass: "border-border bg-card",
    subtitleKey: "freeSubtitle",
  },
  {
    key: "PRO",
    icon: Crown,
    iconClass: "text-foreground",
    cardClass: "border-foreground/20 bg-card shadow-md",
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
    cardClass: "border-foreground/20 bg-card shadow-md",
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

const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  FREE: ["priceHistory", "portfolioCards", "priceAlerts", "compareCards"],
  PRO: ["priceHistory", "csvExport", "portfolioCount", "priceAlerts"],
  PRO_PLUS: ["priceHistory", "portfolioCards", "priceAlerts", "autoPricing"],
};

type FeatureRow = {
  key: string;
  labelKey: TranslationKey;
  values: Record<string, string | boolean>;
};

type FeatureSection = {
  titleKey: TranslationKey;
  rows: FeatureRow[];
};

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    titleKey: "featSectionCore",
    rows: [
      {
        key: "priceHistory",
        labelKey: "featPriceHistory",
        values: { FREE: "30 days", PRO: "1 year", PRO_PLUS: "All-time" },
      },
      {
        key: "compareCards",
        labelKey: "featCardCompare",
        values: { FREE: "2", PRO: "5", PRO_PLUS: "∞" },
      },
      {
        key: "csvExport",
        labelKey: "featCsvExport",
        values: { FREE: false, PRO: true, PRO_PLUS: true },
      },
      {
        key: "honeyMultiplier",
        labelKey: "featHoneyMultiplier",
        values: { FREE: "1x", PRO: "2x", PRO_PLUS: "3x" },
      },
    ],
  },
  {
    titleKey: "featSectionPortfolio",
    rows: [
      {
        key: "portfolioCards",
        labelKey: "featPortfolioCards",
        values: { FREE: "30", PRO: "300", PRO_PLUS: "∞" },
      },
      {
        key: "portfolioCount",
        labelKey: "featPortfolioCount",
        values: { FREE: "1", PRO: "5", PRO_PLUS: "∞" },
      },
      {
        key: "watchlistCards",
        labelKey: "featWatchlistCards",
        values: { FREE: "15", PRO: "100", PRO_PLUS: "∞" },
      },
      {
        key: "decks",
        labelKey: "featDecks",
        values: { FREE: "1", PRO: "10", PRO_PLUS: "∞" },
      },
    ],
  },
  {
    titleKey: "featSectionAlerts",
    rows: [
      {
        key: "priceAlerts",
        labelKey: "featPriceAlerts",
        values: { FREE: "3", PRO: "30", PRO_PLUS: "∞" },
      },
      {
        key: "lineAlerts",
        labelKey: "featLineAlerts",
        values: { FREE: false, PRO: true, PRO_PLUS: true },
      },
      {
        key: "weeklyDigest",
        labelKey: "featWeeklyDigest",
        values: { FREE: false, PRO: true, PRO_PLUS: true },
      },
    ],
  },
  {
    titleKey: "featSectionMarketplace",
    rows: [
      {
        key: "marketplaceFee",
        labelKey: "featMarketplaceFee",
        values: { FREE: "5%", PRO: "4%", PRO_PLUS: "3%" },
      },
      {
        key: "listingBoost",
        labelKey: "featListingBoost",
        values: { FREE: false, PRO: "1", PRO_PLUS: "3" },
      },
      {
        key: "autoPricing",
        labelKey: "featAutoPricing",
        values: { FREE: false, PRO: false, PRO_PLUS: true },
      },
      {
        key: "bulkPriceLookup",
        labelKey: "featBulkPriceLookup",
        values: { FREE: false, PRO: "100/day", PRO_PLUS: "500/day" },
      },
    ],
  },
];

const ALL_ROWS = FEATURE_SECTIONS.flatMap((s) => s.rows);

function findRow(key: string) {
  return ALL_ROWS.find((r) => r.key === key);
}

export default function PricingClient() {
  const lang = useUIStore((s) => s.language);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setSettings(await res.json());
    } catch {
      /* not logged in */
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(null);
    }
  };

  const handleTrial = async () => {
    setLoading("trial");
    try {
      const res = await fetch("/api/subscription/trial", { method: "POST" });
      if (res.ok) {
        loadSettings();
        setLoading(null);
      }
    } catch {
      setLoading(null);
    }
  };

  const tierName = (key: string) => {
    if (key === "FREE") return t(lang, "freePlan");
    if (key === "PRO") return t(lang, "proPlan");
    return t(lang, "proPlusPlan");
  };

  const isCurrentPlan = (key: string) => {
    if (!settings) return false;
    if (key === "FREE" && settings.tier === "FREE") return true;
    if (
      key === "PRO" &&
      (settings.tier === "PRO" || settings.tier === "LIFETIME_PRO")
    )
      return true;
    if (
      key === "PRO_PLUS" &&
      (settings.tier === "PRO_PLUS" ||
        settings.tier === "LIFETIME_PRO_PLUS")
    )
      return true;
    return false;
  };

  const renderValue = (val: string | boolean, planKey: string) => {
    if (typeof val === "boolean") {
      return val ? (
        <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/30" />
      );
    }
    const isUnlimited = val === "∞";
    const isPaid = planKey !== "FREE";
    return (
      <span
        className={
          isPaid && isUnlimited
            ? "font-semibold text-foreground"
            : "font-medium"
        }
      >
        {isUnlimited ? t(lang, "unlimited") : val}
      </span>
    );
  };

  const renderHighlightValue = (val: string | boolean) => {
    if (typeof val === "boolean") {
      return val ? (
        <Check className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
      ) : (
        <X className="h-3.5 w-3.5 text-muted-foreground/30" />
      );
    }
    return (
      <span className="font-semibold text-foreground">
        {val === "∞" ? t(lang, "unlimited") : val}
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t(lang, "pricing")}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          {t(lang, "pricingSubtitle")}
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
              billing === "monthly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(lang, "monthly")}
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
              billing === "yearly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(lang, "yearly")}
            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
              -36%
            </span>
          </button>
        </div>
      </div>

      {/* Trial active banner (compact) */}
      {settings?.trialStartedAt &&
        settings.tier !== "FREE" &&
        !settings.stripeSubscriptionId && (
          <div className="mx-auto flex max-w-lg items-center justify-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-3">
            <Badge variant="secondary">
              {t(lang, "trialActive")}
            </Badge>
            {settings.tierExpiresAt && (
              <p className="text-sm text-muted-foreground">
                {t(lang, "trialEndsIn")}{" "}
                {Math.ceil(
                  (new Date(settings.tierExpiresAt).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                )}{" "}
                {t(lang, "days")}
              </p>
            )}
          </div>
        )}

      {/* Compact Plan Cards */}
      <div className="grid items-start gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`relative flex flex-col rounded-2xl border p-6 ${plan.cardClass}`}
          >
            {/* Badge */}
            {plan.popular && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 border-0 bg-foreground text-background text-[11px] font-semibold shadow-sm">
                Most Popular
              </Badge>
            )}
            {plan.badge && (
              <Badge
                className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[11px] font-semibold shadow-sm ${plan.badgeClass ?? ""}`}
              >
                {t(lang, plan.badge)}
              </Badge>
            )}

            {/* Plan name + price */}
            <div className="flex items-center gap-2.5">
              {plan.icon && (
                <plan.icon className={`h-6 w-6 ${plan.iconClass}`} />
              )}
              <div>
                <h2 className="text-lg font-bold leading-tight">
                  {tierName(plan.key)}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t(lang, plan.subtitleKey)}
                </p>
              </div>
            </div>

            {plan.monthlyPrice ? (
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight">
                    {billing === "monthly"
                      ? plan.monthlyPrice
                      : plan.yearlyPrice}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {billing === "monthly"
                      ? t(lang, "perMonth")
                      : t(lang, "perYear")}
                  </span>
                </div>
                {billing === "yearly" && plan.yearlyPerMonth && (
                  <p className="mt-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    ~{plan.yearlyPerMonth}
                    {t(lang, "perMonthShort")}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-3xl font-extrabold tracking-tight">
                {t(lang, "freePlan")}
              </p>
            )}

            {/* Key highlights */}
            <div className="mt-5 flex-1 space-y-2.5 border-t border-border/50 pt-5">
              {PLAN_HIGHLIGHTS[plan.key]?.map((featureKey) => {
                const row = findRow(featureKey);
                if (!row) return null;
                const val = row.values[plan.key];
                return (
                  <div
                    key={featureKey}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <span className="text-muted-foreground">
                      {t(lang, row.labelKey)}
                    </span>
                    {renderHighlightValue(val)}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="mt-5 space-y-2">
              {isCurrentPlan(plan.key) ? (
                <Button disabled variant="outline" className="w-full">
                  {t(lang, "currentPlan")}
                </Button>
              ) : plan.key === "FREE" ? (
                settings ? null : <div className="h-9" />
              ) : (
                <>
                  <Button
                    className={`w-full ${plan.ctaClass ?? ""}`}
                    onClick={() => {
                      const planKey =
                        billing === "monthly"
                          ? plan.monthlyPlan
                          : plan.yearlyPlan;
                      if (planKey) handleSubscribe(planKey);
                    }}
                    disabled={loading != null}
                  >
                    {t(lang, "subscribe")}
                  </Button>
                  {plan.key === "PRO" &&
                    settings &&
                    !settings.trialUsed &&
                    settings.tier === "FREE" && (
                      <Button
                        variant="ghost"
                        className="w-full text-xs text-muted-foreground"
                        onClick={handleTrial}
                        disabled={loading === "trial"}
                      >
                        {loading === "trial"
                          ? "..."
                          : t(lang, "startTrial")}
                      </Button>
                    )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Honey → Pro Alternative */}
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5">
        <div className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
            <Hexagon className="size-7 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold">
              {t(lang, "honeyPassTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "honeyPassDesc")}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                {lang === "TH"
                  ? "แพ็กเกจ"
                  : lang === "JP"
                    ? "パッケージ"
                    : "Package"}{" "}
                Pro 7 {t(lang, "days")} 🍯
              </Badge>
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                {lang === "TH"
                  ? "แพ็กเกจ"
                  : lang === "JP"
                    ? "パッケージ"
                    : "Package"}{" "}
                Pro 30 {t(lang, "days")} 🍯
              </Badge>
              <Badge
                variant="secondary"
                className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
              >
                {lang === "TH"
                  ? "แพ็กเกจ"
                  : lang === "JP"
                    ? "パッケージ"
                    : "Package"}{" "}
                Pro+ 30 {t(lang, "days")} 🍯
              </Badge>
            </div>
          </div>
          <Link href="/honey?tab=shop">
            <Button
              variant="outline"
              className="shrink-0 gap-1.5 border-amber-500/20 text-amber-700 hover:bg-amber-500/10 dark:text-amber-400"
            >
              <Hexagon className="size-4" />
              {t(lang, "honeyPassCta")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Full Feature Comparison Table */}
      <div>
        <h2 className="mb-6 text-center text-xl font-bold">
          {t(lang, "compareAllFeatures")}
        </h2>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[600px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky top-0 z-10 bg-background pb-3 text-left font-medium text-muted-foreground" />
                {PLANS.map((plan) => (
                  <th
                    key={plan.key}
                    className="sticky top-0 z-10 bg-background pb-3 text-center font-bold"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {plan.icon && (
                        <plan.icon
                          className={`h-4 w-4 ${plan.iconClass}`}
                        />
                      )}
                      {tierName(plan.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_SECTIONS.map((section) => (
                <Fragment key={section.titleKey}>
                  <tr>
                    <td
                      colSpan={4}
                      className="pb-2 pt-5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60"
                    >
                      {t(lang, section.titleKey)}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr
                      key={row.key}
                      className="border-b border-border/30 last:border-b-0"
                    >
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {t(lang, row.labelKey)}
                      </td>
                      {PLANS.map((plan) => (
                        <td
                          key={plan.key}
                          className="py-2.5 text-center text-[13px]"
                        >
                          <span className="inline-flex items-center justify-center">
                            {renderValue(
                              row.values[plan.key],
                              plan.key,
                            )}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
