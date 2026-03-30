"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { getTierConfig, type SubscriptionData } from "./profile-types";

type Props = {
  subscription: SubscriptionData;
};

export function SectionSubscription({ subscription }: Props) {
  const lang = useUIStore((s) => s.language);
  const tierCfg = getTierConfig(subscription.tier);
  const isTrial =
    subscription.trialStartedAt &&
    !subscription.hasStripeSubscription &&
    subscription.tier !== "FREE";
  const trialDaysLeft = subscription.tierExpiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.tierExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CreditCard className="size-5" />
          {t(lang, "subscription")}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">{t(lang, "yourPlan")}</p>
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={cn("text-sm font-semibold px-3 py-1", tierCfg.color)}>
            {tierCfg.label}
          </Badge>
          {isTrial && (
            <Badge variant="outline" className="border-blue-500/50 text-blue-500">
              {t(lang, "trialActive")} — {trialDaysLeft} {t(lang, "trialDaysLeft")}
            </Badge>
          )}
          {subscription.tierExpiresAt && !isTrial && subscription.tier !== "FREE" && (
            <span className="text-muted-foreground text-xs">
              {t(lang, "trialEndsIn")}{" "}
              {new Date(subscription.tierExpiresAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {subscription.hasStripeSubscription ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const res = await fetch("/api/subscription/portal", { method: "POST" });
                const json = await res.json();
                if (json.url) window.location.href = json.url;
              }}
            >
              {t(lang, "manageSubscription")}
            </Button>
          ) : (
            <Link href="/pricing">
              <Button size="sm">
                {subscription.tier === "FREE" ? t(lang, "upgradePlan") : t(lang, "viewPlans")}
              </Button>
            </Link>
          )}
          <Link href="/pricing">
            <Button variant="ghost" size="sm">
              {t(lang, "goToPricing")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
