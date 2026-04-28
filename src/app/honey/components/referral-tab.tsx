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
      label: { TH: "คลิกทั้งหมด", EN: "Total Clicks", JP: "総クリック数" } as const,
    },
    {
      icon: Zap,
      value: todayClicks,
      label: { TH: "คลิกวันนี้", EN: "Today", JP: "今日" } as const,
    },
    {
      icon: Users,
      value: totalConversions,
      label: { TH: "เพื่อนที่สมัคร", EN: "Friends Joined", JP: "友達登録数" } as const,
    },
    {
      icon: Gift,
      value: totalEarned,
      label: { TH: "Honey ที่ได้", EN: "Honey Earned", JP: "獲得Honey" } as const,
      isHoney: true,
    },
  ];

  const steps = [
    {
      icon: Share2,
      title: { TH: "แชร์ลิงก์ของคุณ", EN: "Share your link", JP: "リンクをシェア" } as const,
      desc: { TH: "ส่งลิงก์ให้เพื่อนผ่านช่องทางไหนก็ได้", EN: "Send your link to friends via any channel", JP: "友達にリンクを送信" } as const,
    },
    {
      icon: UserPlus,
      title: { TH: "เพื่อนสมัครสมาชิก", EN: "Friend signs up", JP: "友達が登録" } as const,
      desc: { TH: "เพื่อนเข้าลิงก์แล้วสมัครใช้งาน Meecard", EN: "Your friend clicks the link and creates an account", JP: "友達がリンクからアカウント作成" } as const,
    },
    {
      icon: Gift,
      title: { TH: "ทั้งคู่ได้ Honey!", EN: "Both get Honey!", JP: "両方Honeyゲット!" } as const,
      desc: { TH: "คุณได้ 100 🍯 เพื่อนได้ 50 🍯", EN: "You get 100 🍯, friend gets 50 🍯", JP: "あなたに100 🍯、友達に50 🍯" } as const,
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t(lang, "referralLink")}
        description={
          lang === "TH"
            ? "แชร์ลิงก์แนะนำเพื่อรับ Honey"
            : lang === "JP"
              ? "リンクをシェアしてHoneyを獲得"
              : "Share your link to earn Honey"
        }
      />

      <div className="panel p-4">
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

      {/* Stats strip — single panel divided into cells, like the status bar above */}
      <div className="panel grid grid-cols-2 divide-x divide-y divide-border/40 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex flex-col items-start gap-1 p-4">
              <div className="flex items-center gap-1.5 text-meta">
                <Icon className="size-3.5 text-muted-foreground" />
                <span>{s.label[lang] ?? s.label.EN}</span>
              </div>
              <p className="text-h2 tabular-nums leading-none">
                {s.value.toLocaleString()}
                {"isHoney" in s && s.isHoney && <span className="ml-0.5 text-base">🍯</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="panel overflow-hidden">
        <div className="border-b px-4 py-3.5">
          <h2 className="text-h3">
            {lang === "TH" ? "วิธีการทำงาน" : lang === "JP" ? "仕組み" : "How it works"}
          </h2>
        </div>
        <div className="divide-y divide-border/40">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 px-4 py-4">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold tabular-nums text-primary">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{step.title[lang] ?? step.title.EN}</p>
                <p className="mt-0.5 text-meta">
                  {step.desc[lang] ?? step.desc.EN}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
