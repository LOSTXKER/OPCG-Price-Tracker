"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Clock3,
  CreditCard,
  Eye,
  FolderOpen,
  Layers,
  LayoutGrid,
  Loader2,
  Sparkles,
  Wallet,
} from "lucide-react";
import { PlanCards } from "@/components/billing/plan-cards";
import { PlanFeatureComparison } from "@/components/billing/plan-feature-comparison";
import { SettingsSectionHeader } from "@/components/settings/settings-section-header";
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
import { type ProfileStats, type SubscriptionData } from "@/components/profile/profile-types";
import {
  buildFeatureSections,
  getLimits,
  isPlanCurrent,
  type TierKey,
  type TierLimits,
} from "@/lib/billing";
import { Surface } from "@/components/ui/surface";
import type { UserTier } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Props = {
  subscription: SubscriptionData;
  stats?: ProfileStats;
  checkoutReturned?: boolean;
  checkoutRefreshing?: boolean;
  checkoutRefreshError?: boolean;
  onRefreshCheckout?: () => void;
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
function getLimitsForTier(tier: string): TierLimits {
  return getLimits(tier as UserTier);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CANCEL_REASONS = [
  "cancelReasonTooExpensive", "cancelReasonNotUseful",
  "cancelReasonSwitchService", "cancelReasonTemporary", "cancelReasonOther",
] as const;

const subscriptionFeatureSections = buildFeatureSections();

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
            {isFull && <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">{t(lang, "usageFull")}</span>}
            <span className={cn("text-xs font-medium tabular-nums", isFull ? "text-muted-foreground" : isHigh ? "text-warning" : "text-muted-foreground")}>
              {current}/{isUnlimited ? "∞" : max}
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
          <div
            className={cn("h-full rounded-full transition-all duration-500", isUnlimited ? "w-0" : isFull ? "bg-muted-foreground/30" : isHigh ? "bg-warning" : color)}
            style={isUnlimited ? undefined : { width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function SectionSubscription({
  subscription,
  stats,
  checkoutReturned = false,
  checkoutRefreshing = false,
  checkoutRefreshError = false,
  onRefreshCheckout,
}: Props) {
  const lang = useUIStore((s) => s.language);
  const limits = getLimitsForTier(subscription.tier);
  const isCurrentPlan = (planKey: TierKey) =>
    isPlanCurrent(planKey, subscription.tier);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [loadingPM, setLoadingPM] = useState(!!subscription.hasStripeSubscription);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState(false);
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
    setPortalError(false);
    setPortalLoading(true);
    try {
      const json = await apiPost<{ url?: string }>("/api/subscription/portal");
      if (!json.url) throw new Error("Billing portal URL missing");
      window.location.assign(json.url);
    } catch {
      setPortalError(true);
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
      <SettingsSectionHeader
        title={t(lang, "subscription")}
        description={t(lang, "yourPlan")}
      />

      {checkoutReturned && (
        <Surface
          variant="subtle"
          padding="md"
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3 border border-hair text-center sm:flex-row sm:text-left"
        >
          {checkoutRefreshError ? (
            <AlertCircle aria-hidden className="size-5 shrink-0 text-destructive" />
          ) : subscription.hasStripeSubscription ? (
            <CheckCircle2 aria-hidden className="size-5 shrink-0 text-success" />
          ) : (
            <Clock3 aria-hidden className="size-5 shrink-0 text-primary" />
          )}
          <div className="flex-1">
            <p className="text-label text-foreground">
              {t(
                lang,
                checkoutRefreshError
                  ? "billingCheckoutRefreshErrorTitle"
                  : subscription.hasStripeSubscription
                    ? "billingCheckoutConfirmedTitle"
                    : "billingCheckoutPendingTitle",
              )}
            </p>
            <p className="text-meta">
              {t(
                lang,
                checkoutRefreshError
                  ? "billingCheckoutRefreshErrorDesc"
                  : subscription.hasStripeSubscription
                    ? "billingCheckoutConfirmedDesc"
                    : "billingCheckoutPendingDesc",
              )}
            </p>
          </div>
          {!subscription.hasStripeSubscription && onRefreshCheckout && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={checkoutRefreshing}
              onClick={onRefreshCheckout}
            >
              {checkoutRefreshing && (
                <Loader2 aria-hidden className="mr-1.5 size-3.5 animate-spin" />
              )}
              {t(lang, "retry")}
            </Button>
          )}
        </Surface>
      )}

      {portalError && (
        <Surface
          variant="outline"
          padding="md"
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center gap-3 border-destructive/30 text-center sm:flex-row sm:text-left"
        >
          <AlertCircle aria-hidden className="size-5 shrink-0 text-destructive" />
          <p className="flex-1 text-body-sm text-destructive">
            {t(lang, "billingPortalError")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={portalLoading}
            onClick={() => void openPortal()}
          >
            {t(lang, "retry")}
          </Button>
        </Surface>
      )}

      {/* Trial banner */}
      {isTrial && (
        <Surface variant="subtle" className="flex items-center justify-center gap-3 border border-hair px-5 py-3">
          <Badge variant="secondary">{t(lang, "trialActive")}</Badge>
          <p className="text-sm text-muted-foreground">
            {t(lang, "trialEndsIn")} {trialDaysLeft} {t(lang, "days")}
          </p>
        </Surface>
      )}

      <PlanCards
        lang={lang}
        featureSections={subscriptionFeatureSections}
        variant="subscription"
        isCurrentPlan={isCurrentPlan}
        renderAction={(plan, current) => {
          if (current && subscription.hasStripeSubscription) {
            return (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={openPortal}
                  disabled={portalLoading}
                >
                  {portalLoading && <Loader2 className="mr-1 size-3 animate-spin" />}
                  {t(lang, "manageSubscription")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={handleCancelManage}
                  disabled={portalLoading}
                >
                  {t(lang, "cancel")}
                </Button>
              </div>
            );
          }
          if (current) {
            return (
              <Button disabled variant="outline" size="sm" className="w-full">
                {t(lang, "currentPlan")}
              </Button>
            );
          }
          if (plan.key === "FREE") return null;
          return (
            <Link href="/pricing">
              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {t(lang, "upgradePlan")}
              </Button>
            </Link>
          );
        }}
      />

      {/* Trial CTA (Free users who haven't tried) */}
      {isFreeNoTrial && (
        <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-amber-500/5">
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
          <div className="divide-y divide-hair">
            <UsageRow icon={Layers} label={t(lang, "portfolioCards")} desc={t(lang, "portfolioCardsDesc")} current={stats.portfolioCardCount} max={limits.portfolioCards} color="bg-primary" lang={lang} />
            <UsageRow icon={FolderOpen} label={t(lang, "portfolioCollections")} desc={t(lang, "portfolioCollectionsDesc")} current={stats.portfolioCount} max={limits.portfolioCount} color="bg-primary" lang={lang} />
            <UsageRow icon={Eye} label={t(lang, "watchlistCards")} desc={t(lang, "watchlistCardsDesc")} current={stats.watchlistCount} max={limits.watchlistCards} color="bg-amber-500" lang={lang} />
            <UsageRow icon={Bell} label={t(lang, "priceAlerts")} desc={t(lang, "priceAlertsDesc")} current={stats.priceAlertCount} max={limits.priceAlerts} color="bg-blue-500" lang={lang} />
            <UsageRow icon={LayoutGrid} label={t(lang, "deckBuilds")} desc={t(lang, "deckBuildsDesc")} current={stats.deckCount} max={limits.deckCount} color="bg-purple-500" lang={lang} />
          </div>
        </div>
      )}

      <PlanFeatureComparison
        lang={lang}
        featureSections={subscriptionFeatureSections}
        variant="subscription"
        isCurrentPlan={isCurrentPlan}
      />

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
                cancelReason === key ? "border-primary bg-primary/5 font-medium" : "border-hair hover:bg-muted/70",
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
            className="w-full rounded-lg border border-hair bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
