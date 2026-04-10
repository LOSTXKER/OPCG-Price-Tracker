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
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Language } from "@/stores/ui-store";

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
      label: { TH: "คลิกทั้งหมด", EN: "Total Clicks", JP: "総クリック数" },
      accent: false,
    },
    {
      icon: Zap,
      value: todayClicks,
      label: { TH: "คลิกวันนี้", EN: "Today", JP: "今日" },
      accent: false,
    },
    {
      icon: Users,
      value: totalConversions,
      label: { TH: "เพื่อนที่สมัคร", EN: "Friends Joined", JP: "友達登録数" },
      accent: true,
    },
    {
      icon: Gift,
      value: totalEarned,
      label: { TH: "Honey ที่ได้", EN: "Honey Earned", JP: "獲得Honey" },
      accent: true,
      isHoney: true,
    },
  ];

  const steps = [
    {
      icon: Share2,
      title: { TH: "แชร์ลิงก์ของคุณ", EN: "Share your link", JP: "リンクをシェア" },
      desc: { TH: "ส่งลิงก์ให้เพื่อนผ่านช่องทางไหนก็ได้", EN: "Send your link to friends via any channel", JP: "友達にリンクを送信" },
    },
    {
      icon: UserPlus,
      title: { TH: "เพื่อนสมัครสมาชิก", EN: "Friend signs up", JP: "友達が登録" },
      desc: { TH: "เพื่อนเข้าลิงก์แล้วสมัครใช้งาน Meecard", EN: "Your friend clicks the link and creates an account", JP: "友達がリンクからアカウント作成" },
    },
    {
      icon: Gift,
      title: { TH: "ทั้งคู่ได้ Honey!", EN: "Both get Honey!", JP: "両方Honeyゲット!" },
      desc: { TH: "คุณได้ 100 🍯 เพื่อนได้ 50 🍯", EN: "You get 100 🍯, friend gets 50 🍯", JP: "あなたに100 🍯、友達に50 🍯" },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="panel overflow-hidden">
        <div className="border-b px-4 py-3.5">
          <h2 className="text-sm font-bold">{t(lang, "referralLink")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {lang === "TH" ? "แชร์ลิงก์แนะนำเพื่อรับ Honey" : lang === "JP" ? "リンクをシェアしてHoneyを獲得" : "Share your link to earn Honey"}
          </p>
        </div>

        {/* Link + Copy */}
        <div className="p-4">
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
                : lang === "TH" ? "คัดลอก" : lang === "JP" ? "コピー" : "Copy"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={cn("panel p-4 text-center", s.accent ? "border-teal-500/20 bg-teal-500/[0.03] dark:bg-teal-500/[0.04]" : "")}>
              <div className="flex items-center justify-center gap-1.5">
                <Icon className={cn("size-4", s.accent ? "text-teal-600 dark:text-teal-400" : "text-muted-foreground")} />
                <span className={cn("text-lg font-bold tabular-nums", s.accent ? "text-teal-600 dark:text-teal-400" : "")}>
                  {s.value.toLocaleString()}
                  {s.isHoney && <span className="ml-0.5 text-xs">🍯</span>}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.label[lang] ?? s.label.EN}
              </p>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="panel overflow-hidden">
        <div className="border-b px-4 py-3.5">
          <h2 className="text-sm font-bold">
            {lang === "TH" ? "วิธีการทำงาน" : lang === "JP" ? "仕組み" : "How it works"}
          </h2>
        </div>
        <div className="divide-y divide-border/40">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-4 px-4 py-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-600 dark:text-teal-400">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold">{step.title[lang] ?? step.title.EN}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {step.desc[lang] ?? step.desc.EN}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
