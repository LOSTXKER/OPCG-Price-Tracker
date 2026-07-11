"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Hexagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlanCards } from "@/components/billing/plan-cards";
import { PlanFeatureComparison } from "@/components/billing/plan-feature-comparison";
import { PageHeader } from "@/components/layout/page-header";
import { Surface } from "@/components/ui/surface";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { daysUntil } from "@/lib/utils/time";
import { useSettings, refetchSettings } from "@/hooks/use-settings";
import { apiPost, apiTry } from "@/lib/api/client";
import { useMarketplaceFees } from "@/hooks/use-marketplace-fees";
import { buildFeatureSections, isPlanCurrent, type TierKey } from "@/lib/billing";

export default function PricingClient() {
  const lang = useUIStore((s) => s.language);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const { settings } = useSettings();
  const [loading, setLoading] = useState<string | null>(null);
  const marketplaceFees = useMarketplaceFees();
  const featureSections = useMemo(
    () => buildFeatureSections({ marketplaceFees }),
    [marketplaceFees],
  );

  const handleSubscribe = async (plan: string) => {
    setLoading(plan);
    const data = await apiTry(
      apiPost<{ url?: string }>("/api/subscription/checkout", { plan }),
    );
    if (data?.url) {
      window.location.assign(data.url);
    } else {
      setLoading(null);
    }
  };

  const handleTrial = async () => {
    setLoading("trial");
    const ok = await apiTry(apiPost("/api/subscription/trial"));
    if (ok !== null) refetchSettings();
    setLoading(null);
  };

  const isCurrentPlan = (planKey: TierKey) =>
    settings ? isPlanCurrent(planKey, settings.tier) : false;

  return (
    <div className="space-y-10">
      <PageHeader
        align="center"
        title={t(lang, "pricing")}
        description={t(lang, "pricingSubtitle")}
      />

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <SegmentedControl<"monthly" | "yearly">
          value={billing}
          onChange={setBilling}
          variant="pill"
          ariaLabel={t(lang, "pricing")}
          options={[
            { value: "monthly", label: t(lang, "monthly") },
            {
              value: "yearly",
              label: t(lang, "yearly"),
              badge: (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                  -36%
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Trial active banner (compact) */}
      {settings?.trialStartedAt &&
        settings.tier !== "FREE" &&
        !settings.stripeSubscriptionId && (
          <div className="mx-auto flex max-w-lg items-center justify-center gap-3 rounded-xl border border-transparent dark:border-hair bg-muted/30 px-5 py-3">
            <Badge variant="secondary">
              {t(lang, "trialActive")}
            </Badge>
            {settings.tierExpiresAt && (
              <p className="text-sm text-muted-foreground">
                {t(lang, "trialEndsIn")}{" "}
                {daysUntil(settings.tierExpiresAt)}{" "}
                {t(lang, "days")}
              </p>
            )}
          </div>
        )}

      <PlanCards
        lang={lang}
        featureSections={featureSections}
        variant="pricing"
        billing={billing}
        isCurrentPlan={isCurrentPlan}
        renderAction={(plan, current) => {
          if (current) {
            return (
              <Button disabled variant="outline" className="w-full">
                {t(lang, "currentPlan")}
              </Button>
            );
          }
          if (plan.key === "FREE") {
            return settings ? null : <div className="h-9" />;
          }
          return (
            <>
              <Button
                className={`w-full ${plan.ctaClass ?? ""}`}
                onClick={() => {
                  const planKey =
                    billing === "monthly" ? plan.monthlyPlan : plan.yearlyPlan;
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
                    className="w-full text-meta"
                    onClick={handleTrial}
                    disabled={loading === "trial"}
                  >
                    {loading === "trial" ? "..." : t(lang, "startTrial")}
                  </Button>
                )}
            </>
          );
        }}
      />

      {/* Honey → Pro Alternative */}
      <Surface
        variant="subtle"
        padding="none"
        className="mx-auto max-w-2xl overflow-hidden"
      >
        <div className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Hexagon className="size-7 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-h5">
              {t(lang, "honeyPassTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(lang, "honeyPassDesc")}
            </p>
            <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge variant="secondary">
                {t(lang, "shopPackagePrefix")}{" "}
                Pro 7 {t(lang, "days")}
              </Badge>
              <Badge variant="secondary">
                {t(lang, "shopPackagePrefix")}{" "}
                Pro 30 {t(lang, "days")}
              </Badge>
              <Badge variant="secondary">
                {t(lang, "shopPackagePrefix")}{" "}
                Pro+ 30 {t(lang, "days")}
              </Badge>
            </div>
          </div>
          <Link href="/honey?tab=shop">
            <Button
              variant="outline"
              className="shrink-0 gap-1.5"
            >
              <Hexagon className="size-4" />
              {t(lang, "honeyPassCta")}
            </Button>
          </Link>
        </div>
      </Surface>

      <PlanFeatureComparison
        lang={lang}
        featureSections={featureSections}
        variant="pricing"
        isCurrentPlan={isCurrentPlan}
      />
    </div>
  );
}
