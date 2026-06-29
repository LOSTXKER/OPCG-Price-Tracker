"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CreditCard,
  Eye,
  FolderOpen,
  Layers,
  LayoutGrid,
  Loader2,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet, apiPost, apiTry } from "@/lib/api/client";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n";
import { type ProfileStats, type SubscriptionData } from "./profile-types";
import {
  PLANS,
  PLAN_HIGHLIGHTS,
  buildFeatureSections,
  getLimits,
  type TierLimits,
} from "@/lib/billing";
import { useMarketplaceFees } from "@/hooks/use-marketplace-fees";
import { Surface } from "@/components/ui/surface";
import type { UserTier } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Props = {
  subscription: SubscriptionData;
  stats?: ProfileStats;
};

type PaymentMethod = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
} | null;


// ---------------------------------------------------------------------------
// Tier limits – derived from @/lib/billing (single source of truth)
// ---------------------------------------------------------------------------
type TierKey = "FREE" | "PRO" | "PRO_PLUS";

function getLimitsForTier(tier: string): TierLimits {
  return getLimits(tier as UserTier);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toEffectiveTier(tier: string): TierKey {
  // Treat both subscription and lifetime variants identically — display
  // tier never differentiates them. Use `resolveEffectiveTier(...)` from
  // `@/lib/billing` when subscription expiry must also be considered.
  const t = tier as UserTier;
  if (t === "PRO_PLUS" || t === "LIFETIME_PRO_PLUS") return "PRO_PLUS";
  if (t === "PRO" || t === "LIFETIME_PRO") return "PRO";
  return "FREE";
}

function isCurrentPlan(planKey: string, userTier: string) {
  const effective = toEffectiveTier(userTier);
  return planKey === effective;
}

function tierName(key: string, lang: Language) {
  if (key === "FREE") return t(lang, "freePlan");
  if (key === "PRO") return t(lang, "proPlan");
  return t(lang, "proPlusPlan");
}

const CANCEL_REASONS = [
  "cancelReasonTooExpensive", "cancelReasonNotUseful",
  "cancelReasonSwitchService", "cancelReasonTemporary", "cancelReasonOther",
] as const;

// ---------------------------------------------------------------------------
// Usage row
// ---------------------------------------------------------------------------
function UsageRow({ icon: Icon, label, desc, current, max, color, lang }: {
  icon: React.ElementType; label: string; desc?: string; current: number; max: number; color: string; lang: Language;
}) {
  const isUnlimited = !isFinite(max);
  const pct = isUnlimited ? 0 : max === 0 ? 100 : Math.min(100, (current / max) * 100);
  const isFull = pct >= 100 && !isUnlimited;
  const isHigh = pct > 80 && pct < 100;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", isFull ? "bg-muted text-muted-foreground" : "bg-secondary text-muted-foreground")}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-sm">{label}</span>
            {desc && <p className="text-meta text-muted-foreground/60 leading-tight">{desc}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isFull && <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{t(lang, "usageFull")}</span>}
            <span className={cn("text-xs font-medium tabular-nums", isFull ? "text-muted-foreground" : isHigh ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
              {current}/{isUnlimited ? "∞" : max}
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
          <div
            className={cn("h-full rounded-full transition-all duration-500", isUnlimited ? "w-0" : isFull ? "bg-muted-foreground/30" : isHigh ? "bg-amber-500" : color)}
            style={isUnlimited ? undefined : { width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render helpers (same as pricing page)
// ---------------------------------------------------------------------------
function RenderValue({ val, planKey, lang }: { val: string | boolean; planKey: string; lang: Language }) {
  if (typeof val === "boolean") {
    return val
      ? <Check className="mx-auto h-4 w-4 text-green-500 dark:text-green-400" />
      : <X className="mx-auto h-4 w-4 text-muted-foreground/30" />;
  }
  const isUnlimited = val === "∞";
  const isPaid = planKey !== "FREE";
  return (
    <span className={isPaid && isUnlimited ? "font-semibold text-foreground" : "font-medium"}>
      {isUnlimited ? t(lang, "unlimited") : val}
    </span>
  );
}

function RenderHighlightValue({ val, lang }: { val: string | boolean; lang: Language }) {
  if (typeof val === "boolean") {
    return val
      ? <Check className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
      : <X className="h-3.5 w-3.5 text-muted-foreground/30" />;
  }
  return (
    <span className="font-semibold text-foreground">
      {val === "∞" ? t(lang, "unlimited") : val}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SectionSubscription({ subscription, stats }: Props) {
  const lang = useUIStore((s) => s.language);
  const limits = getLimitsForTier(subscription.tier);
  const marketplaceFees = useMarketplaceFees();
  const featureSections = useMemo(
    () => buildFeatureSections({ marketplaceFees }),
    [marketplaceFees],
  );
  const findRow = (key: string) =>
    featureSections.flatMap((s) => s.rows).find((r) => r.key === key);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [loadingPM, setLoadingPM] = useState(!!subscription.hasStripeSubscription);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelComment, setCancelComment] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  useEffect(() => {
    if (!subscription.hasStripeSubscription) return;
    void apiTry(apiGet<{ paymentMethod: PaymentMethod }>("/api/me/payment-method"))
      .then((d) => setPaymentMethod(d?.paymentMethod ?? null))
      .finally(() => setLoadingPM(false));
  }, [subscription.hasStripeSubscription]);

  const openPortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const json = await apiTry(apiPost<{ url?: string }>("/api/subscription/portal"));
      if (json?.url) window.location.href = json.url;
    } finally {
      setPortalLoading(false);
    }
  }, []);

  const handleCancelManage = useCallback(() => {
    if (subscription.hasStripeSubscription) setCancelDialogOpen(true);
  }, [subscription.hasStripeSubscription]);

  const submitCancelReason = useCallback(async (skip: boolean) => {
    setCancelSubmitting(true);
    try {
      if (!skip && cancelReason) {
        await apiTry(apiPost("/api/me/cancel-reason", { reason: cancelReason, comment: cancelComment || undefined }));
      }
    } finally {
      setCancelDialogOpen(false);
      setCancelSubmitting(false);
      setCancelReason("");
      setCancelComment("");
      void openPortal();
    }
  }, [cancelReason, cancelComment, openPortal]);

  const isTrial = subscription.trialStartedAt && !subscription.hasStripeSubscription && subscription.tier !== "FREE";
  const trialDaysLeft = subscription.tierExpiresAt
    ? Math.max(0, Math.ceil((new Date(subscription.tierExpiresAt).getTime() - Date.now()) / 86400000))
    : 0;
  const isFreeNoTrial = subscription.tier === "FREE" && !subscription.trialUsed;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h2 className="text-h2">{t(lang, "subscription")}</h2>
        <p className="page-subtitle">{t(lang, "yourPlan")}</p>
      </div>

      {/* Trial banner */}
      {isTrial && (
        <Surface variant="subtle" className="flex items-center justify-center gap-3 border border-[var(--p-hair)] px-5 py-3">
          <Badge variant="secondary">{t(lang, "trialActive")}</Badge>
          <p className="text-sm text-muted-foreground">
            {t(lang, "trialEndsIn")} {trialDaysLeft} {t(lang, "days")}
          </p>
        </Surface>
      )}

      {/* ─── Plan Cards (3-column grid, same as /pricing) ─── */}
      <div className="grid items-start gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = isCurrentPlan(plan.key, subscription.tier);
          return (
            <div
              key={plan.key}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5",
                plan.cardClass,
                isCurrent && "ring-2 ring-primary/40",
              )}
            >
              {/* Plan name + icon */}
              <div className="flex items-center gap-2">
                {plan.icon && <plan.icon className={cn("size-5", plan.iconClass)} />}
                <div>
                  <h3 className="text-base font-bold leading-tight">{tierName(plan.key, lang)}</h3>
                  <p className="text-meta">{t(lang, plan.subtitleKey)}</p>
                </div>
              </div>

              {/* Price */}
              {plan.monthlyPrice ? (
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-extrabold tracking-tight">{plan.monthlyPrice}</span>
                  <span className="text-meta">{t(lang, "perMonth")}</span>
                </div>
              ) : (
                <p className="mt-3 text-2xl font-extrabold tracking-tight">{t(lang, "freePlan")}</p>
              )}

              {/* Key highlights */}
              <div className="mt-4 flex-1 space-y-2 border-t border-[var(--p-hair)] pt-4">
                {PLAN_HIGHLIGHTS[plan.key]?.map((featureKey) => {
                  const row = findRow(featureKey);
                  if (!row) return null;
                  const val = row.values[plan.key];
                  return (
                    <div key={featureKey} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t(lang, row.labelKey)}</span>
                      <RenderHighlightValue val={val} lang={lang} />
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-4">
                {isCurrent ? (
                  subscription.hasStripeSubscription ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={openPortal} disabled={portalLoading}>
                        {portalLoading && <Loader2 className="mr-1 size-3 animate-spin" />}
                        {t(lang, "manageSubscription")}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={handleCancelManage} disabled={portalLoading}>
                        {t(lang, "cancel")}
                      </Button>
                    </div>
                  ) : (
                    <Button disabled variant="outline" size="sm" className="w-full">
                      {t(lang, "currentPlan")}
                    </Button>
                  )
                ) : plan.key === "FREE" ? null : (
                  <Link href="/pricing">
                    <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      {t(lang, "upgradePlan")}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trial CTA (Free users who haven't tried) */}
      {isFreeNoTrial && (
        <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5">
          <div className="flex flex-col items-center gap-4 p-5 text-center sm:flex-row sm:text-left">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
              <Sparkles className="size-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold">{t(lang, "trialCtaTitle")}</h3>
              <p className="mt-0.5 text-meta max-w-md">{t(lang, "trialCtaDesc")}</p>
            </div>
            <Link href="/pricing" className="shrink-0">
              <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600">
                {t(lang, "trialCtaButton")}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Payment method ─── */}
      {subscription.hasStripeSubscription && (
        <div className="rounded-xl bg-card p-5 shadow-[var(--panel-shadow)]">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="size-4 text-muted-foreground" />
            <h3 className="text-h5">{t(lang, "paymentMethod")}</h3>
          </div>
          {loadingPM ? (
            <div className="flex justify-center py-3"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
          ) : paymentMethod ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                  <CreditCard className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium capitalize">{paymentMethod.brand} •••• {paymentMethod.last4}</p>
                  <p className="text-meta">{t(lang, "cardExpiry")} {String(paymentMethod.expMonth).padStart(2, "0")}/{paymentMethod.expYear}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={openPortal} disabled={portalLoading}>
                {portalLoading && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                {t(lang, "managePayment")}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t(lang, "noPaymentMethod")}</p>
          )}
        </div>
      )}

      {/* ─── Usage & Quota ─── */}
      {stats && (
        <div className="rounded-xl bg-card p-5 space-y-1 shadow-[var(--panel-shadow)]">
          <h3 className="text-h5 mb-3">{t(lang, "usageQuota")}</h3>
          <div className="divide-y divide-[var(--p-hair)]">
            <UsageRow icon={Layers} label={t(lang, "portfolioCards")} desc={t(lang, "portfolioCardsDesc")} current={stats.portfolioCardCount} max={limits.portfolioCards} color="bg-primary" lang={lang} />
            <UsageRow icon={FolderOpen} label={t(lang, "portfolioCollections")} desc={t(lang, "portfolioCollectionsDesc")} current={stats.portfolioCount} max={limits.portfolioCount} color="bg-primary" lang={lang} />
            <UsageRow icon={Eye} label={t(lang, "watchlistCards")} desc={t(lang, "watchlistCardsDesc")} current={stats.watchlistCount} max={limits.watchlistCards} color="bg-amber-500" lang={lang} />
            <UsageRow icon={Bell} label={t(lang, "priceAlerts")} desc={t(lang, "priceAlertsDesc")} current={stats.priceAlertCount} max={limits.priceAlerts} color="bg-blue-500" lang={lang} />
            <UsageRow icon={LayoutGrid} label={t(lang, "deckBuilds")} desc={t(lang, "deckBuildsDesc")} current={stats.deckCount} max={limits.deckCount} color="bg-purple-500" lang={lang} />
          </div>
        </div>
      )}

      {/* ─── Full Feature Comparison (same as /pricing) ─── */}
      <div>
        <h3 className="mb-4 text-center text-base font-bold">{t(lang, "compareAllFeatures")}</h3>

        {/* Mobile: per-plan card stack */}
        <div className="space-y-4 sm:hidden">
          {PLANS.map((plan) => {
            const isCurrent = isCurrentPlan(plan.key, subscription.tier);
            return (
              <Surface
                key={plan.key}
                variant="outline"
                className={cn(
                  "p-4 space-y-4",
                  isCurrent && "border-primary/40",
                )}
              >
                <div className="flex items-center gap-2">
                  {plan.icon && <plan.icon className={cn("size-5", plan.iconClass)} />}
                  <h4 className={cn("text-h5", isCurrent && "text-foreground")}>
                    {tierName(plan.key, lang)}
                  </h4>
                  {isCurrent && <span className="text-xs text-primary">★</span>}
                </div>
                <div className="space-y-4">
                  {featureSections.map((section) => (
                    <div key={section.titleKey} className="space-y-2">
                      <p className="text-eyebrow text-muted-foreground/60">
                        {t(lang, section.titleKey)}
                      </p>
                      <div className="divide-y divide-[var(--p-hair)]">
                        {section.rows.map((row) => (
                          <div
                            key={row.key}
                            className="flex items-center justify-between gap-3 py-2 text-sm"
                          >
                            <span className="text-muted-foreground">
                              {t(lang, row.labelKey)}
                            </span>
                            <span className="text-right">
                              <RenderValue val={row.values[plan.key]} planKey={plan.key} lang={lang} />
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

        {/* Desktop: comparison table */}
        <div className="hidden sm:block">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="pb-3 text-left font-medium text-muted-foreground" />
                {PLANS.map((plan) => {
                  const isCurrent = isCurrentPlan(plan.key, subscription.tier);
                  return (
                    <th key={plan.key} className="pb-3 text-center font-bold">
                      <div className="flex items-center justify-center gap-1.5">
                        {plan.icon && <plan.icon className={cn("size-4", plan.iconClass)} />}
                        <span className={isCurrent ? "text-foreground" : ""}>{tierName(plan.key, lang)}</span>
                        {isCurrent && <span className="text-xs text-primary">★</span>}
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
                    <td colSpan={4} className="pb-2 pt-5 text-eyebrow text-muted-foreground/60">
                      {t(lang, section.titleKey)}
                    </td>
                  </tr>
                  {section.rows.map((row) => (
                    <tr key={row.key} className="border-b border-[var(--p-hair)] last:border-b-0">
                      <td className="py-2.5 pr-4 text-muted-foreground">{t(lang, row.labelKey)}</td>
                      {PLANS.map((plan) => (
                        <td key={plan.key} className={cn(
                          "py-2.5 text-center text-sm",
                          isCurrentPlan(plan.key, subscription.tier) && "text-foreground",
                        )}>
                          <span className="inline-flex items-center justify-center">
                            <RenderValue val={row.values[plan.key]} planKey={plan.key} lang={lang} />
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

      {/* ─── Cancel reason dialog ─── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(lang, "cancelReasonTitle")}</DialogTitle>
            <DialogDescription>{t(lang, "cancelReasonDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {CANCEL_REASONS.map((key) => (
              <label key={key} className={cn(
                "ease-chrome flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors",
                cancelReason === key ? "border-primary bg-primary/5 font-medium" : "border-[var(--p-hair)] hover:bg-muted/70",
              )}>
                <input type="radio" name="cancel-reason" value={key} checked={cancelReason === key} onChange={() => setCancelReason(key)} className="sr-only" />
                <div className={cn("flex size-4 items-center justify-center rounded-full border-2 transition-colors", cancelReason === key ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                  {cancelReason === key && <div className="size-1.5 rounded-full bg-white" />}
                </div>
                {t(lang, key)}
              </label>
            ))}
          </div>
          <textarea
            className="w-full rounded-lg border border-[var(--p-hair)] bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={3} placeholder={t(lang, "cancelReasonComment")} value={cancelComment} onChange={(e) => setCancelComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => void submitCancelReason(true)} disabled={cancelSubmitting}>{t(lang, "cancelReasonSkip")}</Button>
            <Button variant="destructive" size="sm" onClick={() => void submitCancelReason(false)} disabled={cancelSubmitting || !cancelReason}>
              {cancelSubmitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              {t(lang, "cancelReasonSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
