"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Gift,
  MousePointerClick,
  Share2,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { t } from "@/lib/i18n";
import type { Language } from "@/stores/ui-store";
import { SectionHeader } from "./_shared/section-header";

export function ReferralTab({
  lang,
  referralUrl,
  totalClicks,
  todayClicks,
  totalConversions,
  totalEarned,
}: {
  lang: Language;
  referralUrl: string;
  totalClicks: number;
  todayClicks: number;
  totalConversions: number;
  totalEarned: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!referralUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Meecard", url: referralUrl });
        return;
      } catch { /* user cancelled, fall through to copy */ }
    }
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    {
      icon: MousePointerClick,
      value: totalClicks,
      labelKey: "referralTotalClicks" as const,
    },
    {
      icon: Zap,
      value: todayClicks,
      labelKey: "referralTodayClicks2" as const,
    },
    {
      icon: Users,
      value: totalConversions,
      labelKey: "referralFriendsJoined" as const,
    },
    {
      icon: Gift,
      value: totalEarned,
      labelKey: "referralHoneyEarned" as const,
      isHoney: true,
    },
  ];

  const steps = [
    {
      icon: Share2,
      titleKey: "referralStepShareTitle" as const,
      descKey: "referralStepShareDesc" as const,
    },
    {
      icon: UserPlus,
      titleKey: "referralStepSignupTitle" as const,
      descKey: "referralStepSignupDesc" as const,
    },
    {
      icon: Gift,
      titleKey: "referralStepRewardTitle" as const,
      descKey: "referralStepRewardDesc" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t(lang, "referralLink")}
        description={t(lang, "referralSectionDescription")}
      />

      <Surface variant="panel" padding="md">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded-lg bg-muted/60 px-3 py-2.5 font-mono text-xs text-muted-foreground">
            {referralUrl || "..."}
          </div>
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={!referralUrl}
            className="h-10 shrink-0 gap-2 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {copied ? <Check className="size-4 text-price-up" /> : <Copy className="size-4" />}
            {copied
              ? t(lang, "referralCopied")
              : t(lang, "referralCopyLabel")}
          </Button>
        </div>
      </Surface>

      {/* Stats strip — single panel divided into cells, like the status bar above */}
      <Surface variant="panel" className="grid grid-cols-2 divide-x divide-y divide-border/40 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex flex-col items-start gap-1 p-4">
              <div className="flex items-center gap-1.5 text-meta">
                <Icon className="size-3.5 text-muted-foreground" />
                <span>{t(lang, s.labelKey)}</span>
              </div>
              <p className="text-h2 tabular-nums leading-none">
                {s.value.toLocaleString()}
                {"isHoney" in s && s.isHoney && <span className="ml-0.5 text-base">🍯</span>}
              </p>
            </div>
          );
        })}
      </Surface>

      {/* How it works */}
      <Surface variant="panel" className="overflow-hidden">
        <div className="border-b px-4 py-3.5">
          <h2 className="text-h3">
            {t(lang, "referralHowItWorksTitle")}
          </h2>
        </div>
        <div className="divide-y divide-border/40">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 px-4 py-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold tabular-nums text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t(lang, step.titleKey)}</p>
                <p className="mt-0.5 text-meta">
                  {t(lang, step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
