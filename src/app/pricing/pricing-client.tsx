"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Hexagon, Loader2 } from "lucide-react";
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
import { ApiError, apiPost } from "@/lib/api/client";
import { useAuthState } from "@/hooks/use-auth-state";
import {
  buildFeatureSections,
  checkoutPlanFor,
  effectiveTier,
  isLifetime,
  isPlanCurrent,
  parseCheckoutPlan,
  type CheckoutPlanKey,
  type TierKey,
} from "@/lib/billing";
import type { UserTier } from "@/generated/prisma/client";

const pricingFeatureSections = buildFeatureSections();
const CHECKOUT_INTENT_KEY = "meecard:checkout-intent";

type BillingFailure =
  | { kind: "checkout"; plan: CheckoutPlanKey }
  | { kind: "trial" }
  | { kind: "trial-refresh" }
  | { kind: "existing-subscription" }
  | { kind: "lifetime-protected" }
  | { kind: "trial-unavailable" };

type PricingClientProps = {
  checkoutPlan?: string;
  selectedCheckoutPlan?: string;
  checkoutCancelled?: boolean;
};

export default function PricingClient({
  checkoutPlan,
  selectedCheckoutPlan,
  checkoutCancelled = false,
}: PricingClientProps) {
  const router = useRouter();
  const lang = useUIStore((s) => s.language);
  const resumedPlan = parseCheckoutPlan(checkoutPlan ?? null);
  const selectedPlan =
    parseCheckoutPlan(selectedCheckoutPlan ?? null) ?? resumedPlan;
  const [billing, setBilling] = useState<"monthly" | "yearly">(
    selectedPlan?.endsWith("_YEARLY") ? "yearly" : "monthly",
  );
  const { settings } = useSettings();
  const { authed } = useAuthState();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingFailure, setBillingFailure] = useState<BillingFailure | null>(null);
  const resumedPlanRef = useRef<CheckoutPlanKey | null>(null);
  const activeTier = settings
    ? effectiveTier(
        settings.tier as UserTier,
        settings.tierExpiresAt ? new Date(settings.tierExpiresAt) : null,
      )
    : "FREE";

  const handleSubscribe = useCallback(async (plan: CheckoutPlanKey) => {
    const returnPath = `/pricing?checkout=${encodeURIComponent(plan)}`;
    if (authed === null) return;
    if (!authed) {
      sessionStorage.setItem(CHECKOUT_INTENT_KEY, plan);
      router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
      return;
    }

    setBillingFailure(null);
    setLoading(plan);
    try {
      const data = await apiPost<{ url?: string }>(
        "/api/subscription/checkout",
        { plan },
      );
      if (!data.url) throw new Error("Checkout URL missing");
      window.location.assign(data.url);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        sessionStorage.setItem(CHECKOUT_INTENT_KEY, plan);
        router.push(`/login?redirect=${encodeURIComponent(returnPath)}`);
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setBillingFailure({ kind: "lifetime-protected" });
        return;
      }
      if (error instanceof ApiError && error.status === 409) {
        setBillingFailure({ kind: "existing-subscription" });
        return;
      }
      setBillingFailure({ kind: "checkout", plan });
    } finally {
      setLoading(null);
    }
  }, [authed, router]);

  const handleTrial = useCallback(async () => {
    setBillingFailure(null);
    setLoading("trial");
    try {
      await apiPost("/api/subscription/trial");
      const refreshed = await refetchSettings();
      if (!refreshed) setBillingFailure({ kind: "trial-refresh" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent("/pricing")}`);
        return;
      }
      if (error instanceof ApiError && (error.status === 400 || error.status === 409)) {
        setBillingFailure({ kind: "trial-unavailable" });
        return;
      }
      setBillingFailure({ kind: "trial" });
    } finally {
      setLoading(null);
    }
  }, [router]);

  const handleTrialRefresh = useCallback(async () => {
    setLoading("trial-refresh");
    const refreshed = await refetchSettings();
    if (refreshed) setBillingFailure(null);
    setLoading(null);
  }, []);

  useEffect(() => {
    if (
      authed !== true ||
      !resumedPlan ||
      !settings ||
      resumedPlanRef.current === resumedPlan
    ) {
      return;
    }
    if (sessionStorage.getItem(CHECKOUT_INTENT_KEY) !== resumedPlan) return;
    const resumedTier: TierKey = resumedPlan.startsWith("PRO_PLUS")
      ? "PRO_PLUS"
      : "PRO";
    if (
      settings.stripeSubscriptionId ||
      isLifetime(settings.tier as UserTier) ||
      isPlanCurrent(resumedTier, activeTier)
    ) {
      sessionStorage.removeItem(CHECKOUT_INTENT_KEY);
      resumedPlanRef.current = resumedPlan;
      return;
    }
    sessionStorage.removeItem(CHECKOUT_INTENT_KEY);
    resumedPlanRef.current = resumedPlan;
    void handleSubscribe(resumedPlan);
  }, [activeTier, authed, handleSubscribe, resumedPlan, settings]);

  const isCurrentPlan = (planKey: TierKey) =>
    settings ? isPlanCurrent(planKey, activeTier) : false;
  const resumeTier: TierKey | null = resumedPlan
    ? resumedPlan.startsWith("PRO_PLUS")
      ? "PRO_PLUS"
      : "PRO"
    : null;
  const visibleResumePlan =
    resumeTier === "PRO" || resumeTier === "PRO_PLUS"
      ? checkoutPlanFor(resumeTier, billing)
      : null;
  const canContinueCheckout = Boolean(
    resumedPlan &&
      resumeTier &&
      authed === true &&
      settings &&
      !settings.stripeSubscriptionId &&
      !isLifetime(settings.tier as UserTier) &&
      !isPlanCurrent(resumeTier, activeTier),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        align="center"
        title={t(lang, "pricing")}
        description={t(lang, "pricingSubtitle")}
      />

      {checkoutCancelled && (
        <Surface
          variant="subtle"
          padding="md"
          role="status"
          aria-live="polite"
          className="mx-auto max-w-2xl text-center text-body-sm"
        >
          {t(lang, "billingCheckoutCancelled")}
        </Surface>
      )}

      {canContinueCheckout && visibleResumePlan && resumeTier && !billingFailure && (
        <Surface
          variant="subtle"
          padding="md"
          role="status"
          className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center sm:flex-row sm:text-left"
        >
          <p className="flex-1 text-body-sm text-foreground">
            {t(lang, "billingResumeCheckout")
              .replace(
                "{plan}",
                t(lang, resumeTier === "PRO_PLUS" ? "proPlusPlan" : "proPlan"),
              )
              .replace("{billing}", t(lang, billing))}
          </p>
          <Button
            type="button"
            size="sm"
            disabled={loading != null}
            onClick={() => void handleSubscribe(visibleResumePlan)}
          >
            {loading === visibleResumePlan && (
              <Loader2 aria-hidden className="mr-1.5 size-3.5 animate-spin" />
            )}
            {t(lang, "billingContinueCheckout")}
          </Button>
        </Surface>
      )}

      {billingFailure && (
        <Surface
          variant="outline"
          padding="md"
          role="alert"
          aria-live="assertive"
          className="mx-auto flex max-w-2xl flex-col items-center gap-3 border-destructive/30 text-center sm:flex-row sm:text-left"
        >
          <AlertCircle aria-hidden className="size-5 shrink-0 text-destructive" />
          <p className="flex-1 text-body-sm text-destructive">
            {t(
              lang,
              billingFailure.kind === "checkout"
                ? "billingCheckoutError"
                : billingFailure.kind === "existing-subscription"
                  ? "billingExistingSubscription"
                  : billingFailure.kind === "lifetime-protected"
                    ? "billingLifetimeProtected"
                    : billingFailure.kind === "trial-refresh"
                      ? "billingTrialRefreshError"
                  : billingFailure.kind === "trial-unavailable"
                    ? "billingTrialUnavailable"
                    : "billingTrialError",
            )}
          </p>
          {billingFailure.kind === "existing-subscription" ? (
            <Button
              render={<Link href="/settings/subscription" />}
              variant="outline"
              size="sm"
            >
              {t(lang, "manageSubscription")}
            </Button>
          ) : billingFailure.kind === "lifetime-protected" ||
            billingFailure.kind === "trial-unavailable" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBillingFailure(null)}
            >
              {t(lang, "close")}
            </Button>
          ) : billingFailure.kind === "trial-refresh" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading != null}
              onClick={() => void handleTrialRefresh()}
            >
              {t(lang, "retry")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading != null}
              onClick={() => {
                if (billingFailure.kind === "checkout") {
                  void handleSubscribe(billingFailure.plan);
                } else {
                  void handleTrial();
                }
              }}
            >
              {t(lang, "retry")}
            </Button>
          )}
        </Surface>
      )}

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <SegmentedControl<"monthly" | "yearly">
          value={billing}
          onChange={setBilling}
          variant="pill"
          compactVisual={false}
          ariaLabel={t(lang, "pricing")}
          options={[
            { value: "monthly", label: t(lang, "monthly") },
            {
              value: "yearly",
              label: t(lang, "yearly"),
              badge: (
                <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                  {t(lang, "billingSaveUpTo36")}
                </span>
              ),
            },
          ]}
        />
      </div>

      {/* Trial active banner (compact) */}
      {settings?.trialStartedAt &&
        activeTier !== "FREE" &&
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
        featureSections={pricingFeatureSections}
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
          const hasLifetimePlan =
            settings?.tier === "LIFETIME_PRO" ||
            settings?.tier === "LIFETIME_PRO_PLUS";
          if (hasLifetimePlan) {
            return (
              <Button disabled variant="outline" className="w-full">
                {t(lang, "billingLifetimePlanActive")}
              </Button>
            );
          }
          if (settings?.stripeSubscriptionId) {
            return (
              <Button
                render={<Link href="/settings/subscription" />}
                variant="outline"
                className="w-full"
              >
                {t(lang, "manageSubscription")}
              </Button>
            );
          }
          const planKey =
            billing === "monthly" ? plan.monthlyPlan : plan.yearlyPlan;
          if (!planKey) return null;
          return (
            <>
              <Button
                className={`w-full ${plan.ctaClass ?? ""}`}
                onClick={() => void handleSubscribe(planKey)}
                disabled={
                  loading != null ||
                  authed === null
                }
              >
                {loading === planKey && (
                  <Loader2 aria-hidden className="mr-2 size-4 animate-spin" />
                )}
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
        featureSections={pricingFeatureSections}
        variant="pricing"
        isCurrentPlan={isCurrentPlan}
      />
    </div>
  );
}
