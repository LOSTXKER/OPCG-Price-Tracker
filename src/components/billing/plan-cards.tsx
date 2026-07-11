import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import {
  PLAN_HIGHLIGHTS,
  PLANS,
  formatPlanFeatureValue,
  type FeatureSection,
  type PlanDef,
  type TierKey,
} from "@/lib/billing";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PlanCardsVariant = "pricing" | "subscription";
type BillingPeriod = "monthly" | "yearly";

type PlanCardsProps = {
  lang: Language;
  featureSections: FeatureSection[];
  variant: PlanCardsVariant;
  billing?: BillingPeriod;
  isCurrentPlan: (planKey: TierKey) => boolean;
  renderAction: (plan: PlanDef, isCurrent: boolean) => ReactNode;
};

function HighlightValue({
  value,
  lang,
}: {
  value: string | boolean;
  lang: Language;
}) {
  if (typeof value === "boolean") {
    return (
      <span>
        {value ? (
          <Check aria-hidden className="h-3.5 w-3.5 text-success" />
        ) : (
          <X aria-hidden className="h-3.5 w-3.5 text-muted-foreground/30" />
        )}
        <span className="sr-only">
          {t(lang, value ? "featureIncluded" : "featureNotIncluded")}
        </span>
      </span>
    );
  }

  return (
    <span className="font-semibold text-foreground">
      {value === "∞" ? t(lang, "unlimited") : formatPlanFeatureValue(value, lang)}
    </span>
  );
}

/** Canonical plan-card presentation shared by /pricing and subscription settings. */
export function PlanCards({
  lang,
  featureSections,
  variant,
  billing = "monthly",
  isCurrentPlan,
  renderAction,
}: PlanCardsProps) {
  const isPricing = variant === "pricing";
  const rowsByKey = new Map(
    featureSections.flatMap((section) => section.rows).map((row) => [row.key, row]),
  );

  return (
    <div
      className={cn(
        "grid items-start",
        isPricing ? "gap-5 md:grid-cols-3" : "gap-4 sm:grid-cols-3",
      )}
    >
      {PLANS.map((plan) => {
        const current = isCurrentPlan(plan.key);
        const content = (
          <>
            {isPricing && plan.popular && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 border-0 bg-foreground text-background text-xs font-semibold">
                {t(lang, "popular")}
              </Badge>
            )}
            {isPricing && plan.badge && (
              <Badge
                className={cn(
                  "absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold",
                  plan.badgeClass,
                )}
              >
                {t(lang, plan.badge)}
              </Badge>
            )}

            <div className={cn("flex items-center", isPricing ? "gap-2.5" : "gap-2")}>
              {plan.icon && (
                <plan.icon
                  className={cn(isPricing ? "h-6 w-6" : "size-5", plan.iconClass)}
                />
              )}
              <div>
                {isPricing ? (
                  <h2 className="text-h3 leading-tight">{t(lang, plan.nameKey)}</h2>
                ) : (
                  <h3 className="text-base font-bold leading-tight">
                    {t(lang, plan.nameKey)}
                  </h3>
                )}
                <p className="text-meta">{t(lang, plan.subtitleKey)}</p>
              </div>
            </div>

            {plan.monthlyPrice ? (
              isPricing ? (
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-display">
                      {billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {billing === "monthly" ? t(lang, "perMonth") : t(lang, "perYear")}
                    </span>
                  </div>
                  {billing === "yearly" && plan.yearlyPerMonth && (
                    <p className="mt-0.5 text-xs font-medium text-success">
                      ~{plan.yearlyPerMonth}
                      {t(lang, "perMonthShort")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold tracking-tight">
                    {plan.monthlyPrice}
                  </span>
                  <span className="text-meta">{t(lang, "perMonth")}</span>
                </div>
              )
            ) : isPricing ? (
              <p className="mt-4 text-display">{t(lang, "freePlan")}</p>
            ) : (
              <p className="mt-3 text-2xl font-extrabold tracking-tight">
                {t(lang, "freePlan")}
              </p>
            )}

            <div
              className={cn(
                "flex-1 border-t border-hair",
                isPricing ? "mt-5 space-y-2.5 pt-5" : "mt-4 space-y-2 pt-4",
              )}
            >
              {PLAN_HIGHLIGHTS[plan.key].map((featureKey) => {
                const row = rowsByKey.get(featureKey);
                if (!row) return null;

                return (
                  <div
                    key={featureKey}
                    className={cn(
                      "flex items-center justify-between",
                      isPricing ? "text-sm" : "text-xs",
                    )}
                  >
                    <span className="text-muted-foreground">{t(lang, row.labelKey)}</span>
                    <HighlightValue value={row.values[plan.key]} lang={lang} />
                  </div>
                );
              })}
            </div>

            <div className={isPricing ? "mt-5 space-y-2" : "mt-4"}>
              {renderAction(plan, current)}
            </div>
          </>
        );

        return isPricing ? (
          <Surface
            key={plan.key}
            variant="outline"
            padding="xl"
            className={cn(
              "relative flex flex-col",
              plan.popular && "border-foreground/30",
            )}
          >
            {content}
          </Surface>
        ) : (
          <div
            key={plan.key}
            className={cn(
              "relative flex flex-col rounded-2xl p-5",
              plan.cardClass,
              current && "ring-2 ring-primary/40",
            )}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}
