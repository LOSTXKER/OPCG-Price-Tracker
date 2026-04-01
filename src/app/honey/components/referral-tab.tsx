"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Link2,
  MousePointerClick,
  Share2,
  Zap,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { Language } from "@/stores/ui-store";

export function ReferralTab({ lang }: { lang: Language }) {
  const [referralUrl, setReferralUrl] = useState<string | null>(null);
  const [totalClicks, setTotalClicks] = useState(0);
  const [todayClicks, setTodayClicks] = useState(0);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/honey/referral");
      if (!res.ok) return;
      const data = await res.json();
      setReferralUrl(data.referralUrl);
      setTotalClicks(data.totalClicks);
      setTodayClicks(data.todayClicks);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load]);

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

  if (!referralUrl) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="panel overflow-hidden">
        <div className="border-b px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Link2 className="size-4.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">{t(lang, "referralLink")}</h2>
              <p className="text-[11px] text-muted-foreground">Share and earn Honey</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs text-muted-foreground">
              {referralUrl}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-9 shrink-0 gap-1.5 rounded-lg px-4 text-xs"
            >
              {copied ? <Check className="size-3.5 text-price-up" /> : <Copy className="size-3.5" />}
              {copied ? t(lang, "referralCopied") : <Share2 className="size-3.5" />}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/40 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <MousePointerClick className="size-4 text-muted-foreground" />
                <span className="text-xl font-bold tabular-nums">{totalClicks}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t(lang, "referralClicks")}</p>
            </div>
            <div className="rounded-xl bg-primary/5 px-4 py-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Zap className="size-4 text-primary" />
                <span className="text-xl font-bold tabular-nums text-primary">{todayClicks}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{t(lang, "referralTodayClicks")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
