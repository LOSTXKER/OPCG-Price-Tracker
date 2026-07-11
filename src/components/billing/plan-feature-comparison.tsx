import { Fragment } from "react";
import { Check, X } from "lucide-react";

import { Surface } from "@/components/ui/surface";
import {
  PLANS,
  formatPlanFeatureValue,
  type FeatureSection,
  type TierKey,
} from "@/lib/billing";
import { t, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PlanFeatureComparisonProps = {
  lang: Language;
  featureSections: FeatureSection[];
  variant: "pricing" | "subscription";
  isCurrentPlan: (planKey: TierKey) => boolean;
};

function FeatureValue({
  value,
  planKey,
  centered,
  lang,
}: {
  value: string | boolean;
  planKey: TierKey;
  centered: boolean;
  lang: Language;
}) {
  if (typeof value === "boolean") {
    return (
      <span>
        {value ? (
          <Check aria-hidden className={cn("h-4 w-4 text-success", centered && "mx-auto")} />
        ) : (
          <X
            aria-hidden
            className={cn(
              "h-4 w-4 text-muted-foreground/30",
              centered && "mx-auto",
            )}
          />
        )}
        <span className="sr-only">
          {t(lang, value ? "featureIncluded" : "featureNotIncluded")}
        </span>
      </span>
    );
  }

  const isUnlimited = value === "∞";
  return (
    <span
      className={
        planKey !== "FREE" && isUnlimited
          ? "font-semibold text-foreground"
          : "font-medium"
      }
    >
      {isUnlimited ? t(lang, "unlimited") : formatPlanFeatureValue(value, lang)}
    </span>
  );
}

/** Canonical responsive feature comparison shared by billing surfaces. */
export function PlanFeatureComparison({
  lang,
  featureSections,
  variant,
  isCurrentPlan,
}: PlanFeatureComparisonProps) {
  const isPricing = variant === "pricing";

  return (
    <div>
      {isPricing ? (
        <h2 className="mb-6 text-center text-h3">{t(lang, "compareAllFeatures")}</h2>
      ) : (
        <h3 className="mb-4 text-center text-base font-bold">
          {t(lang, "compareAllFeatures")}
        </h3>
      )}

      <div className="space-y-4 sm:hidden">
        {PLANS.map((plan) => {
          const current = isCurrentPlan(plan.key);
          return (
            <Surface
              key={plan.key}
              variant="outline"
              padding={isPricing ? "lg" : undefined}
              className={cn(
                "space-y-4",
                !isPricing && "p-4",
                !isPricing && current && "border-primary/40",
              )}
            >
              <div className="flex items-center gap-2">
                {plan.icon && (
                  <plan.icon
                    className={cn(isPricing ? "h-5 w-5" : "size-5", plan.iconClass)}
                  />
                )}
                {isPricing ? (
                  <h3 className="text-h5">{t(lang, plan.nameKey)}</h3>
                ) : (
                  <h4 className={cn("text-h5", current && "text-foreground")}>
                    {t(lang, plan.nameKey)}
                  </h4>
                )}
                {!isPricing && current && <span className="text-xs text-primary">★</span>}
              </div>
              <div className="space-y-4">
                {featureSections.map((section) => (
                  <div key={section.titleKey} className="space-y-2">
                    <p className="text-eyebrow text-muted-foreground/60">
                      {t(lang, section.titleKey)}
                    </p>
                    <div className="divide-y divide-hair">
                      {section.rows.map((row) => (
                        <div
                          key={row.key}
                          className="flex items-center justify-between gap-3 py-2 text-sm"
                        >
                          <span className="text-muted-foreground">
                            {t(lang, row.labelKey)}
                          </span>
                          <span className="text-right">
                            <FeatureValue
                              value={row.values[plan.key]}
                              planKey={plan.key}
                              centered={!isPricing}
                              lang={lang}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          );
        })}
      </div>

      <div className="hidden sm:block">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                className={cn(
                  "pb-3 text-left font-medium text-muted-foreground",
                  isPricing && "sticky top-0 z-10 bg-background",
                )}
              />
              {PLANS.map((plan) => {
                const current = isCurrentPlan(plan.key);
                return (
                  <th
                    key={plan.key}
                    className={cn(
                      "pb-3 text-center font-bold",
                      isPricing && "sticky top-0 z-10 bg-background",
                    )}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {plan.icon && (
                        <plan.icon
                          className={cn(isPricing ? "h-4 w-4" : "size-4", plan.iconClass)}
                        />
                      )}
                      <span className={!isPricing && current ? "text-foreground" : undefined}>
                        {t(lang, plan.nameKey)}
                      </span>
                      {!isPricing && current && (
                        <span className="text-xs text-primary">★</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {featureSections.map((section) => (
              <Fragment key={section.titleKey}>
                <tr>
                  <td
                    colSpan={PLANS.length + 1}
                    className="pb-2 pt-5 text-eyebrow text-muted-foreground/60"
                  >
                    {t(lang, section.titleKey)}
                  </td>
                </tr>
                {section.rows.map((row) => (
                  <tr key={row.key} className="border-b border-hair last:border-b-0">
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {t(lang, row.labelKey)}
                    </td>
                    {PLANS.map((plan) => {
                      const current = isCurrentPlan(plan.key);
                      return (
                        <td
                          key={plan.key}
                          className={cn(
                            "py-2.5 text-center text-sm",
                            !isPricing && current && "text-foreground",
                          )}
                        >
                          <span className="inline-flex items-center justify-center">
                            <FeatureValue
                              value={row.values[plan.key]}
                              planKey={plan.key}
                              centered={!isPricing}
                              lang={lang}
                            />
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
